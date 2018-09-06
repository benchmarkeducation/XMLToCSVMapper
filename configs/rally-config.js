module.exports = {
  types: [
    "hierarchicalrequirement"
  ],
  filter: [
    ["Iteration", "=", null],
    ["Project.Name", "=", "Core Team"],
  ],
  globalConfigs: [
    { rallyApiField: "Name", type:"String" },
    //{ rallyApiField: "Description"},
    {
      rallyApiField: "Attachments",
      type: 'Collection',
      needsFetching: true,
      collectionFieldConfigs: [
        {
          rallyApiField: "Name",
          type:"String",
          prefix: "https://lms2-kvalentine.benchmarkuniverse.com/rallyImages/",
        },
      ]
    },
    //{ rallyApiField: "Tasks" },
    //{ rallyApiField: "Notes" },
    { rallyApiField: "PlanEstimate", type: "String" },
    { rallyApiField: "Project", type: "String", locationInData: "Project.Name"},
    { rallyApiField: "c_POStatus", type: "String"},
    //{ rallyApiField: "Notes, combined with descritption"},
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
