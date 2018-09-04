module.exports = {
  fieldsToGrab: [
    {
      fieldInXML: 'Name._text',
      mapFieldTo: 'Summary',
    },
    {
      fieldInXML: 'Description._text',
      mapFieldTo: 'Description',
    },
    {
      staticValue: 'Story',
      mapFieldTo: 'IssueType',
      addColumn: true,
    },
    {
      fieldInXML: 'Attachments._itemRefArray.Attachment',
      mapFieldTo: 'Attachment',
      isArray: {
        fieldInXML: '_attributes.ref',
        addColumn: true,
      }
    },
    {
      fieldInXML: 'Tasks._itemRefArray.Task',
      isArray: {
        addRow: true,
        fieldsToGrab: [
          {
            fieldInXML: '_attributes.refObjectName',
            mapFieldTo: 'Summary',
          },
          {
            mapFieldTo: 'IssueType',
            staticValue: 'SubTask',
          }
        ],
      },
    },
  ],
  objectPathToProcessingLevel: 'Objects.HierarchicalRequirement',
};
