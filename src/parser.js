const { get, map } = require('lodash');

class ObjectParser {
    constructor(configurations = {}) {
        this.configurations = configurations;
        this.fieldsToGrab = configurations.fieldsToGrab;
        this.proccessingLevel = configurations.objectPathToProcessingLevel;
        this._columnsToAdd = {};
        this._headers = [];
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

    parse(objectToBeParsed = []) {
        this.parsedData = [];

        const root = (this.proccessingLevel)
            ? get(objectToBeParsed, this.proccessingLevel)
            : objectToBeParsed;

        if (Array.isArray(root)) {
          this.proceesHeaders();
          const simpleProcessedData = this.startProccessing(root);
          const processedData = this.updateWithExtraColumns(simpleProcessedData);

          return [
            this.headers,
            ...processedData,
          ];
        } else {
            throw Error('Parsing Error: Location trying to parse is not an array.');
        }

    }

    startProccessing(root = []) {
        return root.map((item) => this.processItem(item));
    }

    processItem(item) {
        const data = [];
        return this.fieldsToGrab.map(field => {
            this.currentField = field;
            return this.processField(field, item);
        }).filter(value => value !== undefined);
    }

    processField(field, item) {
        const data = get(item, field.fieldInXML, '');

        if (field.isArray) {
            this.processArray(field.isArray, data);
            return;
        }

        if (field.addColumn) {
          const valueForNewColumn = field.staticValue || data;
          this.addExtraColumn([valueForNewColumn]);
          return;
        }

        return data;
    }

    processArray(isArrayField, list) {
      const listData = (Array.isArray(list))
          ? list.map(listItem => this.processField(isArrayField, listItem))
          : [];

      if (isArrayField.addColumn) {
        this.addExtraColumn(listData);
        return
      }

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

      return listOfDataArrays.map((dataRow, index) => {
        const updatedDataRow = [...dataRow];

        filledExtraColumns.forEach(col => {
          updatedDataRow.push(...col[index]);
        });

        return updatedDataRow;
      });
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
}

module.exports = ObjectParser
