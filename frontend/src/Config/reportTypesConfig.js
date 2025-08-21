// Report Types Configuration
// This file contains all report type definitions and their CSV field mappings
// Add new report types here to extend the department reporting functionality

export const reportTypes = [
  {
    value: "publications",
    label: "Publications",
    description: "Export all publications data including journals, conferences, and other scholarly works",
    sectionNames: ["Publication", "Other Publication"],
  },
  {
    value: "grants",
    label: "Grants & Contract Funding",
    description: "Export department-wide grant and contract funding",
    sectionNames: ["Research or Equivalent Grants"],
  },
  {
    value: "awards",
    label: "Awards",
    description: "Export award information including dates, types, awarding organization, and details",
    sectionNames: ["Awards and Distinctions"],
  },
  {
    value: "presentations",
    label: "Presentations",
    description: "Export invited and other presentations and details.",
    sectionNames: ["Invited Presentations", "Other Presentations"],
  },
//   {
//     value: "service-university",
//     label: "Services to University",
//     description: "Export services to university.",
//     sectionNames: ["Services to University"],
//   },
//   {
//     value: "service-community",
//     label: "Services to Community",
//     description: "Export services to community.",
//     sectionNames: ["Services to Community"],
//   },
//   {
//     value: "service-hospital",
//     label: "Services to Hospital",
//     description: "Export services to hospital.",
//     sectionNames: ["Services to Hospital"],
//   },
//   {
//     value: "editorships",
//     label: "Editorships Report",
//     description: "Export editorships and editorial activities",
//     sectionNames: ["Editorships"],
//   },
//   {
//     value: "reviewers",
//     label: "Reviewers",
//     description: "Export reviewer activities and contributions",
//     sectionNames: ["Reviewers"],
//     },
//   {
//     value: "supervisory-experience",
//     label: "Supervisory Experience",
//     description: "Export supervisory experience and activities",
//     sectionNames: ["Supervisory Experience"],
//   },
];

// CSV Field Configurations for different report types
export const csvFieldConfigs = {
  publications: {
    headers: [
      "End Date",
      "First Name",
      "Last Name",
      "Title",
      "Publication Type",
      "Author Names",
      "Role",
      "Publication Status",
      "Citation",
      "Journal Title",
      "Keywords",
      "Publication ID",
      "Peer Reviewed",
      "Doi",
      "Link",
      "Volume",
      "Article Number",
    ],
    fieldMappings: [
      { header: "End Date", fields: ["end_date"] },
      { header: "First Name", fields: ["first_name"] },
      { header: "Last Name", fields: ["last_name"] },
      { header: "Title", fields: ["title", "publication_title"] },
      { header: "Publication Type", fields: ["publication_type", "type"] },
      { header: "Author Names", fields: ["author_names", "authors"] },
      { header: "Role", fields: ["role"] },
      { header: "Publication Status", fields: ["publication_status"] },
      { header: "Citation", fields: ["citation"] },
      { header: "Journal Title", fields: ["journal_title", "journal", "publication_name", "source"] },
      { header: "Keywords", fields: ["keywords"] },
      { header: "Publication ID", fields: ["publication_id"] },
      { header: "Peer Reviewed", fields: ["peer_reviewed"] },
      { header: "Doi", fields: ["doi"] },
      { header: "Link", fields: ["link", "url"] },
      { header: "Volume", fields: ["volume"] },
      { header: "Article Number", fields: ["article_number"] },
    ],
  },
  grants: {
    headers: [
      "Dates",
      "First Name",
      "Last Name",
      "Type",
      "Agency",
      "Sponsor",
      "Amount",
      "Title",
      "Comp",
      "Principal Investigator",
      "Co-Investigator",
      "Status - Only for Grants",
      "Department",
      "Program",
      "Footnote - Notes",
      "Highlight - Notes",
    ],
    fieldMappings: [
      { header: "Dates", fields: ["dates"] },
      { header: "First Name", fields: ["first_name"] },
      { header: "Last Name", fields: ["last_name"] },
      { header: "Type", fields: ["type"] },
      { header: "Agency", fields: ["agency"] },
      { header: "Sponsor", fields: ["sponsor"] },
      { header: "Amount", fields: ["amount"] },
      { header: "Title", fields: ["title"] },
      { header: "Comp", fields: ["comp"] },
      { header: "Principal Investigator", fields: ["principal_investigator"] },
      { header: "Co-Investigator", fields: ["co_investigator", "co_-_investigator"] },
      { header: "Status - Only for Grants", fields: ["status_only_for_grants", "status_-_only_for_grants"] },
      { header: "Department", fields: ["department"] },
      { header: "Program", fields: ["program"] },
      { header: "Footnote - Notes", fields: ["footnote_notes", "footnote_-_notes"] },
      { header: "Highlight - Notes", fields: ["highlight_notes", "highlight_-_notes"] },
    ],
  },
  awards: {
    headers: [
      "Dates",
      "First Name",
      "Last Name",
      "Type",
      "Award",
      "Awarding Organization",
      "Details",
      "Highlight - Notes",
    ],
    fieldMappings: [
      { header: "Dates", fields: ["dates"] },
      { header: "First Name", fields: ["first_name"] },
      { header: "Last Name", fields: ["last_name"] },
      { header: "Type", fields: ["type", "award_type"] },
      { header: "Award", fields: ["award", "title", "award_title"] },
      { header: "Awarding Organization", fields: ["awarding_organization", "organization", "institution"] },
      { header: "Details", fields: ["details", "description", "citation"] },
      { header: "Highlight - Notes", fields: ["highlight_notes", "highlight_-_notes"] },
    ],
  },
  presentations: {
    headers: [
      "Dates",
      "First Name",
      "Last Name",
      "Role",
      "Scale",
      "Type of Presentation",
      "Organization/Institution/Event",
      "Location",
      "Details",
      "Highlight - Notes",
    ],
    fieldMappings: [
      { header: "Dates", fields: ["dates"] },
      { header: "First Name", fields: ["first_name"] },
      { header: "Last Name", fields: ["last_name"] },
      { header: "Role", fields: ["role"] },
      { header: "Scale", fields: ["scale"] },
      { header: "Type of Presentation", fields: ["type_of_presentation", "type", "presentation_type"] },
      {
        header: "Organization/Institution/Event",
        fields: ["organization", "institution", "event", "event_name", "venue"],
      },
      { header: "Location", fields: ["location"] },
      { header: "Details", fields: ["details", "description"] },
      { header: "Highlight - Notes", fields: ["highlight_notes", "highlight_-_notes"] },
    ],
  },
  //   service: {
  //     headers: [
  //       "First Name",
  //       "Last Name",
  //       "Title",
  //       "Organization",
  //       "Role",
  //       "Start Date",
  //       "End Date",
  //       "Type",
  //       "Level",
  //       "Description",
  //       "Hours",
  //     ],
  //     fieldMappings: [
  //       { header: "First Name", fields: ["first_name"] },
  //       { header: "Last Name", fields: ["last_name"] },
  //       { header: "Title", fields: ["title", "committee_name", "service_title"] },
  //       { header: "Organization", fields: ["organization", "institution", "entity"] },
  //       { header: "Role", fields: ["role", "position"] },
  //       { header: "Start Date", fields: ["start_date", "begin_date"] },
  //       { header: "End Date", fields: ["end_date", "completion_date"] },
  //       { header: "Type", fields: ["type", "service_type"] },
  //       { header: "Level", fields: ["level", "service_level"] },
  //       { header: "Description", fields: ["description", "duties", "responsibilities"] },
  //       { header: "Hours", fields: ["hours", "time_commitment"] },
  //     ],
  //   },
  //   research: {
  //     headers: [
  //       "First Name",
  //       "Last Name",
  //       "Project Title",
  //       "Role",
  //       "Start Date",
  //       "End Date",
  //       "Funding Source",
  //       "Amount",
  //       "Collaborators",
  //       "Status",
  //       "Description",
  //       "Publications",
  //     ],
  //     fieldMappings: [
  //       { header: "First Name", fields: ["first_name"] },
  //       { header: "Last Name", fields: ["last_name"] },
  //       { header: "Project Title", fields: ["project_title", "title", "research_title"] },
  //       { header: "Role", fields: ["role", "position"] },
  //       { header: "Start Date", fields: ["start_date", "begin_date"] },
  //       { header: "End Date", fields: ["end_date", "completion_date"] },
  //       { header: "Funding Source", fields: ["funding_source", "sponsor", "agency"] },
  //       { header: "Amount", fields: ["amount", "funding_amount"] },
  //       { header: "Collaborators", fields: ["collaborators", "co_investigators", "team_members"] },
  //       { header: "Status", fields: ["status", "project_status"] },
  //       { header: "Description", fields: ["description", "abstract", "summary"] },
  //       { header: "Publications", fields: ["publications", "resulting_publications"] },
  //     ],
  //   },
  //   presentations: {
  //     headers: [
  //       "First Name",
  //       "Last Name",
  //       "Title",
  //       "Event Name",
  //       "Location",
  //       "Date",
  //       "Type",
  //       "Role",
  //       "Audience",
  //       "Description",
  //       "Co-Presenters",
  //     ],
  //     fieldMappings: [
  //       { header: "First Name", fields: ["first_name"] },
  //       { header: "Last Name", fields: ["last_name"] },
  //       { header: "Title", fields: ["title", "presentation_title"] },
  //       { header: "Event Name", fields: ["event_name", "conference_name", "venue"] },
  //       { header: "Location", fields: ["location", "city", "venue_location"] },
  //       { header: "Date", fields: ["date", "presentation_date", "event_date"] },
  //       { header: "Type", fields: ["type", "presentation_type"] },
  //       { header: "Role", fields: ["role", "presenter_role"] },
  //       { header: "Audience", fields: ["audience", "audience_type"] },
  //       { header: "Description", fields: ["description", "abstract"] },
  //       { header: "Co-Presenters", fields: ["co_presenters", "collaborators"] },
  //     ],
  //   },
  //   honors: {
  //     headers: [
  //       "First Name",
  //       "Last Name",
  //       "Title",
  //       "Organization",
  //       "Date",
  //       "Type",
  //       "Level",
  //       "Amount",
  //       "Description",
  //       "Selection Criteria",
  //     ],
  //     fieldMappings: [
  //       { header: "First Name", fields: ["first_name"] },
  //       { header: "Last Name", fields: ["last_name"] },
  //       { header: "Title", fields: ["title", "award_title", "honor_title"] },
  //       { header: "Organization", fields: ["organization", "institution", "granting_body"] },
  //       { header: "Date", fields: ["date", "award_date", "received_date"] },
  //       { header: "Type", fields: ["type", "award_type", "honor_type"] },
  //       { header: "Level", fields: ["level", "scope"] },
  //       { header: "Amount", fields: ["amount", "monetary_value"] },
  //       { header: "Description", fields: ["description", "citation"] },
  //       { header: "Selection Criteria", fields: ["selection_criteria", "basis"] },
  //     ],
  //   },
};

// Helper function to get report type configuration
export const getReportTypeConfig = (reportType) => {
  return reportTypes.find((rt) => rt.value === reportType);
};

// Helper function to validate if a report type is supported
export const isReportTypeSupported = (reportType) => {
  return csvFieldConfigs.hasOwnProperty(reportType) && reportTypes.some((rt) => rt.value === reportType);
};

// Helper function to get CSV config for a report type
export const getCsvFieldConfig = (reportType) => {
  return csvFieldConfigs[reportType];
};

// Template for adding new report types:
/*
Current report types implemented:
1. publications - Export all publications data including journals, conferences, and other scholarly works
2. grants - Export department-wide grant and contract funding  
3. awards - Export award information including dates, types, awarding organization, and details
4. presentations - Export invited and other presentations and details
5. service-university - Export services to university
6. service-community - Export services to community  
7. service-hospital - Export services to hospital
8. editorships - Export editorships and editorial activities
9. reviewers - Export reviewer activities and contributions
10. supervisory-experience - Export supervisory experience and activities

To add a new report type:
1. Add to reportTypes array:
   {
     value: "new_report_type",
     label: "New Report Type",
     description: "Description of what this report exports",
     sectionNames: ["Section1", "Section2"] // Data sections to search for
   }

2. Add to csvFieldConfigs:
   new_report_type: {
     headers: ["Column1", "Column2", ...],
     fieldMappings: [
       { header: "Column1", fields: ["field1", "alt_field1"] },
       { header: "Column2", fields: ["field2", "alt_field2"] },
       ...
     ]
   }

Example configuration needed for missing report types:
- service-university, service-community, service-hospital
- editorships
- reviewers  
- supervisory-experience
*/
