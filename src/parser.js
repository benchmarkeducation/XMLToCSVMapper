const { get, map, without } = require('lodash');

class ObjectParser {
    constructor(configurations = {}) {
        this.configurations = configurations;
        this.fieldsToGrab = configurations.fieldsToGrab;
        this.proccessingLevel = configurations.objectPathToProcessingLevel;
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
        const {mapFieldTo} = this.currentField;

        if(!this._columnsToAdd[mapFieldTo]) {
            this._columnsToAdd[mapFieldTo] = {
                columnCount: 0,
                rowData: [],
            };
        }

        const field = this._columnsToAdd[mapFieldTo];

        if (columns.length > field.columnCount) {
            field.columnCount = columns.length;
        }

        field.rowData.push(columns);
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

    parse(objectToBeParsed = []) {
        this.parsedData = [];

        const root = (this.proccessingLevel)
            ? get(objectToBeParsed, this.proccessingLevel)
            : objectToBeParsed;

        if (Array.isArray(root)) {


          return this.startProccessing(root);

          return [
            this.headers,
            ...this.startProccessing(root),
          ];
        } else {
            throw Error('Parsing Error: Location trying to parse is not an array.');
        }

    }

    startProccessing(root = []) {
      this.proceesHeaders();
      root.forEach((item) => this.processItem(item));
      this.addExtraRows();
      const processedData = this.updateWithExtraColumns();
      return [
        this.headers,
        ...processedData,
      ];
    }

    processItem(item, fieldsToMap = this.fieldsToGrab) {
        const data = [];
        return fieldsToMap.map(field => {
            this.currentField = field;
            return this.processField(field, item);
        }).filter(value => value !== undefined);
    }

    processField(field, item) {
        const data = get(item, field.fieldInXML, '');
        const valueForNewColumn = field.staticValue || data;

        if (field.isArray) {
            this.processArray(field.isArray, data);
            return;
        }

        this.addExtraColumn([valueForNewColumn]);
    }

    processArray(isArrayField, list) {

      if (isArrayField.addRow) {
        this.rowsToBeAdded = { fields: isArrayField, data: list };
        return;
      }


      const listData = (Array.isArray(list))
          ? list.map(listItem => this.processField(isArrayField, listItem))
          : [];

      return listData;
    }

    addExtraColumn(listData = []) {
        this.columnsToAdd = listData;
    }

    updateWithExtraColumns(listOfDataArrays) {
      let headerColumns = [];
      const filledExtraColumns = map(this.columnsToAdd, ({columnCount, rowData}, headerCol) => {
        const extraHeader = Array(columnCount).fill(headerCol);
          headerColumns = [
            ...headerColumns,
            ...extraHeader,
          ];

        return rowData.map(row => {
          const paddedArray = Array(columnCount - row.length).fill('');
          return [...row, ...paddedArray];
        });
      });

      this.addHeaders(headerColumns);


      return filledExtraColumns;

      // return listOfDataArrays.map((dataRow, index) => {
      //   const updatedDataRow = [...dataRow];
      //
      //   filledExtraColumns.forEach(col => {
      //     updatedDataRow.push(...col[index]);
      //   });
      //
      //   return updatedDataRow;
      // });
    }

    addHeaders(fieldList = []) {
      this.headers.push(...fieldList);
    }

    proceesHeaders() {
      const headersList = this.fieldsToGrab.map((field) => {
        return (!this.isADynamicHeaderConfiguration(field))
          ? field.mapFieldTo
          : undefined;
      }).filter(value => value !== undefined);

      this.addHeaders(headersList);
    }

    isADynamicHeaderConfiguration(field) {
      let fieldToCheck = field;
      let value = false;

      if(fieldToCheck.isArray) {
        fieldToCheck = fieldToCheck.isArray;
      }

      if(fieldToCheck.addColumn) {
        value = true;
      }

      return value;
    }

    addExtraRows() {
      this.rowsToBeAdded.forEach(({data, field}) => {
        this.processItem(data, field);
        this.defaultMissingColumns(field);
      });
    }

    defaultMissingColumns(fields = [], defaultValue = '') {
      const keysFilledAlready = Object.keys(fields);
      const allFields = Object.keys(this.columnsToAdd);

      const fieldsToBePadded = without(allFields, ...keysFilledAlready);

      fieldsToBePadded.forEach(mapFieldTo => {
        this.currentField = { mapFieldTo };
        this.columnsToAdd = defaultValue;
      });
    }
}

module.exports = ObjectParser
