const fsPromises = require('fs').promises;
const util = require('util');
const rally = require('rally');
const { get, map } = require('lodash');
const rallyConfig = require('./configs/rally-config.js');
const HtmlConverter = require('./src/htmlConverter.js');
const CSVCreator = require('./src/parser.js');

const queryUtil = rally.util.query;
const processingDir = './data/media';

const rallyApi = rally({
  user: "",
  pass: "",
});

let configsToProcess;
const attachmentsToFetch = [];

let fetchedData = [];

const typePromises = rallyConfig.types.map((type) => {
  return new Promise((resolve, reject) => {
    return fetchDataFromEndpoints(type)
      .then(dataList => processDataWithConfigs(dataList, configsToProcess))
      .then(value => {
        fsPromises.writeFile(`./data/${type}.json`,JSON.stringify(value, null, 2))
        return value;
      })
      .then(value => resolve(value))
      .catch(error => console.log(error));
  });
});


Promise.all(typePromises)
  .then((success) => {
    const value = success.reduce((init, current) => [...init, ...current] , []);

    const fieldsThatAddANewRow = map(configsToProcess.filter(({type}) => type === "Collection"), 'rallyApiField');

    const csvCreator = new CSVCreator({fieldsThatAddANewRow});

    csvCreator.createCSV(value);
    fsPromises.writeFile(`./data/combined.json`,JSON.stringify(value, null, 2))
  })
  .then(fetchAttachments)
  .catch(error => console.log(error));


function fetchDataFromEndpoints(type) {
  const endPointData = [];
  configsToProcess = getConfigsToProcess(type, rallyConfig);
  const requestStaticOptions = { type };
  const requestOptions = createRequestOptions(requestStaticOptions, configsToProcess, rallyConfig.filter);
  const dataFetchPromiseList = [];

  return new Promise((resolve, reject) => {
    return fetch(requestOptions)
      .then(data => {
        dataFetchPromiseList.push(Promise.resolve(data));
        const chunkedList = chunkRange(data.TotalResultCount);
        chunkedList.shift();

        chunkedList.forEach(({ min }) => dataFetchPromiseList.push(
          fetch(createRequestOptions({
              ...requestStaticOptions,
              start: min,
            },
            configsToProcess,
            rallyConfig.filter
          ))
        ));

        return Promise.all(dataFetchPromiseList)
          .then((results) => {
            results.forEach(chunk => endPointData.push(...chunk.Results));
            resolve(endPointData);
          });
      })
      .catch(e => console.log('Request fetching', e));
  })
  .catch(e => console.log('fetchDataFromEndpoints', e));
}

function chunkRange(max, chunkSize = 200, min = 1) {
  const numberOfChunks = max / chunkSize;
  const fullChunks = Math.floor(numberOfChunks);
  const chunkList = [];
  let chunk = 0;

  while (chunk < fullChunks) {
    const min = (chunkSize * chunk) + 1;
    chunk += 1;
    const max =  chunkSize * chunk;
    chunkList.push({min, max});
  }

  if (chunk !== numberOfChunks) {
    const min = (chunkSize * chunk) + 1;
    chunkList.push({min, max});
  }

  return chunkList;
}

function processDataWithConfigs(dataArray, configs) {
  return new Promise(resolve => {
    resolve(Promise.all(dataArray.map((data) => processConfigs(data, configs))));
  });
}

function processConfigs(data, configs) {
  const promiseMap = configs.map(config => Promise.resolve(configProcessor(config, data)));

  return Promise.all(promiseMap)
    .then(success => {
      const processedData = {};
      success.forEach(item => {
        processedData[item.key] = item.value;
      })
      return processedData;
    })
    .catch(error => console.log(error));
}


// Config Proceessing
function configProcessor (config, data) {
  let value = `Type was not supplied for confg: ${config.rallyApiField}.`;

  if (config.type) {
    switch (config.type.toLowerCase()) {
      case 'string':
        return processStringType(data, config);
        break;
      case 'collection':
        return processCollectionType(data, config);
      case 'mediacollection':
        return processMediaCollectionType(data, config);
        return
      default:
        value = `Unknown Type of ${config.type} supplied`;
    };
  }

  return value;
}

function processStringType(data, config) {
  const locationInData = config.locationInData || config.rallyApiField;
  const prefix = config.prefix || '';
  const postfix = config.postfix || '';
  let value =  config.staticValue || get(data, locationInData);

  value = (config.convert)
    ? new HtmlConverter(value)[config.convert]
    : value;

  return {
    key: config.keyToDisplayAs || config.rallyApiField,
    value: `${prefix}${value}${postfix}`
  };
}

function processCollectionType(data, config) {
  const locationInData = config.locationInData || config.rallyApiField;
  const ref = get(data, locationInData);

  return fetch(createRequestOptions({ref}))
    .then((success) => {
      const formattedData = {
        key: config.keyToDisplayAs || config.rallyApiField,
        value: [],
      };

      if(success.Results.length > 0) {
        formattedData.value = success.Results.map(item => {
          return config.collectionFieldConfigs.map(field => configProcessor(field, item));
        });
      }

      return formattedData;
    })
    .catch(error => console.log(error));
}

function processMediaCollectionType(data, config) {
  const locationInData = config.locationInData || config.rallyApiField;
  const ref = get(data, locationInData);

  return fetch(createRequestOptions({ ref }))
    .then((success) => {

      if(error.tryAgain) {
        console.log('Got here', success);
      }

      const formattedData = {
        key: config.rallyApiField,
        value: [],
      }

      if(success.Results.length > 0) {
        formattedData.value = success.Results.map(item => {
          const mediaUrl = configProcessor(config.mediaUrlConfig, item);
          storeMediaObjForFetchingLater(item, config);
          return mediaUrl;
        });
      }

      return formattedData;
    })
    .catch(error => {
      return {
        key: config.rallyApiField,
        value: [],
      };
    });
}

function storeMediaObjForFetchingLater(data, config) {
  const ref = get(data, config.mediaRefObjectLocation);
  attachmentsToFetch.push({
    fileName: data[config.mediaUrlConfig.rallyApiField],
    content: fetch(createRequestOptions({ ref })),
  });
}

// Media Processing

function fetchAttachments() {
  return new Promise((resolve) => {
    attachmentsFetched = resolve;
    const promiseMap = attachmentsToFetch.map(({content}) => content);

    Promise.all(promiseMap)
      .then((mediaData) => {
        const saveMediaPromise = mediaData.map((media, index) =>
          fsPromises.writeFile(
            `${processingDir}/${attachmentsToFetch[index].fileName}`,
            Buffer.from(media.Content, 'base64'),
            {encoding: 'binary'}
          )
        );

        Promise.all(saveMediaPromise)
          .then(() => resolve());
      });
  });
}


// Rally Api Configs

function getConfigsToProcess(type, configs) {
  let fields = [
    ...configs.globalConfigs
  ]

  const typeConfigs = configs[`${type}Configs`];
  if (Array.isArray(typeConfigs)) {
    fields = [
      ...fields,
      ...typeConfigs,
    ]
  }

  return fields
}

function createRequestOptions(options, fetchConfigs, filterConfig) {
  const req = { ...options };
  if (fetchConfigs) {
    req.fetch = generateFetchData(fetchConfigs);
  }

  if (filterConfig) {
    req.query = generateQuery(filterConfig);
  }
  return req;
}

function generateFetchData(config) {
  const { globalConfigs } = config;

  return config.map(({rallyApiField}) => rallyApiField);


  return fields;
}

function generateQuery(filters) {
  let query = queryUtil;

  filters.forEach((filter) => {
    query = query[filter.operator](...filter.query);
  });

  return query;
}

function fetch(options) {
  return rallyApi.query(options)
    // .catch((error, b, c) => {tryAgain: options});
}
