import React, { useState, useEffect } from 'react';
import { cvIsUpToDate, getAllSections, getAllTemplates, getLatexConfiguration, getUserCVData } from '../graphql/graphqlHelpers.js';
import '../CustomStyles/scrollbar.css';
import Report from '../Components/Report.jsx';
import PDFViewer from '../Components/PDFViewer.jsx';
import { getDownloadUrl, uploadLatexToS3 } from '../utils/reportManagement.js';
import AssistantMenu from '../Components/AssistantMenu.jsx';
import Assistant_FacultyMenu from '../Components/Assistant_FacultyMenu.jsx';
import AssistantPageContainer from '../Components/AssistantPageContainer.jsx';
import { useNotification } from '../Contexts/NotificationContext.jsx';
import { getUserId } from '../getAuthToken.js';


const Assistant_Reports = ({ assistantUserInfo, userInfo, getCognitoUser }) => {
  const [user, setUser] = useState(userInfo);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [Templates, setTemplates] = useState([]);
  const [latex, setLatex] = useState('');
  const [buildingLatex, setBuildingLatex] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const { setNotification } = useNotification();
  const [switchingTemplates, setSwitchingTemplates] = useState(false);


  useEffect(() => {
    setUser(userInfo);
    const fetchData = async () => {
      setLoading(true);
      setUser(userInfo);
      const templates = await getAllTemplates();
      
      setTemplates(templates);
      setLoading(false);
    };
    fetchData();
  }, [userInfo]);

  const handleTemplateChange = async (template) => {
    setSelectedTemplate(template);
    createLatexFile(template);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const searchedTemplates = Templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.title.localeCompare(b.title));

  const createLatexFile = async (template) => {
    setSwitchingTemplates(true);
    const cvUpToDate = await cvIsUpToDate(await getUserId(), userInfo.user_id, template.template_id);
    const key = `${userInfo.user_id}/${template.template_id}/resume.tex`;
    if (!cvUpToDate) {
      
      setBuildingLatex(true);
      let latex = await buildLatex(template);
      setLatex(latex);
      // Upload .tex to S3
      await uploadLatexToS3(latex, key);
      // Wait till a url to the latest PDF is available
      const url = await getDownloadUrl(key.replace('tex', 'pdf'), 0);
      setNotification(true);
      setBuildingLatex(false);
      setSwitchingTemplates(false);
      setDownloadUrl(url);
    }
    else {
      
      // if no new .tex was uploaded, this will not need to wait 
      const url = await getDownloadUrl(key.replace('tex', 'pdf'), 0);
      setSwitchingTemplates(false);
      setDownloadUrl(url);
    }
  }

  const downloadLatexFile = () => {
    try {
        const blob = new Blob([latex], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'test.tex';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error downloading LaTeX file:', error);
    }
};


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
  
  const buildLatex = async (template) => {
    const latexConfiguration = JSON.parse(await getLatexConfiguration());
        let latex = `
          \\documentclass{article}
          \\usepackage[utf8]{inputenc}
          \\usepackage{textgreek}
          \\usepackage[margin=${latexConfiguration.margin}cm]{geometry}
          \\usepackage{array}
          \\usepackage{booktabs}
          \\usepackage{tabularx}
          \\usepackage{longtable} 
          \\usepackage{hyperref}
          \\usepackage{fontspec}
      
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
          
          \\vspace{${latexConfiguration.vspace}cm}
          
          \\begin{flushleft}
          \\begin{tabularx}{\\textwidth}{|p{4cm}|X|}
          \\hline
          \\textbf{DEPARTMENT:} & ${escapeLatex(user.primary_department)} \\\\
          \\hline
          \\end{tabularx}
          \\end{flushleft}
          
          \\vspace{${latexConfiguration.vspace}cm}
          
          \\begin{flushleft}
            \\textbf{JOINT APPOINTMENTS:} \\\\
            \\begin{tabularx}{\\textwidth}{|X|}
            \\hline
            ${escapeLatex(user.secondary_department) ? escapeLatex(user.secondary_department) : ''}
            ${user.secondary_department && user.primary_faculty ? ', ' : ''}${user.primary_faculty ? escapeLatex(user.primary_faculty) : ''}
            ${(user.secondary_department || user.primary_faculty) && user.secondary_faculty ? ', ' : ''}${user.secondary_faculty ? escapeLatex(user.secondary_faculty) : ''} \\\\
            \\hline
            \\end{tabularx}
          \\end{flushleft}
    
          
          \\vspace{${latexConfiguration.vspace}cm}
          
          \\begin{flushleft}
          \\textbf{AFFILIATIONS:} \\\\
          \\begin{tabularx}{\\textwidth}{|X|}
          \\hline
          ${escapeLatex(user.primary_affiliation) ? escapeLatex(user.primary_affiliation) : ''}
          ${user.primary_affiliation && user.secondary_affiliation ? ', ' : ''}${user.secondary_affiliation ? escapeLatex(user.secondary_affiliation) : ''} \\\\
          \\hline
          \\end{tabularx}
          \\end{flushleft}
          
          \\vspace{${latexConfiguration.vspace}cm}
          
          \\begin{flushleft}
          \\textbf{LOCATION(S):} \\\\
          \\begin{tabularx}{\\textwidth}{|X|}
          \\hline
          ${escapeLatex(user.campus)} \\\\
          \\hline
          \\end{tabularx}
          \\end{flushleft}
          
          \\vspace{${latexConfiguration.vspace}cm}
          
          \\begin{flushleft}
          \\begin{tabularx}{\\textwidth}{|p{5cm}|X|}
          \\hline
          \\textbf{PRESENT RANK:} & ${escapeLatex(user.rank)} \\\\
          \\hline
          \\end{tabularx}
          \\end{flushleft}
          \\vspace{${latexConfiguration.vspace}cm}
        `;
  
    const calculateColumnWidths = (headers, totalWidth = 19, columnSpacing = 0.5) => {
      const numColumns = headers.length;
      const totalSpacing = (numColumns - 1) * columnSpacing;
      const contentWidth = totalWidth - totalSpacing;
      const columnWidth = (contentWidth / numColumns).toFixed(2);
      return headers.map(() => `p{${columnWidth}cm}`).join(' | ');
    };

    const retrievedSections = await getAllSections();
    const sectionIds = template.data_section_ids;

    const parsedSections = retrievedSections.map((section) => {
      let attributes;
      try {
          // Attempt to parse section.attributes
          attributes = JSON.parse(section.attributes);
      } catch (e) {
          // If parsing fails, assume section.attributes is already a JSON object
          attributes = section.attributes;
      }
  
      return {
          ...section,
          attributes: attributes,
      };
    });

    let filteredSections = [];

    if (sectionIds != null && sectionIds.length > 0) {
      filteredSections = parsedSections
        .filter((section) => sectionIds.includes(section.data_section_id))
        .sort((a, b) => sectionIds.indexOf(a.data_section_id) - sectionIds.indexOf(b.data_section_id));
    } else {
      filteredSections = parsedSections;
    }

    

    let sectionData;
    try {
      
      const dataSectionIdsArray = template.data_section_ids.split(',');
      
      sectionData = await getUserCVData(userInfo.user_id, dataSectionIdsArray);
      
    } catch (error) {
      console.error('Error fetching data for template', error);
    }

    if (!sectionData || sectionData.length === 0) {
      
    }

    const parsedData = sectionData.map((data) => {
      let dataDetails;
      try {
          // Attempt to parse data.data_details
          dataDetails = JSON.parse(data.data_details);
      } catch (e) {
          // If parsing fails, assume data.data_details is already a JSON object
          dataDetails = data.data_details;
      }

      return {
          ...data,
          data_details: dataDetails,
      };
    });

    const currentYear = new Date().getFullYear().toString();

    const isWithinRange = (year, startYear, endYear) => {
      if (endYear === 'Current') {
        return parseInt(year) >= parseInt(startYear);
      }
      return parseInt(year) >= parseInt(startYear) && parseInt(year) <= parseInt(endYear);
    };

    const extractYearFromDates = (dates) => {
      if (dates.includes('-')) {
        const parts = dates.split('-');
        const endDate = parts[1].trim();
        if (endDate === 'Current') {
          return currentYear;
        }
        return endDate.split(', ')[1];
      }
      return dates.split(', ')[1];
    };

    for (const section of filteredSections) {
      try {
        const sectionData = parsedData.filter((item) => {
          if (item.data_section_id !== section.data_section_id) {
            return false;
          }
    
          const { data_details } = item;
          if (!data_details) {
            return false;
          }
    
          const { year, year_published, dates } = data_details;
          const startYear = template.start_year;
          const endYear = template.end_year;
    
          if (year) {
            return isWithinRange(year, startYear, endYear);
          }
    
          if (year_published) {
            return isWithinRange(year_published, startYear, endYear);
          }
    
          if (dates) {
            const extractedYear = extractYearFromDates(dates);
            return isWithinRange(extractedYear, startYear, endYear);
          }
    
          return false;
        })
        .sort((a, b) => {
          const getYear = (item) => {
            const { year, year_published, dates } = item.data_details;
            if (year) return parseInt(year);
            if (year_published) return parseInt(year_published);
            if (dates) return parseInt(extractYearFromDates(dates));
            return 0;
          };
  
          return getYear(b) - getYear(a);
        });
    
        
        // PATENTS //
        if (section.title.toLowerCase() === 'patents') {
          latex += `\\subsection*{${escapeLatex(section.title)}}\n`;

          sectionData.forEach((item, index) => {
            const { first_name, last_name, year_published, title, publication_number, publication_date, country_code, kind_code, family_number } = item.data_details;
  
            const patentCitation = `${index + 1}. ${escapeLatex(last_name)}, ${escapeLatex(first_name)}. (${escapeLatex(year_published)}). ${escapeLatex(title)}. ${escapeLatex(publication_number)}, ${escapeLatex(country_code + '-' + kind_code)} / ${escapeLatex(family_number)}, filed ${escapeLatex(publication_date)}`;
  
            latex += patentCitation;
  
            if (index < sectionData.length - 1) {
              latex += ` \\\\\n`;
              latex += ` \\\\\n`;
            } else {
              latex += `\n`;
            }
          });
  
        // COURSES TAUGHT //
        } else if (section.title.toLowerCase() === 'courses taught') {

          latex += `\\subsection*{${escapeLatex(section.title)}}\\vspace{-1.0em}\n`;
  
          let attributes;
          try {
              // Attempt to parse section.attributes
              attributes = JSON.parse(section.attributes);
          } catch (e) {
              // If parsing fails, assume section.attributes is already a JSON object
              attributes = section.attributes;
          }
          let headers = Object.keys(attributes).filter(header => header.toLowerCase() !== 'description');
  
          const columns = calculateColumnWidths(headers);
  
          latex += `\\begin{longtable}{| ${columns} |}\n`;
          latex += `\\hline\n`;
          latex += headers.map((header) => `\\textbf{${escapeLatex(header)}}`).join(' & ') + ' \\\\ \\hline\n';
  
          for (const item of sectionData) {
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

            sectionData.forEach((item, index) => {
                const { title, year_published, journal, author_names, doi } = item.data_details;

                let authors;
                if (Array.isArray(author_names)) {
                  // Limit the number of authors to 6 and add "et al." if there are more
                  authors = author_names.length > 6 
                    ? `${escapeLatex(author_names.slice(0, 6).join(', '))} et al.`
                    : escapeLatex(author_names.join(', '));
                } else {
                  // If author_names is a string, check if it is a comma-separated string of more than 6 authors
                  const authorArray = author_names.split(',').map(name => name.trim());
                  authors = authorArray.length > 6 
                    ? `${escapeLatex(authorArray.slice(0, 6).join(', '))} et al.`
                    : escapeLatex(author_names);
                }

                // Construct the citation string
                let citation = `${index + 1}. ${authors} (${escapeLatex(year_published)}). ${escapeLatex(title)}. \\textit{${escapeLatex(journal)}}.`;

                // Add DOI if it exists
                if (doi) {
                    citation += ` DOI: \\href{https://doi.org/${escapeLatex(doi)}}{${escapeLatex(doi)}}.`;
                }

                latex += citation;

                // Add a line break between entries
                if (index < sectionData.length - 1) {
                    latex += ` \\\\\n`;
                    latex += ` \\\\\n`;
                } else {
                    latex += `\n`;
                }
            });
  
        // OTHER //
        } else {
          let attributes;
          try {
              // Attempt to parse section.attributes
              attributes = JSON.parse(section.attributes);
          } catch (e) {
              // If parsing fails, assume section.attributes is already a JSON object
              attributes = section.attributes;
          }          
          let headers = Object.keys(attributes);

          latex += `\\subsection*{${escapeLatex(section.title)}}\\vspace{-1.0em}\n`;

          if (headers.length === 1) {

            let counter = 1;

            latex += `\\begin{longtable}{| p{0.5cm} | p{17.7cm} |}\n`;
            latex += `\\hline\n`;

            for (const item of sectionData) {
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
    
            for (const item of sectionData) {
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
    return latex.replace(/<sup>(.*?)<\/sup>/g, (match, p1) => {
      // Replace with LaTeX superscript syntax
      return `$^{${p1}}$`;
    });
  };
  

  const handleDownload = async () => {
    if (!downloadUrl) {
      console.error("No download URL available");
      return;
    }
  
    try {
      const response = await fetch(downloadUrl, {
        mode: 'cors'
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
  
      const element = document.createElement('a');
      element.href = url;
      element.download = `${selectedTemplate.title}_${user.last_name || 'unknown'}.pdf`; 
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
  
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the file:", error);
    }
  };


  return (
    <div>
      <AssistantMenu getCognitoUser={getCognitoUser} userName={assistantUserInfo.preferred_name || assistantUserInfo.first_name}></AssistantMenu>
      <AssistantPageContainer className="custom-scrollbar">
        <Assistant_FacultyMenu userInfo={userInfo} assistantUserInfo={assistantUserInfo} />
        <main className="ml-4 overflow-auto custom-scrollbar w-full">
        <div className="flex w-full h-full">
          
          {/* Content Section */}
          <div className="flex-1 min-w-80 !overflow-auto !h-full custom-scrollbar mr-4">
            <h1 className="text-4xl ml-4 mt-4 font-bold my-3 text-zinc-600">Reports</h1>
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <span>Loading...</span>
              </div>
            ) : (
              <>
                <h2 className="text-2xl ml-4 font-bold my-3 text-zinc-600">Select a Template</h2>
                {/* <button className='btn btn-primary' onClick={downloadLatexFile}>Download LaTeX</button> */}

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
              </>
            )}
          </div>

          {/* PDF Viewer Section */}
          {!loading && selectedTemplate && (
            <>
              {buildingLatex ? (
                <div className='w-3/5 h-full relative'>
                  <span className='w-full' style={{ zIndex: 100, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>PDF generation in progress. You will be notified when this is done. Feel free to navigate away from this page.</span>
                </div>
              ) : (
                switchingTemplates ? (
                  <div className="flex justify-center items-center w-full">
                    <span>Loading...</span>
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
                        className={`mt-5 text-white btn ${buildingLatex ? 'btn-disabled' : 'btn-success'} min-h-0 h-6 leading-tight mb-1`}
                        disabled={buildingLatex}
                      >
                        {buildingLatex ? <span className="loader"></span> : 'Download'}
                      </button>
                    </div>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </main>
      </AssistantPageContainer>
    </div>
    
  );
}

export default Assistant_Reports;
