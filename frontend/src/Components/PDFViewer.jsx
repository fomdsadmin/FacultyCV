import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import '../CustomStyles/PDFViewer.css'; // Import the CSS file for styling
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ({ url }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const goToPreviousPage = () => {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages));
  };

  useEffect(() => {
    setPageNumber(1);
  }, [url]);

  return (
    <div className="pdf-viewer-wrapper">
      <Document file={url} onLoadSuccess={onDocumentLoadSuccess}>
        <Page pageNumber={pageNumber} />
      </Document>
      <div className="pagination-controls mt-14 flex items-center" >
        <button onClick={goToPreviousPage} disabled={pageNumber <= 1}>
          <FaAngleLeft />
        </button>
        <span >
          Page {pageNumber}/{numPages}
        </span>
        <button onClick={goToNextPage} disabled={pageNumber >= numPages}>
          <FaAngleRight />
        </button>
      </div>
    </div>
  );
};

export default PDFViewer;
