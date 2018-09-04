const fs = require('fs');
const xmlToJs = require('xml-js');
const toCSV = require('array-to-csv');
const { get } = require('lodash');
const ObjectParser = require('./src/parser');
const configs =  require('./configs/config');
const processingDir = './data';
const filesToBeProcessed = fs.readdirSync(processingDir);

if (filesToBeProcessed.length  === 0) {
  console.warn('No files available to be processed');
  process.exit();
}

const parser = new ObjectParser(configs);

const fileContent = fs.readFileSync(`${processingDir}/${filesToBeProcessed[1]}`);

const header = configs.fieldsToGrab.map(({ mapFieldTo }) => mapFieldTo);

if (fileContent) {
  const js  = xmlToJs.xml2js(fileContent, {
    compact: true,
    textFn(text) {
      return text.replace(/"/g, '\'');
    }
  });

  const list = parser.parse(js);
  // const addedColumns = parser.columnsToAdd;

  // const list = [
  //   header,
  //   ...newArray
  // ];
  debugger;
  const csvData = toCSV(list);

  if (csvData) {
    fs.writeFileSync(`${processingDir}/processed_${filesToBeProcessed[1].split('.')[0]}.csv`, csvData);
  }
}
