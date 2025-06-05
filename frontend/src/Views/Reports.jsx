import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu';
import { cvIsUpToDate, getAllSections, getAllTemplates, getUserCVData, updateLatexConfiguration } from '../graphql/graphqlHelpers.js';
import '../CustomStyles/scrollbar.css';
import Report from '../Components/Report.jsx';
import PDFViewer from '../Components/PDFViewer.jsx';
import { getDownloadUrl, uploadLatexToS3 } from '../utils/reportManagement.js';
import { useNotification } from '../Contexts/NotificationContext.jsx';
import { getUserId } from '../getAuthToken.js';
import { getLatexConfiguration } from '../graphql/graphqlHelpers.js';

const Reports = ({ userInfo, getCognitoUser }) => {
  const [user, setUser] = useState(userInfo);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [Templates, setTemplates] = useState([]);
  const [latex, setLatex] = useState('');
  const [buildingLatex, setBuildingLatex] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadUrlDocx, setDownloadUrlDocx] = useState(null); // For DOCX
  const { setNotification } = useNotification();
  const [switchingTemplates, setSwitchingTemplates] = useState(false);
  const [startYear, setStartYear] = useState(new Date().getFullYear() - 10);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [yearOptions, setYearOptions] = useState(
    Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i)
  );

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

  const searchedTemplates = Templates.filter((template) =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.title.localeCompare(b.title));

  const createLatexFile = async (template) => {
    setSwitchingTemplates(true);
    const cvUpToDate = await cvIsUpToDate(
      await getUserId(),
      userInfo.user_id,
      template.template_id
    );
    const key = `${userInfo.user_id}/${template.template_id}/resume.tex`;
    if (!cvUpToDate) {
      setBuildingLatex(true);
      let latex = await buildLatex(template);
      setLatex(latex);
      // Upload .tex to S3
      await uploadLatexToS3(latex, key);
      // Wait till URLs for both PDF and DOCX are available
      const pdfUrl = await getDownloadUrl(key.replace("tex", "pdf"), 0);
      const docxUrl = await getDownloadUrl(key.replace("tex", "docx"), 0);
      setNotification(true);
      setBuildingLatex(false);
      setSwitchingTemplates(false);
      setDownloadUrl(pdfUrl);
      setDownloadUrlDocx(docxUrl);
    } else {
      // If no new .tex was uploaded, fetch both URLs
      const pdfUrl = await getDownloadUrl(key.replace("tex", "pdf"), 0);
      const docxUrl = await getDownloadUrl(key.replace("tex", "docx"), 0);
      setSwitchingTemplates(false);
      setDownloadUrl(pdfUrl);
      setDownloadUrlDocx(docxUrl);
    }
  };

  const escapeLatex = (text) => {
    if (typeof text !== "string") {
      if (Array.isArray(text)) {
        return text.map((item) => escapeLatex(item)).join(", ");
      }
      if (text === null || text === undefined) {
        return "";
      }
      return String(text);
    }

    const urlPattern = /(https?:\/\/[^\s]+)/g;
    let escapedText = "";
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
      .replace(/\u2032/g, "\\(\\prime\\)")
      .replace(/\u202F/g, " ")
      .replace(/\u02BC/g, "'")
      .replace(/\\/g, "\\textbackslash ")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}")
      .replace(/\$/g, "\\$")
      .replace(/#/g, "\\#")
      .replace(/%/g, "\\%")
      .replace(/&/g, "\\&")
      .replace(/_/g, "\\_")
      .replace(/\^/g, "\\textasciicircum ")
      .replace(/~/g, "\\textasciitilde ");
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
      \\textbf{INITIALS:} & ${escapeLatex(
        user.first_name.charAt(0) + user.last_name.charAt(0)
      )} & \\textbf{Date:} ${escapeLatex(
      new Date().toLocaleDateString("en-CA")
    )} \\\\
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
        ${
          escapeLatex(user.secondary_department)
            ? escapeLatex(user.secondary_department)
            : ""
        }
        ${user.secondary_department && user.primary_faculty ? ", " : ""}${
      user.primary_faculty ? escapeLatex(user.primary_faculty) : ""
    }
        ${
          (user.secondary_department || user.primary_faculty) &&
          user.secondary_faculty
            ? ", "
            : ""
        }${
      user.secondary_faculty ? escapeLatex(user.secondary_faculty) : ""
    } \\\\
        \\hline
        \\end{tabularx}
      \\end{flushleft}

      
      \\vspace{${latexConfiguration.vspace}cm}
      
      \\begin{flushleft}
      \\textbf{AFFILIATIONS:} \\\\
      \\begin{tabularx}{\\textwidth}{|X|}
      \\hline
      ${
        escapeLatex(user.primary_affiliation)
          ? escapeLatex(user.primary_affiliation)
          : ""
      }
      ${user.primary_affiliation && user.secondary_affiliation ? ", " : ""}${
      user.secondary_affiliation ? escapeLatex(user.secondary_affiliation) : ""
    } \\\\
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

    const calculateColumnWidths = (
      headers,
      totalWidth = 19,
      columnSpacing = 0.5
    ) => {
      const numColumns = headers.length;
      const totalSpacing = (numColumns - 1) * columnSpacing;
      const contentWidth = totalWidth - totalSpacing;
      const columnWidth = (contentWidth / numColumns).toFixed(2);
      console.log(`Column width: ${columnWidth}`);
      console.log(headers);
      return headers.map(() => `p{${columnWidth}cm}`).join(" | ");
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
        .sort(
          (a, b) =>
            sectionIds.indexOf(a.data_section_id) -
            sectionIds.indexOf(b.data_section_id)
        );
    } else {
      filteredSections = parsedSections;
    }

    let sectionData;
    try {
      const dataSectionIdsArray = template.data_section_ids.split(",");

      sectionData = await getUserCVData(userInfo.user_id, dataSectionIdsArray);
    } catch (error) {
      console.error("Error fetching data for template", error);
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
      if (endYear === "Current") {
        return parseInt(year) >= parseInt(startYear);
      }
      return (
        parseInt(year) >= parseInt(startYear) &&
        parseInt(year) <= parseInt(endYear)
      );
    };

    const extractYearFromDates = (dates) => {
      if (dates.includes("-")) {
        const parts = dates.split("-");
        const endDate = parts[1].trim();
        if (endDate === "Current") {
          return currentYear;
        }
        return endDate.split(", ")[1];
      }
      return dates.split(", ")[1];
    };

    for (const section of filteredSections) {
      try {
        const sectionData = parsedData
          .filter((item) => {
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
        if (section.title.toLowerCase() === "patents") {
          latex += `\\subsection*{${escapeLatex(section.title)}}\n`;

          sectionData.forEach((item, index) => {
            const {
              first_name,
              last_name,
              year_published,
              title,
              publication_number,
              publication_date,
              country_code,
              kind_code,
              family_number,
            } = item.data_details;

            const patentCitation = `${index + 1}. ${escapeLatex(
              last_name
            )}, ${escapeLatex(first_name)}. (${escapeLatex(
              year_published
            )}). ${escapeLatex(title)}. ${escapeLatex(
              publication_number
            )}, ${escapeLatex(country_code + "-" + kind_code)} / ${escapeLatex(
              family_number
            )}, filed ${escapeLatex(publication_date)}`;

            latex += patentCitation;

            if (index < sectionData.length - 1) {
              latex += ` \\\\\n`;
              latex += ` \\\\\n`;
            } else {
              latex += `\n`;
            }
          });
          latex += `\\vspace{${latexConfiguration.vspace}cm}`;
          // COURSES TAUGHT //
        } else if (section.title.toLowerCase() === "courses taught") {
          latex += `\\subsection*{${escapeLatex(
            section.title
          )}}\\vspace{-1.0em}\n`;

          let attributes;
          try {
            // Attempt to parse section.attributes
            attributes = JSON.parse(section.attributes);
          } catch (e) {
            // If parsing fails, assume section.attributes is already a JSON object
            attributes = section.attributes;
          }
          let headers = Object.keys(attributes).filter(
            (header) => header.toLowerCase() !== "description"
          );

          const columns = calculateColumnWidths(
            headers,
            21.6 - 2 * latexConfiguration.margin
          ); // 21.6cm - margin*2 where margin is in cm too

          latex += `\\begin{longtable}{| ${columns} |}\n`;
          latex += `\\hline\n`;
          latex +=
            headers
              .map((header) => `\\textbf{${escapeLatex(header)}}`)
              .join(" & ") + " \\\\ \\hline\n";

          for (const item of sectionData) {
            const row = headers
              .map((header) => {
                const key = header.replace(/\s+/g, "_").toLowerCase();
                const value = item.data_details[key];
                return escapeLatex(value !== undefined ? value : "");
              })
              .join(" & ");
            latex += `${row} \\\\ \\hline\n`;
          }

          latex += `\\end{longtable}\n\n`;
          latex += `\\vspace{${latexConfiguration.vspace}cm}`;
          // PUBLICATIONS //
        } else if (section.title.toLowerCase() === "publications") {
          latex += `\\subsection*{${escapeLatex(section.title)}}\n`;

          sectionData.forEach((item, index) => {
            const { title, year_published, journal, author_names, doi } =
              item.data_details;

            let authors;
            if (Array.isArray(author_names)) {
              // Limit the number of authors to 6 and add "et al." if there are more
              authors =
                author_names.length > 6
                  ? `${escapeLatex(author_names.slice(0, 6).join(", "))} et al.`
                  : escapeLatex(author_names.join(", "));
            } else {
              // If author_names is a string, check if it is a comma-separated string of more than 6 authors
              const authorArray = author_names
                .split(",")
                .map((name) => name.trim());
              authors =
                authorArray.length > 6
                  ? `${escapeLatex(authorArray.slice(0, 6).join(", "))} et al.`
                  : escapeLatex(author_names);
            }

            // Construct the citation string
            let citation = `${index + 1}. ${authors} (${escapeLatex(
              year_published
            )}). ${escapeLatex(title)}. \\textit{${escapeLatex(journal)}}.`;

            // Add DOI if it exists
            if (doi) {
              citation += ` DOI: \\href{https://doi.org/${escapeLatex(
                doi
              )}}{${escapeLatex(doi)}}.`;
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

          latex += `\\vspace{${latexConfiguration.vspace}cm}`;
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

          latex += `\\subsection*{${escapeLatex(
            section.title
          )}}\\vspace{-1.0em}\n`;

          if (headers.length === 1) {
            let counter = 1;

            latex += `\\begin{longtable}{| p{0.5cm} | p{17.7cm} |}\n`;
            latex += `\\hline\n`;

            for (const item of sectionData) {
              const row = headers
                .map((header) => {
                  const key = header.replace(/\s+/g, "_").toLowerCase();
                  const value = item.data_details[key];
                  return escapeLatex(value !== undefined ? value : "");
                })
                .join(" & ");
              latex += `${counter} & ${row} \\\\ \\hline\n`;
              counter++;
            }
          } else {
            const columns = calculateColumnWidths(
              headers,
              21.6 - 2 * latexConfiguration.margin
            );

            latex += `\\begin{longtable}{| ${columns} |}\n`;
            latex += `\\hline\n`;
            latex +=
              headers
                .map((header) => `\\textbf{${escapeLatex(header)}}`)
                .join(" & ") + " \\\\ \\hline\n";

            for (const item of sectionData) {
              const row = headers
                .map((header) => {
                  const key = header.replace(/\s+/g, "_").toLowerCase();
                  const value = item.data_details[key];
                  return escapeLatex(value !== undefined ? value : "");
                })
                .join(" & ");
              latex += `${row} \\\\ \\hline\n`;
            }
          }

          latex += `\\end{longtable}\\vspace{${latexConfiguration.vspace}cm}`;
        }
      } catch (error) {
        console.error(
          `Error processing section ID: ${section.data_section_id}`,
          error
        );
      }
    }

    latex += `\\end{document}`;
    return latex.replace(/<sup>(.*?)<\/sup>/g, (match, p1) => {
      // Replace with LaTeX superscript syntax
      return `$^{${p1}}$`;
    });
  };

  const handleDownload_pdf = async () => {
    if (!downloadUrl) {
      console.error("No download URL available");
      return;
    }

    try {
      const response = await fetch(downloadUrl, {
        mode: "cors",
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const element = document.createElement("a");
      element.href = url;
      element.download = `${selectedTemplate.title}_${
        user.last_name || "unknown"
      }.pdf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the file:", error);
    }
  };

  const handleDownload_docx = async () => {
    if (!downloadUrl) {
      console.error("No download URL available");
      return;
    }

    try {
      const response = await fetch(downloadUrlDocx, {
        mode: "cors",
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const element = document.createElement("a");
      element.href = url;
      element.download = `${selectedTemplate.title}_${
        user.last_name || "unknown"
      }.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the file:", error);
    }
  };

  // Add this handler for generate button
  const handleGenerate = () => {
    if (selectedTemplate) {
      // You may want to pass startYear/endYear to createLatexFile or similar
      createLatexFile(selectedTemplate, startYear, endYear);
    }
  };

  return (
    <PageContainer className="custom-scrollbar">
      <FacultyMenu
        userName={user.preferred_name || user.first_name}
        getCognitoUser={getCognitoUser}
      />
      <main className="ml-4 overflow-auto custom-scrollbar w-full">
        <div className="w-full px-8 pt-4">
          <h1 className="text-3xl font-bold text-zinc-800 mb-2">Reports</h1>
        </div>
        <div className="flex w-full h-full px-8 pb-8">
          {/* Left Panel: Template List */}
          <div className="flex flex-col min-w-[320px] max-w-xs bg-white rounded-lg max-h-[90vh] shadow-md p-6 mr-10 h-full">
            <h2 className="text-2xl font-bold mb-4 text-zinc-700">Templates</h2>
            {/* Template List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar mb-2">
              {searchedTemplates.map((template, index) => (
                <button
                  key={index}
                  className={`w-full text-left text-sm px-4 py-2 mb-2 my-1 rounded transition bg-gray-100 ${
                    selectedTemplate &&
                    selectedTemplate.template_id === template.template_id
                      ? "bg-blue-100 border-l-4 border-blue-500 font-semibold"
                      : "hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  {template.title}
                </button>
              ))}
            </div>
            {/* Date Range Picker and Generate Button */}
            {selectedTemplate && (
              <div className="mb-[15vh]">
                <label className="block mb-2 font-medium text-zinc-600">
                  Select Date Range (Year)
                </label>
                <div className="flex space-x-2 mb-4">
                  <select
                    className="border rounded px-2 py-1"
                    value={startYear}
                    onChange={(e) => setStartYear(Number(e.target.value))}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <span className="self-center">to</span>
                  <select
                    className="border rounded px-2 py-1"
                    value={endYear}
                    onChange={(e) => setEndYear(Number(e.target.value))}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="w-full btn btn-primary"
                  onClick={handleGenerate}
                  disabled={buildingLatex || switchingTemplates}
                >
                  {buildingLatex ? "Generating..." : "Generate"}
                </button>
              </div>
            )}
            {/* Download Buttons only if resume is shown */}
            {!loading && selectedTemplate && downloadUrl && (
              <div className="mt-auto flex flex-col space-y-4 pt-4">
                <button
                  onClick={handleDownload_pdf}
                  className="btn btn-success"
                  disabled={buildingLatex}
                >
                  {buildingLatex ? (
                    <span className="loader"></span>
                  ) : (
                    "Download PDF"
                  )}
                </button>
                <button
                  onClick={handleDownload_docx}
                  className="btn btn-success"
                  disabled={buildingLatex}
                >
                  {buildingLatex ? (
                    <span className="loader"></span>
                  ) : (
                    "Download DOCX"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Resume Preview and Download Buttons */}
          <div
            className="flex-1 flex flex-col items-center bg-gray-50 rounded-lg 
            shadow-md px-8 overflow-auto custom-scrollbar h-[90vh]"
          >
            {!loading && selectedTemplate && downloadUrl && (
              <div className="my-2">
                <PDFViewer url={downloadUrl} />
              </div>
            )}
            {!loading && selectedTemplate && !downloadUrl && (
              <div className="flex-1 flex items-center justify-center w-full h-full">
                <span className="text-zinc-400 text-xl font-medium">
                  Click Generate to review your resume.
                </span>
              </div>
            )}
            {!loading && !selectedTemplate && (
              <div className="flex-1 flex items-center justify-center w-full h-full">
                <span className="text-zinc-400 text-xl font-medium">
                  Select a template to begin.
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    </PageContainer>
  );
};

export default Reports;