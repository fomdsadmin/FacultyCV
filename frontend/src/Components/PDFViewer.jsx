import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import '../CustomStyles/PDFViewer.css';
import { FaAngleLeft, FaAngleRight, FaExpand, FaCompress, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ({ url, blob }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  useEffect(() => {
    setPageNumber(1);
    setError(null);
    setScale(1); // Reset scale when new document loads
  }, [url, blob]);

  useEffect(() => {
    const updateContainerWidth = () => {
      const baseWidth = isFullscreen 
        ? window.innerWidth * 0.8 
        : window.innerWidth * 0.4;
      setContainerWidth(Math.min(baseWidth - 100, isFullscreen ? 1200 : 700));
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    
    return () => {
      window.removeEventListener('resize', updateContainerWidth);
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [url, blob, isFullscreen]);

  // Handle escape key for fullscreen
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen]);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <span className="text-red-500 text-xl">{error}</span>
      </div>
    );
  }

  const viewerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
    : "pdf-viewer-wrapper w-full h-full";

  const containerClasses = isFullscreen
    ? "w-full h-full flex flex-col"
    : "w-full h-full flex flex-col border border-gray-200 rounded-lg overflow-hidden";

  return (
    <div className={viewerClasses}>
      <div className={containerClasses}>
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <button 
              onClick={zoomOut}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Zoom Out"
            >
              <FaSearchMinus className="text-gray-600" />
            </button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button 
              onClick={zoomIn}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Zoom In"
            >
              <FaSearchPlus className="text-gray-600" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Page Navigation */}
            {numPages > 1 && (
              <>
                <button 
                  onClick={goToPreviousPage} 
                  disabled={pageNumber <= 1}
                  className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaAngleLeft className="text-gray-600" />
                </button>
                <span className="text-sm text-gray-600 min-w-[80px] text-center">
                  {numPages ? `${pageNumber} / ${numPages}` : 'Loading...'}
                </span>
                <button 
                  onClick={goToNextPage} 
                  disabled={pageNumber >= numPages}
                  className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaAngleRight className="text-gray-600" />
                </button>
              </>
            )}
            
            {/* Fullscreen Toggle */}
            <button 
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <FaCompress className="text-gray-600" />
              ) : (
                <FaExpand className="text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* PDF Document Container */}
        <div className="flex-1 overflow-auto bg-gray-100 relative">
          <div className="flex items-center justify-center min-h-full p-4">
            <Document 
              file={fileSource} 
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              className="flex items-center justify-center"
            >
              <Page
                pageNumber={pageNumber}
                className="shadow-lg"
                width={containerWidth * scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
