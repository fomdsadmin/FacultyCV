import PDFViewer from '../../Components/PDFViewer.jsx';

const ReportPreview = ({ 
  loading, 
  selectedTemplate, 
  downloadUrl 
}) => {
  if (!loading && selectedTemplate && downloadUrl) {
    return (
      <div className="my-2">
        <PDFViewer url={downloadUrl} />
      </div>
    );
  }

  if (!loading && selectedTemplate && !downloadUrl) {
    return (
      <div className="flex-1 flex items-center justify-center w-full h-full">
        <span className="text-zinc-400 text-xl font-medium">
          Click Generate to review your resume.
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