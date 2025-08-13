import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import '../CustomStyles/PDFViewer.css'; // Import the CSS file for styling
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ({ url, blob }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState(null);
  
  // Use blob if provided, otherwise use url
  const fileSource = blob || url;

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF');
  };

  const goToPreviousPage = () => {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages));
  };

  useEffect(() => {
    setPageNumber(1);
    setError(null);
  }, [url, blob]);

  // Cleanup blob URLs when component unmounts or URL changes
  useEffect(() => {
    return () => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [url, blob]);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <span className="text-red-500 text-xl">{error}</span>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-wrapper flex items-center justify-center overflow-auto w-full h-full">
      <Document 
        file={fileSource} 
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
      >
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
