const DownloadButtons = ({ 
  downloadUrl, 
  downloadBlob,
  downloadUrlDocx,
  downloadBlobDocx,
  selectedTemplate, 
  user,
  docxTagExists,
  pdfTagExists,
  isGenerating,
  isPdfReady,
  isDocxReady
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
  
  // PDF Button Logic
  const getPdfButtonState = () => {
    if (pdfAvailable) {
      // File is ready to download
      return { 
        text: "Download PDF", 
        style: "btn-success", 
        disabled: false 
      };
    } else if (isGenerating && pdfTagExists) {
      // Currently generating
      return { 
        text: (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
            PDF Processing...
          </span>
        ), 
        style: "btn-secondary opacity-50 cursor-not-allowed", 
        disabled: true 
      };
    } else if (!pdfTagExists) {
      // No file exists in database
      return { 
        text: "No PDF available - Please generate first", 
        style: "btn-secondary opacity-50 cursor-not-allowed", 
        disabled: true 
      };
    } else {
      // Tag exists but not generating (shouldn't happen but fallback)
      return { 
        text: "PDF not ready", 
        style: "btn-secondary opacity-50 cursor-not-allowed", 
        disabled: true 
      };
    }
  };

  // DOCX Button Logic
  const getDocxButtonState = () => {
    if (docxAvailable) {
      // File is ready to download
      return { 
        text: "Download DOCX", 
        style: "btn-success", 
        disabled: false 
      };
    } else if (isGenerating && docxTagExists) {
      // Currently generating
      return { 
        text: (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
            DOCX Processing...
          </span>
        ), 
        style: "btn-secondary opacity-50 cursor-not-allowed", 
        disabled: true 
      };
    } else if (!docxTagExists) {
      // No file exists in database
      return { 
        text: "No DOCX available - Please generate first", 
        style: "btn-secondary opacity-50 cursor-not-allowed", 
        disabled: true 
      };
    } else {
      // Tag exists but not generating (shouldn't happen but fallback)
      return { 
        text: "DOCX not ready", 
        style: "btn-secondary opacity-50 cursor-not-allowed", 
        disabled: true 
      };
    }
  };
  
  // Always show buttons if a template is selected
  if (!selectedTemplate) {
    return null;
  }

  const pdfButtonState = getPdfButtonState();
  const docxButtonState = getDocxButtonState();

  return (
    <div className="flex flex-col space-y-3">
      {/* PDF Download Button */}
      <button
        onClick={handleDownload_pdf}
        className={`btn ${pdfButtonState.style}`}
        disabled={pdfButtonState.disabled}
      >
        {pdfButtonState.text}
      </button>
      
      {/* DOCX Download Button */}
      <button
        onClick={handleDownload_docx}
        className={`btn ${docxButtonState.style}`}
        disabled={docxButtonState.disabled}
      >
        {docxButtonState.text}
      </button>
    </div>
  );
};

export default DownloadButtons;