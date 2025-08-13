import PDFViewer from '../../Components/PDFViewer.jsx';

const ReportPreview = ({ 
  loading, 
  selectedTemplate, 
  downloadUrl,
  downloadBlob,
  generatingPdf = false
}) => {
  if (generatingPdf) {
    return (
      <div className="flex-1 flex items-center justify-center w-full h-full">
        <span className="text-blue-500 text-xl font-medium">
          Generating PDF...
        </span>
      </div>
    );
  }

  if (!loading && selectedTemplate && (downloadUrl || downloadBlob)) {
    return (
      <div className="my-2">
        <PDFViewer url={downloadUrl} blob={downloadBlob} />
      </div>
    );
  }

  if (!loading && selectedTemplate && !downloadUrl && !downloadBlob) {
    return (
      <div className="flex-1 flex items-center justify-center w-full h-full">
        <span className="text-zinc-400 text-xl font-medium">
          Click Generate PDF to review your resume.
        </span>
      </div>
    );
  }

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