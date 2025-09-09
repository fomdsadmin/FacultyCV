import React, { useState } from 'react';
import { buildHtml } from './HtmlFunctions/HtmlBuilder.js';
import { useNotification } from 'Contexts/NotificationContext.jsx';
import CVGenerationComponent from './CVGenerationComponent/CVGenerationComponent.jsx';

const TemplateList = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  user,
  setPdfPreviewUrl
}) => {
  const { setNotification } = useNotification();

  const [searchTerm, setSearchTerm] = useState('');
  const [startYear, setStartYear] = useState(new Date().getFullYear() - 10);
  const [endYear, setEndYear] = useState(new Date().getFullYear());

  const yearOptions = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const searchedTemplates = templates.filter((template) =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.title.localeCompare(b.title));

  // HTML generation function for CVGenerationComponent
  const getHtml = async () => {
    if (!selectedTemplate) {
      throw new Error("Please select a template");
    }

    try {
      // Update template with selected date range
      const templateWithDates = {
        ...selectedTemplate,
        start_year: startYear,
        end_year: endYear,
      };

      setNotification({
        message: "Uploading template for CV generation please stay on page!",
        type: 'success'
      });

      // Generate HTML content
      const htmlContent = await buildHtml(user, templateWithDates);

      return htmlContent;

    } catch (error) {
      console.error("Error generating HTML:", error);
      setNotification({
        message: "An error occurred while generating the HTML. Please try again.",
        type: 'error'
      });
      throw error;
    }
  };

  return (
    <div className="flex flex-col min-w-[320px] max-w-xs bg-white rounded-lg max-h-[90vh] shadow-md p-6 mr-10 h-full">
      <h2 className="text-2xl font-bold mb-4 text-zinc-700">Templates</h2>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar mb-2">
        {searchedTemplates
          .map((template, index) => (
            <button
              key={index}
              className={`w-full text-left text-sm px-4 py-2 mb-2 my-1 rounded transition bg-gray-100 ${selectedTemplate && selectedTemplate.template_id === template.template_id
                ? "bg-blue-100 border-l-4 border-blue-500 font-semibold"
                : "hover:bg-gray-200"
                }`}
              onClick={() => onTemplateSelect(template)}
            >
              {template.title}
            </button>
          ))}
      </div>

      {/* Date Range Picker and CV Generation Component */}
      {selectedTemplate && (
        <div className="mt-auto space-y-4">
          {/* Date Range Picker */}
          <div>
            <label className="block mb-2 font-medium text-zinc-600">
              Select Date Range (Year)
            </label>
            <div className="flex space-x-2">
              <select
                className="border rounded px-2 py-1 flex-1"
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
                className="border rounded px-2 py-1 flex-1"
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
          </div>

          {/* CV Generation Component */}
          <CVGenerationComponent
            getHtml={getHtml}
            optionalKey="faculty"
            selectedTemplate={selectedTemplate}
            setPdfPreviewUrl={setPdfPreviewUrl}
            pdfGenerationCompleteMessage={`PDF for "${selectedTemplate.title}" finished generating!`}
            docxGenerationCompleteMessage={`DOCX for "${selectedTemplate.title}" finished generating!`}
          />
        </div>
      )}
    </div>
  );
};

export default TemplateList;