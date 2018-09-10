const { get, map, without, zipWith } = require('lodash');
const toCSV = require('array-to-csv');
const fs = require('fs');

const processingDir = './data';

class ObjectParser {
  constructor(configurations = {}) {
      this.configurations = configurations;
      this.fieldsThatAddANewRow = configurations.fieldsThatAddANewRow;
      //this.fieldsToGrab = configurations.fieldsToGrab;

      //this.fieldsThatAddANewRow = ["Tasks"];
      this._columnsToAdd = {};
      this._headers = [];
      this._rowsToAdd = [];
  }

  get configurations() {
      return this._configurations;
  }

  set configurations(configurations) {
      this._configurations = configurations;
  }

  get parsedData() {
      return this._parsedData;
  }

  set parsedData(parsedData) {
      this._parsedData = parsedData;
  }

  get currentField() {
      return this._currentField;
  }

  set currentField(field) {
      this._currentField = field;
  }

  get columnsToAdd() {
    return this._columnsToAdd;
  }

  set columnsToAdd(columns = []) {
    const passedHeaders = map(columns, 'header');
    const columnData = map(columns, 'field');

    passedHeaders.forEach((header, index) => {
      if(!this._columnsToAdd[header]) {
          this._columnsToAdd[header] = {
              columnCount: 0,
              rowData: [],
          };
      }

      const field = this._columnsToAdd[header];
      const column = columnData[index];
      const columnLength = Array.isArray(column)
        ? column.length
        : 1;


      if (columnLength > field.columnCount) {
          field.columnCount = columnLength;
      }

      field.rowData.push(column);
    });
  }

  get headers() {
    return this._headers;
  }

  get rowsToBeAdded() {
    return this._rowsToAdd;
  }

  set rowsToBeAdded(rowConfig = {}) {
    this._rowsToAdd.push(rowConfig);
  }

  createCSV(objectToBeParsed = []) {
    if (Array.isArray(objectToBeParsed)) {
      const processedDataArray = this.startProccessing(objectToBeParsed);
      const csvData = toCSV(processedDataArray);

      if (csvData) {
        fs.writeFileSync(`${processingDir}/processed.csv`, csvData);
      }
    } else {
        throw Error('Parsing Error: Location trying to parse is not an array.');
    }
  }

  startProccessing(root = []) {
    root.forEach((item, index) => this.processItem(item, index));
    this.addExtraRows();
    const processedData = this.updateWithExtraColumns();
    return [
      this.headers,
      ...processedData,
    ];
  }

  processItem(item, itemIndex) {
    return map(item, (field, header) => {
      return this.processField(field, header, itemIndex);
    });
  }

  processField(field, header, itemIndex) {
    let data = field;

    if (Array.isArray(field)) {
        data = this.processArray(field, header, itemIndex);
    }

    if (!this.fieldsThatAddANewRow.includes(header)) {
      this.addExtraColumn([{header, field: data}]);
    }
  }

  processArray(list, header, itemIndex) {
    // TODO: pull in config here
    if (this.fieldsThatAddANewRow.includes(header) && list.length > 0) {
      this.rowsToBeAdded = { parentIndex: itemIndex, data: list };
      return;
    }

    const listData = (Array.isArray(list))
      ? list.map(listItem => listItem.value)
      : [];

    return listData;
  }

  addExtraColumn(listData = []) {
      this.columnsToAdd = listData;
  }

  updateWithExtraColumns() {
    let headerColumns = [];

    const filledExtraColumns = map(this.columnsToAdd, ({columnCount, rowData}, headerCol) => {
      const extraHeader = Array(columnCount).fill(headerCol);
        headerColumns = [
          ...headerColumns,
          ...extraHeader,
        ];

      return rowData.map(row => {
        if (Array.isArray(row)) {
          const paddedArray = Array(columnCount - row.length).fill('');
          return [...row, ...paddedArray];
        }

        return row;
      });
    });

    this.addHeaders(headerColumns);

    return zipWith(...filledExtraColumns, (...args) => {
      const row = []
      args.forEach(arg => {
        if(Array.isArray(arg)) {
          row.push(...arg);
          return;
        }
        row.push(arg);
      });

      return row;
    });
  }

  addHeaders(fieldList = []) {
    this.headers.push(...fieldList);
  }

  // proceesHeaders() {
  //   const headersList = this.fieldsToGrab.map((field) => {
  //     return (!this.isADynamicHeaderConfiguration(field))
  //       ? field.mapFieldTo
  //       : undefined;
  //   }).filter(value => value !== undefined);
  //
  //   this.addHeaders(headersList);
  // }

  // isADynamicHeaderConfiguration(field) {
  //   let fieldToCheck = field;
  //   let value = false;
  //
  //   if(fieldToCheck.isArray) {
  //     fieldToCheck = fieldToCheck.isArray;
  //   }
  //
  //   if(fieldToCheck.addColumn) {
  //     value = true;
  //   }
  //
  //   return value;
  // }

  addExtraRows() {
    this.rowsToBeAdded.forEach(({data}) => {
      data.forEach((item) => {
        item.forEach(field => this.processField(field.value, field.key));
        this.defaultMissingColumns(item);
      });
    });
  }

  defaultMissingColumns(data = [], defaultValue = '') {
    const keysFilledAlready = map(data, 'key');
    const allFields = Object.keys(this.columnsToAdd);

    const fieldsToBePadded = without(allFields, ...keysFilledAlready);

    fieldsToBePadded.forEach(header => {
      this.addExtraColumn([{header, field: defaultValue}]);
    });
  }
}

module.exports = ObjectParser
