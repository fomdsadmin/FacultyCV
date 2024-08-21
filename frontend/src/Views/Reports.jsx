import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu';
import { getAllSections, getAllTemplates, getUserCVData } from '../graphql/graphqlHelpers.js';
import '../CustomStyles/scrollbar.css';
import Report from '../Components/Report.jsx';

const Reports = ({ userInfo, getCognitoUser }) => {
  const [user, setUser] = useState(userInfo);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(true); 
  const [dataSections, setDataSections] = useState([]);
  const [Templates, setTemplates] = useState([]);
  const [latex, setLatex] = useState('');
  const [buildingLatex, setBuildingLatex] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setUser(userInfo);
      
      const templates = await getAllTemplates();
      setTemplates(templates);
  
    };
  
    fetchData();
  }, [userInfo]); 


  const handleTemplateChange = (template) => {
    setSelectedTemplate(template);
    // console.log("THIS IS TEMPLATE:" + template.data_section_ids);
    getDataSections(template);
  };
  

  const getDataSections = async (template) => {
    const retrievedSections = await getAllSections();

    const sectionIds = template.data_section_ids;

    const parsedSections = retrievedSections.map(section => ({
      ...section,
      attributes: JSON.parse(section.attributes),
    }));

    let filteredSections = [];

    if (sectionIds != null && sectionIds.length > 0) { 
      // console.log("Section IDs: " + sectionIds);
      filteredSections = parsedSections.filter(section =>
        sectionIds.includes(section.data_section_id)
      );
    } else {
      // console.log("no template selected");
      // console.log("sectionIds: " + sectionIds);
      filteredSections = parsedSections;
    }

    // console.log(filteredSections);
    setDataSections(filteredSections);
    // console.log("Data Sections:" + dataSections);
    // console.log("building Latex");

    setBuildingLatex(true);
    let latex = await buildLatex(filteredSections);
    setLatex(latex);
    setBuildingLatex(false); 
    setLoading(false);
  }

  const escapeLatex = (text) => {
    if (!text) return '';
    return text
      .replace(/\\/g, '\\textbackslash')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\$/g, '\\$')
      .replace(/#/g, '\\#')
      .replace(/%/g, '\\%')
      .replace(/&/g, '\\&')
      .replace(/_/g, '\\_')
      .replace(/\^/g, '\\textasciicircum')
      .replace(/~/g, '\\textasciitilde');
  };
  
  const buildLatex = async (sections) => {
    let latex = `
\\documentclass{article}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{array}
\\usepackage{booktabs}
\\usepackage{tabularx}
\\usepackage{longtable}

\\begin{document}
\\small 

\\begin{center}
\\textbf{\\Large University of British Columbia} \\\\
\\textbf{\\Large Curriculum Vitae for Faculty Members} \\\\
\\end{center}

\\begin{flushleft}
\\begin{tabularx}{\\textwidth}{@{}lXr@{}}
\\textbf{INITIALS:} & ${escapeLatex(user.first_name.charAt(0) + user.last_name.charAt(0))} & \\textbf{Date:} ${escapeLatex(new Date().toLocaleDateString('en-CA'))} \\\\
\\end{tabularx}
\\end{flushleft}

\\begin{flushleft}
\\begin{tabularx}{\\textwidth}{|p{2cm}|X|p{3cm}|X|}
\\hline
\\textbf{SURNAME:} & ${escapeLatex(user.last_name)}  &
\\textbf{FIRST NAME:} & ${escapeLatex(user.first_name)} \\\\
\\hline
\\end{tabularx}
\\end{flushleft}

\\vspace{-0.5cm} 

\\begin{flushleft}
\\begin{tabularx}{\\textwidth}{|p{3cm}|X|}
\\hline
\\textbf{DEPARTMENT:} & ${escapeLatex(user.primary_department)} \\\\
\\hline
\\end{tabularx}
\\end{flushleft}

\\vspace{-0.5cm} 

\\begin{flushleft}
\\textbf{JOINT APPOINTMENTS:} \\\\
\\begin{tabularx}{\\textwidth}{|X|}
\\hline
${escapeLatex(user.secondary_department)} \\\\
\\hline
\\end{tabularx}
\\end{flushleft}

\\vspace{-0.5cm} 

\\begin{flushleft}
\\textbf{AFFILIATIONS:} \\\\
\\begin{tabularx}{\\textwidth}{|X|}
\\hline
${escapeLatex(user.secondary_faculty)}, ${escapeLatex(user.primary_faculty)} \\\\
\\hline
\\end{tabularx}
\\end{flushleft}

\\vspace{-0.5cm} 

\\begin{flushleft}
\\textbf{LOCATION(S):} \\\\
\\begin{tabularx}{\\textwidth}{|X|}
\\hline
${escapeLatex(user.campus)} \\\\
\\hline
\\end{tabularx}
\\end{flushleft}

\\vspace{-0.5cm} 

\\begin{flushleft}
\\begin{tabularx}{\\textwidth}{|p{5cm}|X|}
\\hline
\\textbf{PRESENT RANK:} & ${escapeLatex(user.rank)} \\\\
\\hline
\\end{tabularx}
\\end{flushleft}
`;
  
    for (const section of sections) {
      try {
      
        // console.log(`Fetching data for section: ${section.title}`);
        let sectionData;
        try {
          sectionData = await getUserCVData(userInfo.user_id, section.data_section_id);
        } catch (error) {
         
        }
        
  
        if (!sectionData || sectionData.length === 0) {
          // console.log(`No data found for section ID: ${section.data_section_id}`);
          continue;
        }
  
        const parsedData = sectionData.map(data => ({
          ...data,
          data_details: JSON.parse(data.data_details),
        }));
  
        // console.log(`Parsed data for section ${section.title}:`, parsedData);

        const attributes = JSON.parse(section.attributes);

        // Get the attribute keys for the table headers
        const headers = Object.keys(attributes);
        // console.log(`Headers for section ${section.title}:`, headers);
  
        latex += `\\subsection*{${escapeLatex(section.title)}}\n`;
        latex += `\\begin{tabularx}{\\textwidth}{| ${headers.map(() => 'X').join(' | ')} |}\n`;
        latex += `\\hline\n`;
        latex += headers.map(header => `\\textbf{${escapeLatex(header)}}`).join(' & ') + ' \\\\ \n';
        latex += `\\hline\n`;
  
        for (const item of parsedData) {
          const row = headers.map(header => {
            const key = header.replace(/\s+/g, '_').toLowerCase();
            const value = item.data_details[key];
            // console.log(`Value for key ${key} in section ${section.title}:`, value);
            return escapeLatex(value !== undefined ? value : ''); 
          }).join(' & ');
          latex += `${row} \\\\ \n`;
          latex += `\\hline\n`;
        }
  
        latex += `\\end{tabularx}\n\n`;
  
      } catch (error) {
        // console.error(`Error fetching data for section ID: ${section.data_section_id}`, error);
      }
    }
  
    latex += `\\end{document}`;

  
    return latex;
  }

  const handlePreview = () => {
    console.log(latex);
    // this is where we need to grab the corresponding pdf and display it
    // Need to add PDF viewing functionality
  };

  const handleDownload = () => {
    
    // generating the file name
    const lastName = user.last_name || 'unknown';
    const templateTitle = selectedTemplate?.title || 'template';
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const fileName = `${lastName}/${templateTitle}/${currentDate}.tex`;

    // below is just a test to download the latex file, we need to to be the corresponding pdf
    const element = document.createElement('a');
    const file = new Blob([latex], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
  }


  return (
    <PageContainer className="custom-scrollbar">
      <FacultyMenu userName={user.preferred_name || user.first_name} getCognitoUser={getCognitoUser} />
      <main className='ml-4 pr-5 overflow-auto custom-scrollbar w-full mb-4'>
        <div className='flex w-full h-full'>
          <div className='flex-1 min-w-96 !overflow-auto !h-full custom-scrollbar'>
            <h1 className="text-4xl ml-2 font-bold my-3 text-zinc-600">Reports</h1>
            <h2 className="text-2xl ml-2 font-bold my-3 text-zinc-600">Select a Template</h2>

              <div className='overflow-auto h-auto mb-6 custom-scrollbar'>
              {Templates.map((template, index) => (
                <Report key={index} title={template.title} onClick={() => handleTemplateChange(template)}
                  isSelected={selectedTemplate && selectedTemplate.template_id === template.template_id} 
                />
              ))}
              </div>


            {selectedTemplate && (
              <div className='sticky bottom-0 ml-2'>
                <button 
                  onClick={handlePreview} 
                  className={`mr-2 mt-6 text-white btn ${buildingLatex ? 'btn-disabled' : 'btn-accent'} min-h-0 h-6 leading-tight mb-1`} 
                  disabled={buildingLatex}
                >
                  {buildingLatex ? (
                    <>
                      <span className="loader"></span>
                    </>
                  ) : (
                    'Preview'
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className={`mt-6 text-white btn ${buildingLatex ? 'btn-disabled' : 'btn-success'} min-h-0 h-6 leading-tight mb-1`}
                  disabled={buildingLatex}
                >
                  {buildingLatex ? (
                    <>
                      <span className="loader"></span>
                    </>
                  ) : (
                    'Download'
                  )}
                </button>
              </div>
            )}



          </div>
 
        </div>
      </main>
    </PageContainer>
  );
}

export default Reports;
