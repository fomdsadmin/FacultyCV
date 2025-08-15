import { useState } from 'react';
import DownloadButtons from './DownloadButtons.jsx';
import { useAuditLogger, AUDIT_ACTIONS } from 'Contexts/AuditLoggerContext.jsx';

const TemplateList = ({ 
  templates, 
  selectedTemplate, 
  onTemplateSelect, 
  onGenerate, 
  buildingLatex, 
  switchingTemplates,
  downloadUrl,
  downloadUrlDocx,
  user
}) => {
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

  const handleGenerate = () => {
    if (selectedTemplate) {
      console.log(selectedTemplate);
      onGenerate(selectedTemplate, startYear, endYear);
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
        {searchedTemplates.map((template, index) => (
          <button
            key={index}
            className={`w-full text-left text-sm px-4 py-2 mb-2 my-1 rounded transition bg-gray-100 ${
              selectedTemplate &&
              selectedTemplate.template_id === template.template_id
                ? "bg-blue-100 border-l-4 border-blue-500 font-semibold"
                : "hover:bg-gray-200"
            }`}
            onClick={() => onTemplateSelect(template)}
          >
            {template.title}
          </button>
        ))}
      </div>
      
      {/* Date Range Picker, Generate Button, and Download Buttons */}
      {selectedTemplate && (
        <div className="mt-auto">
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
          
          {/* Generate Button */}
          <button
            className="w-full btn btn-primary mb-4"
            onClick={handleGenerate}
            disabled={buildingLatex || switchingTemplates}
          >
            {buildingLatex ? "Generating..." : "Generate"}
          </button>

          {/* Use the existing DownloadButtons component */}
          <DownloadButtons
            downloadUrl={downloadUrl}
            downloadUrlDocx={downloadUrlDocx}
            selectedTemplate={selectedTemplate}
            user={user}
            buildingLatex={buildingLatex}
          />
        </div>
      )}
    </div>
  );
};

export default TemplateList;