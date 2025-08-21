const DownloadButtons = ({ 
  downloadUrl, 
  downloadBlob,
  downloadUrlDocx,
  downloadBlobDocx,
  selectedTemplate, 
  user,
  isPdfReady,
  isDocxReady,
  isGenerating = false
}) => {
  const handleDownload_pdf = async () => {
    if (!downloadUrl && !downloadBlob) {
      console.error("No download URL or blob available");
      return;
    }

    try {
      let blob;
      
      if (downloadBlob) {
        blob = downloadBlob;
      } else {
        const response = await fetch(downloadUrl, { mode: "cors" });
        blob = await response.blob();
      }
      
      const url = window.URL.createObjectURL(blob);

      const element = document.createElement("a");
      element.href = url;
      element.download = `${selectedTemplate.title}_${user.last_name || "unknown"}.pdf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the PDF file:", error);
    }
  };

  const handleDownload_docx = async () => {
    if (!downloadUrlDocx && !downloadBlobDocx) {
      console.error("No download URL or blob available for DOCX");
      return;
    }

    try {
      let blob;
      
      if (downloadBlobDocx) {
        blob = downloadBlobDocx;
      } else {
        const response = await fetch(downloadUrlDocx, { mode: "cors" });
        blob = await response.blob();
      }
      
      const url = window.URL.createObjectURL(blob);

      const element = document.createElement("a");
      element.href = url;
      element.download = `${selectedTemplate.title}_${user.last_name || "unknown"}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the DOCX file:", error);
    }
  };

  const pdfAvailable = !!(downloadUrl || downloadBlob);
  const docxAvailable = !!(downloadUrlDocx || downloadBlobDocx);
  
  // Always show buttons if a template is selected
  if (!selectedTemplate) {
    return null;
  }

  return (
    <div className="flex flex-col space-y-3">
      {/* PDF Download Button - Always visible */}
      <button
        onClick={handleDownload_pdf}
        className={`btn ${pdfAvailable ? 'btn-success' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
        disabled={!pdfAvailable}
      >
        {pdfAvailable ? (
          "Download PDF"
        ) : (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
            PDF Processing...
          </span>
        )}
      </button>
      
      {/* DOCX Download Button - Always visible */}
      <button
        onClick={handleDownload_docx}
        className={`btn ${docxAvailable ? 'btn-success' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
        disabled={!docxAvailable}
      >
        {docxAvailable ? (
          "Download DOCX"
        ) : (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
            DOCX Processing...
          </span>
        )}
      </button>
    </div>
  );
};

export default DownloadButtons;