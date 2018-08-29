const fs = require('fs');
const xmlToJs = require('xml-js');
const toCSV = require('array-to-csv');
const { get } = require('lodash');
const {
  fieldsToGrab,
  objectPathToProcessingLevel,
} =  require('./configs/config');
const processingDir = './data';
const filesToBeProcessed = fs.readdirSync(processingDir);

if (filesToBeProcessed.length  === 0) {
  console.warn('No files available to be processed');
  process.exit();
}

const fileContent = fs.readFileSync(`${processingDir}/${filesToBeProcessed[1]}`);
const header = fieldsToGrab.map(({ mapFieldTo }) => mapFieldTo);

if (fileContent) {
  const js  = xmlToJs.xml2js(fileContent, {
    compact: true,
  });

  const levelToLoopStartLoopAt = get(js, objectPathToProcessingLevel);

  const newArray = levelToLoopStartLoopAt.map(level => {
    const grabbedData = [];

    fieldsToGrab.forEach(({fieldInXML}) => {
      grabbedData.push(get(level, fieldInXML));
    });

    return grabbedData;
  });

  const list = [
    header,
    ...newArray
  ];

  const csvData = toCSV(list);

  if (csvData) {
    fs.writeFileSync(`${processingDir}/processed_${filesToBeProcessed[1].split('.')[0]}.csv`, csvData);
  }
}

