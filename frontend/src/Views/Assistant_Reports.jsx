import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import AssistantMenu from '../Components/AssistantMenu.jsx';
import Assistant_FacultyMenu from '../Components/Assistant_FacultyMenu.jsx';
import { getAllSections, getUserCVData } from '../graphql/graphqlHelpers.js';
import '../CustomStyles/scrollbar.css';
import Report from '../Components/Report.jsx';

const mockPrevReports = ["Grants 2024", "Teaching 2023", "Publications 2022"];

const Assistant_Reports = ({ assistantUserInfo, userInfo, getCognitoUser }) => {
  const [user, setUser] = useState(userInfo);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(true); // Add loading state
  const [dataSections, setDataSections] = useState([]);

  useEffect(() => {
    setUser(userInfo);
    //getDataSections();
  }, [userInfo]);

  useEffect(() => {
    if (dataSections.length > 0) {
      buildLatex();
    }
  }, [dataSections]);

  const getDataSections = async () => {
    const retrievedSections = await getAllSections();

    // Parse the attributes field from a JSON string to a JSON object
    const parsedSections = retrievedSections.map(section => ({
      ...section,
      attributes: JSON.parse(section.attributes),
    }));

    
    setDataSections(parsedSections);
    
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
  
  const buildLatex = async () => {
    let latex = `
\\documentclass{article}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{array}
\\usepackage{booktabs}
\\usepackage{tabularx}

\\begin{document}
\\small 
  `;
  
    for (const section of dataSections) {
      try {
        
        let sectionData = await getUserCVData(userInfo.user_id, section.data_section_id);
  
        if (!sectionData || sectionData.length === 0) {
          
          continue; // Skip to the next section if there's no data
        }
  
        const parsedData = sectionData.map(data => ({
          ...data,
          data_details: JSON.parse(data.data_details),
        }));
  
        
  
        // Get the attribute keys for the table headers
        const headers = Object.keys(section.attributes);
        
  
        latex += `\\subsection*{${escapeLatex(section.title)}}\n`;
        latex += `\\begin{tabularx}{\\textwidth}{| ${headers.map(() => 'X').join(' | ')} |}\n`;
        latex += `\\hline\n`;
        latex += headers.map(header => `\\textbf{${escapeLatex(header)}}`).join(' & ') + ' \\\\ \n';
        latex += `\\hline\n`;
  
        for (const item of parsedData) {
          const row = headers.map(header => {
            // Convert header to snake_case to match the keys in data_details
            const key = header.replace(/\s+/g, '_').toLowerCase();
            const value = item.data_details[key];
            
            return escapeLatex(value !== undefined ? value : ''); // Handle missing data
          }).join(' & ');
          latex += `${row} \\\\ \n`;
          latex += `\\hline\n`;
        }
  
        latex += `\\end{tabularx}\n\n`;
  
      } catch (error) {
        console.error(`Error fetching data for section ID: ${section.data_section_id}`, error);
      }
    }
  
    latex += `\\end{document}`;
  
    
  
    return latex;
  }
  

  const handleSave = () => {
    // Save report logic
  };

  const getFormattedDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div>
      <AssistantMenu getCognitoUser={getCognitoUser} userName={assistantUserInfo.preferred_name || assistantUserInfo.first_name}></AssistantMenu>
      <PageContainer className="custom-scrollbar">
        <Assistant_FacultyMenu userInfo={userInfo} assistantUserInfo={assistantUserInfo} />
        <main className='ml-2 h-full w-full'>
          <div className='flex w-full h-full'>
            <div className='flex-1 min-w-96 !overflow-auto !h-full custom-scrollbar'>
              <h1 className="text-4xl ml-2 font-bold my-3 text-zinc-600">Reports</h1>
              <label className="form-control ml-2 w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Template</span>
                </div>
                <select 
                  className="select select-bordered"
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                >
                  <option disabled value="">Select Template</option>
                  <option value="Teaching">Teaching</option>
                  <option value="Grant_Application">Grant Application</option>
                  <option value="Publications">Publications</option>
                </select>
              </label>
              <label className="ml-2 mt-2 form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Title</span>
                </div>
                <input type="text" placeholder="Type here" className="input input-bordered w-full max-w-xs" />
              </label>
              <button onClick={handleSave} className="ml-2 mt-6 text-white btn btn-success min-h-0 h-6 leading-tight mb-1">Save</button>
              
              <h2 className="ml-2 mt-10 text-2xl font-bold my-3 text-zinc-600">Previous</h2>
              {mockPrevReports.map((report, index) => (
                <Report key={index} title={report} />
              ))}
            </div>
            <div className='flex-none w-0.5 bg-neutral h-screen' />
  
          </div>
        </main>
      </PageContainer>
    </div>
    
  );
}

export default Assistant_Reports;
