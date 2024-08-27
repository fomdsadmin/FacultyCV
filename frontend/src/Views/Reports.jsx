import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu';
import { getAllSections, getAllTemplates, getUserCVData } from '../graphql/graphqlHelpers.js';
import '../CustomStyles/scrollbar.css';
import Report from '../Components/Report.jsx';
import PDFViewer from '../Components/PDFViewer.jsx';
import { getDownloadUrl, uploadLatexToS3 } from '../utils/reportManagement.js';

const Reports = ({ userInfo, getCognitoUser }) => {
  const [user, setUser] = useState(userInfo);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [dataSections, setDataSections] = useState([]);
  const [Templates, setTemplates] = useState([]);
  const [latex, setLatex] = useState('');
  const [buildingLatex, setBuildingLatex] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);


  useEffect(() => {

    setUser(userInfo);
    const fetchData = async () => {
      setUser(userInfo);
      const templates = await getAllTemplates();
      setTemplates(templates);
    };
    fetchData();
  }, [userInfo]);

  const handleTemplateChange = (template) => {
    setSelectedTemplate(template);
    getDataSections(template);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const searchedTemplates = Templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDataSections = async (template) => {
    const retrievedSections = await getAllSections();
    const sectionIds = template.data_section_ids;

    const parsedSections = retrievedSections.map((section) => ({
      ...section,
      attributes: JSON.parse(section.attributes),
    }));

    let filteredSections = [];

    if (sectionIds != null && sectionIds.length > 0) {
      filteredSections = parsedSections.filter((section) =>
        sectionIds.includes(section.data_section_id)
      );
    } else {
      filteredSections = parsedSections;
    }

    setDataSections(filteredSections);

    setBuildingLatex(true);
    let latex = await buildLatex(filteredSections);
    const key = `${selectedTemplate.template_id}/resume.tex`;
    // Upload .tex to S3
    await uploadLatexToS3(latex, key);
    // Wait till a url to the latest PDF is available
    const url = await getDownloadUrl(key.replace('tex', 'pdf'), 0);
    setLatex(latex);
    setBuildingLatex(false);
    setLoading(false);
    setDownloadUrl(url);
  }

  const escapeLatex = (text) => {
    if (typeof text !== 'string') {
      if (Array.isArray(text)) {
        return text.map(item => escapeLatex(item)).join(', ');
      }
      if (text === null || text === undefined) {
        return '';
      }
      return String(text);
    }
  
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    let escapedText = '';
    let lastIndex = 0;
  
    // Process each URL separately and wrap it in \url{}
    text.replace(urlPattern, (match, offset) => {
      escapedText += escapeLatexNonUrl(text.slice(lastIndex, offset));
      escapedText += `\\url{${match}}`;
      lastIndex = offset + match.length;
      return match;
    });
  
    // Escape remaining text
    escapedText += escapeLatexNonUrl(text.slice(lastIndex));
    return escapedText;
  };
  
  const escapeLatexNonUrl = (text) => {
    return text
      .replace(/\u2032/g, '\\(\\prime\\)')
      .replace(/\u202F/g, ' ')
      .replace(/\u02BC/g, "'")
      .replace(/\\/g, '\\textbackslash ')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\$/g, '\\$')
      .replace(/#/g, '\\#')
      .replace(/%/g, '\\%')
      .replace(/&/g, '\\&')
      .replace(/_/g, '\\_')
      .replace(/\^/g, '\\textasciicircum ')
      .replace(/~/g, '\\textasciitilde ');
  };
  
  const buildLatex = async (sections) => {
    let latex = `
      \\documentclass{article}
      \\usepackage[utf8]{inputenc}
      \\usepackage{textgreek}
      \\usepackage[margin=0.5in]{geometry}
      \\usepackage{array}
      \\usepackage{booktabs}
      \\usepackage{tabularx}
      \\usepackage{longtable} 
      \\usepackage{hyperref}
  
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
      \\begin{tabularx}{\\textwidth}{|p{3cm}|X|p{3cm}|X|}
      \\hline
      \\textbf{SURNAME:} & ${escapeLatex(user.last_name)} &
      \\textbf{FIRST NAME:} & ${escapeLatex(user.first_name)} \\\\
      \\hline
      \\end{tabularx}
      \\end{flushleft}
      
      \\vspace{-0.5cm}
      
      \\begin{flushleft}
      \\begin{tabularx}{\\textwidth}{|p{4cm}|X|}
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
  
    const calculateColumnWidths = (headers, totalWidth = 19, columnSpacing = 0.5) => {
      const numColumns = headers.length;
      const totalSpacing = (numColumns - 1) * columnSpacing;
      const contentWidth = totalWidth - totalSpacing;
      const columnWidth = (contentWidth / numColumns).toFixed(2);
      return headers.map(() => `p{${columnWidth}cm}`).join(' | ');
    };
  
    for (const section of sections) {
      try {
        console.log(`Fetching data for section: ${section.title}`);
        let sectionData;
        try {
          sectionData = await getUserCVData(userInfo.user_id, section.data_section_id);
        } catch (error) {
          console.error(`Error fetching data for section ID: ${section.data_section_id}:`, error);
          continue;
        }
  
        if (!sectionData || sectionData.length === 0) {
          console.log(`No data found for section ID: ${section.data_section_id}`);
          continue;
        }
  
        const parsedData = sectionData.map((data) => ({
          ...data,
          data_details: JSON.parse(data.data_details),
        }));
  
        // PATENTS //
        if (section.title.toLowerCase() === 'patents') {
          latex += `\\subsection*{${escapeLatex(section.title)}}\n`;
  
          parsedData.forEach((item, index) => {
            const { first_name, last_name, title, publication_number, publication_date, country_code, kind_code, family_number } = item.data_details;
  
            const patentCitation = `${index + 1}. ${escapeLatex(last_name)}, ${escapeLatex(first_name)}. ${escapeLatex(title)}. ${escapeLatex(publication_number)}, ${escapeLatex(country_code + '-' + kind_code)} / ${escapeLatex(family_number)}, filed ${escapeLatex(publication_date)}`;
  
            latex += patentCitation;
  
            if (index < parsedData.length - 1) {
              latex += ` \\\\\n`;
            } else {
              latex += `\n`;
            }
          });
  
        // COURSES TAUGHT //
        } else if (section.title.toLowerCase() === 'courses taught') {
          latex += `\\subsection*{${escapeLatex(section.title)}}\n`;
  
          let attributes = JSON.parse(section.attributes);
          let headers = Object.keys(attributes).filter(header => header.toLowerCase() !== 'description');
  
          const columns = calculateColumnWidths(headers);
  
          latex += `\\begin{longtable}{| ${columns} |}\n`;
          latex += `\\hline\n`;
          latex += headers.map((header) => `\\textbf{${escapeLatex(header)}}`).join(' & ') + ' \\\\ \\hline\n';
  
          for (const item of parsedData) {
            const row = headers
              .map((header) => {
                const key = header.replace(/\s+/g, '_').toLowerCase();
                const value = item.data_details[key];
                return escapeLatex(value !== undefined ? value : '');
              })
              .join(' & ');
            latex += `${row} \\\\ \\hline\n`;
          }
  
          latex += `\\end{longtable}\n\n`;
  
        // PUBLICATIONS //
        } else if (section.title.toLowerCase() === 'publications') {
          latex += `\\subsection*{${escapeLatex(section.title)}}\n`;
  
          let headers = ['Title', 'Year Published', 'Journal', 'Author Names'];
          const columns = calculateColumnWidths(headers);
  
          latex += `\\begin{longtable}{| ${columns} |}\n`;
          latex += `\\hline\n`;
          latex += headers.map((header) => `\\textbf{${escapeLatex(header)}}`).join(' & ') + ' \\\\ \\hline\n';
  
          for (const item of parsedData) {
            const row = headers
              .map((header) => {
                const key = header.replace(/\s+/g, '_').toLowerCase();
                const value = item.data_details[key];
                return escapeLatex(value !== undefined ? value : '');
              })
              .join(' & ');
            latex += `${row} \\\\ \\hline\n`;
          }
  
          latex += `\\end{longtable}\n\n`;
  
        // OTHER //
        } else {
          let attributes = JSON.parse(section.attributes);
          let headers = Object.keys(attributes);

          latex += `\\subsection*{${escapeLatex(section.title)}}\n`;

          if (headers.length === 1) {

            let counter = 1;

            latex += `\\begin{longtable}{| p{0.5cm} | p{17.7cm} |}\n`;
            latex += `\\hline\n`;

            for (const item of parsedData) {
              const row = headers.map((header) => {
                const key = header.replace(/\s+/g, '_').toLowerCase();
                const value = item.data_details[key];
                return escapeLatex(value !== undefined ? value : '');
              }).join(' & '); 
              latex += `${counter} & ${row} \\\\ \\hline\n`;
              counter++;
            }
          } else {

            const columns = calculateColumnWidths(headers);
    

            latex += `\\begin{longtable}{| ${columns} |}\n`;
            latex += `\\hline\n`;
            latex += headers.map((header) => `\\textbf{${escapeLatex(header)}}`).join(' & ') + ' \\\\ \\hline\n';
    
            for (const item of parsedData) {
              const row = headers
                .map((header) => {
                  const key = header.replace(/\s+/g, '_').toLowerCase();
                  const value = item.data_details[key];
                  return escapeLatex(value !== undefined ? value : '');
                })
                .join(' & ');
              latex += `${row} \\\\ \\hline\n`;
            }

        }
  
          latex += `\\end{longtable}\n\n`;
        }
      } catch (error) {
        console.error(`Error processing section ID: ${section.data_section_id}`, error);
      }
    }
  
    latex += `\\end{document}`;
    return latex;
  };
  

  const handleDownload = () => {
    if (!downloadUrl) {
      console.error("No download URL available");
      return;
    }
  
    // Create an anchor element and trigger a download
    const element = document.createElement('a');
    element.href = downloadUrl;
    element.download = `report_${user.last_name || 'unknown'}.pdf`; // Set the file name, you can customize this as needed
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element); // Clean up the DOM by removing the anchor element
  };

  return (
    <PageContainer className="custom-scrollbar">
      <FacultyMenu userName={user.preferred_name || user.first_name} getCognitoUser={getCognitoUser} />
      <main className="ml-4 pr-5 overflow-auto custom-scrollbar w-full mb-4">
        <div className="flex w-full h-full">
          
          {/* Content Section */}
          <div className="flex-1 min-w-80 !overflow-auto !h-full custom-scrollbar mr-4">
            <h1 className="text-4xl ml-4 mt-4 font-bold my-3 text-zinc-600">Reports</h1>
            <h2 className="text-2xl ml-4 font-bold my-3 text-zinc-600">Select a Template</h2>

            <div className="w-full flex flex-col">
   
              <div className="w-full max-w-xs mb-4 ml-4"> 
                <label className="input input-bordered flex items-center gap-2 w-full">
                  <input
                    type="text"
                    className="grow"
                    placeholder="Search Templates"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-4 w-4 opacity-70"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </label>
              </div>

              {/* Template List */}
              <div className="w-full ml-2 max-w-lg overflow-auto h-auto mb-6 custom-scrollbar"> {/* Restricting width of the template list */}
                {searchedTemplates.map((template, index) => (
                  <Report
                    key={index}
                    title={template.title}
                    onClick={() => handleTemplateChange(template)}
                    isSelected={selectedTemplate && selectedTemplate.template_id === template.template_id}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* PDF Viewer Section */}
          {selectedTemplate && (
            <>
              {buildingLatex ? (
                <div className='w-3/5 h-full relative'>
                  <span className='page-loader w-full' style={{ zIndex: 100, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}></span>
                </div>
              ) : (
                <div className='w-3/5 h-full'>
                  <div className="flex-shrink-0 w-full h-90vh overflow-auto custom-scrollbar">
                    <PDFViewer 
                      url={downloadUrl}
                    />
                  </div>

                  <div className='flex justify-center'>
                    <button
                      onClick={handleDownload}
                      className={`mt-2 text-white btn ${buildingLatex ? 'btn-disabled' : 'btn-success'} min-h-0 h-6 leading-tight mb-1`}
                      disabled={buildingLatex}
                    >
                      {buildingLatex ? <span className="loader"></span> : 'Download'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </PageContainer>
  );
};

export default Reports;