import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ( url ) => {

  return (
    <div>
      <Document file={url}>
        <Page pageNumber={1} />
      </Document>
    </div>
  );
};

export default PDFViewer;
