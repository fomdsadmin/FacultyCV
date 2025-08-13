const DownloadButtons = ({ 
  downloadUrl, 
  downloadBlob,
  downloadUrlDocx, 
  selectedTemplate, 
  user, 
  buildingLatex 
}) => {
  const handleDownload_pdf = async () => {
    if (!downloadUrl && !downloadBlob) {
      console.error("No download URL or blob available");
      return;
    }

    try {
      let blob;
      
      if (downloadBlob) {
        // Use the blob directly (from Gotenberg)
        blob = downloadBlob;
      } else {
        // Fetch from URL (from S3)
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
      console.error("Error downloading the file:", error);
    }
  };

  const handleDownload_docx = async () => {
    if (!downloadUrlDocx) {
      console.error("No download URL available");
      return;
    }

    try {
      const response = await fetch(downloadUrlDocx, { mode: "cors" });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const element = document.createElement("a");
      element.href = url;
      element.download = `${selectedTemplate.title}_${user.last_name || "unknown"}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the file:", error);
    }
  };

  if (!downloadUrl && !downloadBlob) {
    return null;
  }

  return (
    <div className="mt-auto flex flex-col space-y-4 pt-4">
      <button
        onClick={handleDownload_pdf}
        className="btn btn-success"
        disabled={buildingLatex}
      >
        {buildingLatex ? <span className="loader"></span> : "Download PDF"}
      </button>
      <button
        onClick={handleDownload_docx}
        className="btn btn-success"
        disabled={buildingLatex}
      >
        {buildingLatex ? <span className="loader"></span> : "Download DOCX"}
      </button>
    </div>
  );
};

export default DownloadButtons;