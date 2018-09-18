const { get, map, without, zipWith, isFinite } = require('lodash');
const toCSV = require('array-to-csv');
const fs = require('fs');

const processingDir = './data';

class ObjectParser {
  constructor(configurations = {}) {
      this.configurations = configurations;
      this.fieldsThatAddANewRow = configurations.fieldsThatAddANewRow;
      this._columnsToAdd = {};
      this._headers = [];
      this._rowsToAdd = [];
      this._rowCount = 0;
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
      let column = [columnData[index]];
      const columnLength = Array.isArray(column[0])
        ? column[0].length
        : 1;

      if (isFinite(columns[index].indexToInsertAt)) {
        const valuesInFieldAlready = field.rowData.length;

        if(columns[index].indexToInsertAt > valuesInFieldAlready) {
          column = [
            ...Array(columns[index].indexToInsertAt - valuesInFieldAlready).fill(''),
            ...column,
          ];
        }
      }

      if (columnLength > field.columnCount) {
          field.columnCount = columnLength;
      }

      field.rowData.push(...column);
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

  get rowCount(){
    return this._rowCount;
  }

  set rowCount(count) {
    this._rowCount = count;
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
    map(item, (field, header) => {
      this.processField(field, header, itemIndex);
    });
    this.rowCount += 1;
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
    if (this.fieldsThatAddANewRow.includes(header) && list.length > 0) {
      this.rowsToBeAdded = { parentIndex: itemIndex, data: list };
      // TODO: Make this be driven by configs
      this.addExtraColumn([{header: 'IssueId', field: itemIndex, indexToInsertAt: itemIndex}]);
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

      let filledRows = rowData;

      if (this.rowCount > rowData.length) {
        filledRows = [
          ...filledRows,
          ...Array(this.rowCount - rowData.length).fill('')
        ];
      }

      return filledRows.map(row => {
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

  addExtraRows() {
    this.rowsToBeAdded.forEach(({data, parentIndex}) => {
      data.forEach((item, index) => {
        const indexInParsedData = this.rowCount;
        item.forEach(field => this.processField(field.value, field.key));
        // TODO: Make this be driven by configs
        this.addExtraColumn([{header: 'ParentId', field: parentIndex, indexToInsertAt: indexInParsedData}]);
        this.rowCount += 1;
        this.defaultMissingColumns(item, ['ParentId']);
      });
    });
  }

  defaultMissingColumns(data = [], keysToIgnore = [], defaultValue = '', ) {
    const keysFilledAlready = [
      ...map(data, 'key'),
      ...keysToIgnore
    ];
    const allFields = Object.keys(this.columnsToAdd);

    const fieldsToBePadded = without(allFields, ...keysFilledAlready);

    fieldsToBePadded.forEach(header => {
      const fillValue =  (this.columnsToAdd[header].columnCount > 1) ? [] : defaultValue;
      this.addExtraColumn([{header, field: fillValue}]);
    });
  }
}

module.exports = ObjectParser
