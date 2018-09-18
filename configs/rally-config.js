module.exports = {
  types: [
    "hierarchicalrequirement",
    // "defect"
  ],
  filter: [
    {
      operator: 'where',
      query: ["Iteration", "!=", null]
    },
    // {
    //   operator: 'or',
    //   query: ["Project.Name", "=", "Digital Instruction Software Team"],
    // },
    // {
    //   operator: 'and',
    //   query: ["Iteration", "=", null]
    // },
  ],
  globalConfigs: [
    { rallyApiField: "Name", type:"String" },
    { rallyApiField: "Iteration", type: "String", locationInData: "Iteration.Name"},
    // {
    //   rallyApiField: "IssueType",
    //   staticValue: "Task",
    //   type: "String"
    // },
    {
      rallyApiField: "Description",
      type: 'String',
      convert: 'markdown',
    },
    // {
    //   rallyApiField: "Attachments",
    //   type: 'MediaCollection',
    //   mediaRefObjectLocation: 'Content',
    //   mediaUrlConfig: {
    //     rallyApiField: "Name",
    //     type:"String",
    //     prefix: "https://lms2-kvalentine.benchmarkuniverse.com/media/",
    //   }
    // },
    // {
    //   rallyApiField: "Tasks",
    //   type: 'Collection',
    //   collectionFieldConfigs: [
    //     { rallyApiField: "Name", type:"String" },
    //     { rallyApiField: "State", type:"String", keyToDisplayAs: "ScheduleState" },
    //     {
    //       rallyApiField: "IssueType",
    //       staticValue: "Sub-task",
    //       type: "String"
    //     },
    //   ]
    // },
    { rallyApiField: "Notes", type:"String"},
    { rallyApiField: "PlanEstimate", type: "String" },
    { rallyApiField: "Project", type: "String", locationInData: "Project.Name"},
    { rallyApiField: "c_POStatus", type: "String"},
    { rallyApiField: "ScheduleState", type: "String"},
    { rallyApiField: "Release", type: "String", locationInData: 'Release._refObjectName'},
  ],
  defectConfigs: [
    { rallyApiField: "Environment", type: "String" },
    { rallyApiField: "Priority", type: "String" },
    { rallyApiField: "SubmittedBy", type: "String", locationInData:"SubmittedBy._refObjectName" },
    { rallyApiField: "CreationDate", type: "String" },
  ]
}

//
// Digital Instruction Software Team
// Sprial District Data
// Documentation
