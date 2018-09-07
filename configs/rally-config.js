module.exports = {
  types: [
    "hierarchicalrequirement"
  ],
  filter: [
    ["Iteration", "=", null],
    //["Project.Name", "=", "Core Team"],
    ["Project.Name", "=", "Digital Instruction Software Team"],
  ],
  globalConfigs: [
    { rallyApiField: "Name", type:"String" },
    {
      rallyApiField: "IssueType",
      staticValue: "Task",
      type: "String"
    },
    {
      rallyApiField: "Description",
      type: 'String',
      convert: 'jiraWiki',
    },
    {
      rallyApiField: "Attachments",
      type: 'MediaCollection',
      needsFetching: true,
      mediaRefObjectLocation: 'Content',
      mediaUrlConfig: {
        rallyApiField: "Name",
        type:"String",
        prefix: "https://lms2-kvalentine.benchmarkuniverse.com/rallyImages/",
      }
    },
    {
      rallyApiField: "Tasks",
      type: 'Collection',
      collectionFieldConfigs: [
        { rallyApiField: "Name", type:"String" },
        { rallyApiField: "State", type:"String" },
        {
          rallyApiField: "IssueType",
          staticValue: "Sub-task",
          type: "String"
        },
      ]
    },
    { rallyApiField: "Notes", type:"String"},
    { rallyApiField: "PlanEstimate", type: "String" },
    { rallyApiField: "Project", type: "String", locationInData: "Project.Name"},
    { rallyApiField: "c_POStatus", type: "String"},
    { rallyApiField: "ScheduleState", type: "String"},
  ],
  // defectConfigs: [
  //   { rallyApiField: "Environment", jiraCSVField: "Summary" },
  //   { rallyApiField: "Priority", jiraCSVField: "Summary" },
  //   { rallyApiField: "Submited By", jiraCSVField: "Summary" },
  //   { rallyApiField: "Creation Date", jiraCSVField: "Summary" },
  // ]
}

//
// Digital Instruction Software Team
// Sprial District Data
// Documentation
