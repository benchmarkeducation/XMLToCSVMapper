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
      isArray: true,
      addsColumnForEach: true,
      arrayItemFieldWithData: '_attributes.ref',
    }
  ],
  objectPathToProcessingLevel: 'Objects.HierarchicalRequirement',
};