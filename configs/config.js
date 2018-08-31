module.exports = {
  fieldsToGrab: [
    {
      fieldInXML: 'Description._text',
      mapFieldTo: 'Description',
    },
    {
      fieldInXML: 'Name._text',
      mapFieldTo: 'Summary',
    },
    {
      fieldInXML: 'Attachments._itemRefArray.Attachment',
      mapFieldTo: 'Attachment',
      isArray: {
        fieldInXML: '_attributes.ref',
        addColumnForEach: true,
      }
    }
  ],
  objectPathToProcessingLevel: 'Objects.HierarchicalRequirement',
};