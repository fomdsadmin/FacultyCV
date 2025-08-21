import { useState } from 'react';
import DownloadButtons from './DownloadButtons.jsx';
import { buildHtml } from './HtmlFunctions/HtmlBuilder.js';
import { convertHtmlToPdf, pollForCompletion } from './gotenbergGenerateUtils/gotenbergService';
import { useApp } from 'Contexts/AppContext.jsx';
import { useNotification } from 'Contexts/NotificationContext.jsx';

const TemplateList = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  onGenerateStart,
  onGenerateComplete,
  onPdfReady,
  onDocxReady,
  onProgress,
  isGenerating,
  isPdfReady,
  isDocxReady,
  downloadUrl,
  downloadBlob,
  downloadUrlDocx,
  downloadBlobDocx,
  processingMessage,
  user,
  cancelRef
}) => {

  const { userInfo } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [startYear, setStartYear] = useState(new Date().getFullYear() - 10);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const { setNotification } = useNotification();

  const yearOptions = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const searchedTemplates = templates.filter((template) =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.title.localeCompare(b.title));

  const handleGenerate = async () => {
    if (!selectedTemplate || isGenerating) return;

    try {
      setNotification({
        message: "Uploading template for document generation. Please do not refresh the page!",
        type: 'info'
      })

      // Notify parent that generation started
      onGenerateStart(selectedTemplate, startYear, endYear);

      // Generate HTML content
      const htmlContent = await buildHtml(user, selectedTemplate);

      // Start the conversion process (non-blocking)
      await convertHtmlToPdf(htmlContent, {}, userInfo, selectedTemplate);

      setNotification({
        message: "Upload complete!",
        type: 'success'
      })

      cancelRef.current?.();
      cancelRef.current = null;
      // Start polling for completion with completion callback

      const cancel = pollForCompletion(
        userInfo,
        selectedTemplate,
        onPdfReady,
        onDocxReady,
        onProgress,
        (success) => {
          console.log('Polling completed, success:', success);
          // This will call the parent's completion handler to stop generating state
          onGenerateComplete(success);
        }
      )

      cancelRef.current = cancel;

    } catch (error) {
      console.error("Error generating HTML CV or converting to PDF:", error);
      setNotification({
        message: "An error occurred while generating the CV. Please try again.",
        type: 'error'
      })
      // Reset generation state on error
      onProgress("Error occurred during generation");
      onGenerateComplete(false); // Stop generating state on error
    }
  };

  // Determine button text
  const getButtonText = () => {
    if (isGenerating) {
      if (!isPdfReady && !isDocxReady) {
        return "Generating PDF & DOCX...";
      } else if (isPdfReady && !isDocxReady) {
        return "PDF Done, Generating DOCX...";
      } else {
        return "Processing...";
      }
    }
    return "Generate PDF & DOCX";
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
          disabled={isGenerating}
        />
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar mb-2">
        {searchedTemplates.map((template, index) => (
          <button
            key={index}
            className={`w-full text-left text-sm px-4 py-2 mb-2 my-1 rounded transition bg-gray-100 ${selectedTemplate &&
              selectedTemplate.template_id === template.template_id
              ? "bg-blue-100 border-l-4 border-blue-500 font-semibold"
              : "hover:bg-gray-200"
              } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !isGenerating && onTemplateSelect(template)}
            disabled={isGenerating}
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
              disabled={isGenerating}
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
              disabled={isGenerating}
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
            className={`w-full btn mb-4 ${isGenerating ? 'btn-secondary cursor-not-allowed opacity-75' : 'btn-primary'}`}
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {getButtonText()}
              </span>
            ) : (
              getButtonText()
            )}
          </button>

          {/* Processing Status */}
          {isGenerating && (
            <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded mb-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-700 text-sm">{processingMessage || "Processing..."}</span>
              </div>
            </div>
          )}

          {/* Download Buttons */}
          <DownloadButtons
            downloadUrl={downloadUrl}
            downloadBlob={downloadBlob}
            downloadUrlDocx={downloadUrlDocx}
            downloadBlobDocx={downloadBlobDocx}
            selectedTemplate={selectedTemplate}
            user={user}
            isPdfReady={isPdfReady}
            isDocxReady={isDocxReady}
            isGenerating={isGenerating}
          />
        </div>
      )}
    </div>
  );
};

export default TemplateList;