import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaDownload, FaSpinner, FaFileAlt } from 'react-icons/fa';

/**
 * GotenbergPDFConverter Component
 * 
 * A React component that connects to Gotenberg Docker container to convert HTML to PDF
 * 
 * Props:
 * - gotenbergUrl: URL of the Gotenberg service (default: http://localhost:3000)
 * - htmlContent: HTML content to convert (optional)
 * - children: JSX content to convert (optional)
 * - fileName: Name for the downloaded PDF file
 * - options: PDF conversion options
 */
const GotenbergPDFConverter = ({
  gotenbergUrl = 'http://localhost:3001', // Use CORS proxy by default
  htmlContent = '',
  children,
  fileName = 'converted-document.pdf',
  options = {
    marginTop: '1in',
    marginBottom: '1in',
    marginLeft: '1in',
    marginRight: '1in',
    format: 'A4',
    landscape: false,
    scale: 1.0,
    printBackground: true,
    waitDelay: '2s',
    emulatedMediaType: 'print'
  },
  onConversionStart,
  onConversionSuccess,
  onConversionError,
  className = '',
  buttonText = 'Convert to PDF',
  disabled = false
}) => {
  const [isConverting, setIsConverting] = useState(false);
  const [lastConversionTime, setLastConversionTime] = useState(null);

  /**
   * Convert HTML content to PDF using Gotenberg
   */
  const convertToPDF = useCallback(async () => {
    setIsConverting(true);
    
    try {
      // Notify conversion start
      if (onConversionStart) {
        onConversionStart();
      }

      // Determine HTML content to convert
      let contentToConvert = htmlContent;
      
      // If children are provided, convert JSX to HTML string
      if (children && !htmlContent) {
        // For JSX content, we'll convert it to string representation
        // Note: For complex JSX rendering, consider using react-dom/server
        contentToConvert = typeof children === 'string' ? children : children.toString();
      }

      // If no content provided, get current page HTML
      if (!contentToConvert && !children) {
        contentToConvert = document.documentElement.outerHTML;
      }

      // Prepare the HTML with proper styling for PDF
      const fullHtmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${fileName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 100%;
              margin: 0;
              padding: 20px;
            }
            
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              
              .no-print {
                display: none !important;
              }
              
              .page-break {
                page-break-before: always;
              }
              
              .avoid-break {
                page-break-inside: avoid;
              }
            }
            
            h1, h2, h3, h4, h5, h6 {
              margin-top: 0;
              margin-bottom: 0.5rem;
            }
            
            p {
              margin-bottom: 1rem;
            }
            
            table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 1rem;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          ${contentToConvert}
        </body>
        </html>
      `;

      // Prepare form data for Gotenberg
      const formData = new FormData();
      
      // Add HTML file
      const htmlBlob = new Blob([fullHtmlContent], { type: 'text/html' });
      formData.append('files', htmlBlob, 'index.html');
      
      // Add conversion options
      Object.entries(options).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Make request to Gotenberg
      const response = await fetch(`${gotenbergUrl}/forms/chromium/convert/html`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Gotenberg conversion failed: ${response.status} ${response.statusText}`);
      }

      // Get PDF blob
      const pdfBlob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      
      // Update state
      setLastConversionTime(new Date());
      
      // Show success message
      toast.success('PDF generated and downloaded successfully!');
      
      // Notify conversion success
      if (onConversionSuccess) {
        onConversionSuccess(pdfBlob);
      }
      
    } catch (error) {
      console.error('PDF conversion error:', error);
      
      // Show error message
      toast.error(`Failed to convert to PDF: ${error.message}`);
      
      // Notify conversion error
      if (onConversionError) {
        onConversionError(error);
      }
    } finally {
      setIsConverting(false);
    }
  }, [
    gotenbergUrl,
    htmlContent,
    children,
    fileName,
    options,
    onConversionStart,
    onConversionSuccess,
    onConversionError
  ]);

  return (
    <div className={`gotenberg-pdf-converter ${className}`}>
      <button
        onClick={convertToPDF}
        disabled={disabled || isConverting}
        className={`
          inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
          text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200
          ${isConverting ? 'cursor-wait' : ''}
        `}
      >
        {isConverting ? (
          <>
            <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
            Converting...
          </>
        ) : (
          <>
            <FaDownload className="-ml-1 mr-2 h-4 w-4" />
            {buttonText}
          </>
        )}
      </button>
      
      {lastConversionTime && (
        <div className="mt-2 text-xs text-gray-500">
          <FaFileAlt className="inline mr-1" />
          Last converted: {lastConversionTime.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default GotenbergPDFConverter;
