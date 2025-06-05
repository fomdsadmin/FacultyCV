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
    <div className="pdf-viewer-wrapper flex items-center justify-center overflow-auto w-full h-full">
      <Document file={url} onLoadSuccess={onDocumentLoadSuccess}>
        <Page
          pageNumber={pageNumber}
          className="mx-auto"
          style={{ maxHeight: "auto", width: "auto", objectFit: "contain" }}
        />
      </Document>
      <div className="pagination-controls mt-20 mr-6 rounded-lg text-sm flex items-center justify-center">
        <button onClick={goToPreviousPage} disabled={pageNumber <= 1}>
          <FaAngleLeft />
        </button>
        <span className="mx-4">
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
