import PDFViewer from '../../Components/PDFViewer.jsx';

const ReportPreview = ({ 
  loading, 
  selectedTemplate, 
  downloadUrl,
  downloadBlob,
  generatingPdf = false
}) => {
  // Show generating message only while PDF is being generated
  if (generatingPdf) {
    return (
      <div className="flex-1 flex items-center justify-center w-full h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <span className="text-blue-500 text-xl font-medium">
            Generating PDF & DOCX...
          </span>
        </div>
      </div>
    );
  }

  // Show PDF viewer when PDF is available (URL or blob)
  if (!loading && selectedTemplate && (downloadUrl || downloadBlob)) {
    return (
      <div className="my-2 w-full h-full">
        <PDFViewer url={downloadUrl} blob={downloadBlob} />
      </div>
    );
  }

  // Show message when template is selected but no PDF yet
  if (!loading && selectedTemplate && !downloadUrl && !downloadBlob) {
    return (
      <div className="flex-1 flex items-center justify-center w-full h-full">
        <span className="text-zinc-400 text-xl font-medium">
          Click Generate PDF & DOCX to review your resume.
        </span>
      </div>
    );
  }

  // Show message when no template is selected
  if (!loading && !selectedTemplate) {
    return (
      <div className="flex-1 flex items-center justify-center w-full h-full">
        <span className="text-zinc-400 text-xl font-medium">
          Select a template to begin.
        </span>
      </div>
    );
  }

  return null;
};

export default ReportPreview;