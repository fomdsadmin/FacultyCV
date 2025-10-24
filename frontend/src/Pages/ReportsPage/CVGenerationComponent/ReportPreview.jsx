import PDFViewer from '../../../Components/PDFViewer.jsx';

const ReportPreview = ({ pdfUrl }) => {
  // Show PDF viewer when PDF URL is available
  if (pdfUrl) {
    return (
      <div className="my-2 w-full h-full">
        <PDFViewer url={pdfUrl} />
      </div>
    );
  }

  // Show message when no PDF is available
  return (
    <div className="flex-1 flex items-center justify-center w-full h-full">
      <span className="text-zinc-400 text-xl font-medium">
        Preview will show once PDF has been generated.
      </span>
    </div>
  );
};

export default ReportPreview;