import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

/**
 * Custom hook for Gotenberg PDF conversion
 * 
 * @param {string} gotenbergUrl - URL of the Gotenberg service
 * @param {Object} defaultOptions - Default PDF conversion options
 * @returns {Object} Hook utilities and state
 */
const useGotenbergPDF = (
  gotenbergUrl = 'http://localhost:3001', // Use CORS proxy by default
  defaultOptions = {
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
  }
) => {
  const [isConverting, setIsConverting] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [lastConversionTime, setLastConversionTime] = useState(null);

  /**
   * Convert HTML content to PDF
   * 
   * @param {string} htmlContent - HTML content to convert
   * @param {string} fileName - Name for the PDF file
   * @param {Object} options - Conversion options (merged with defaults)
   * @returns {Promise<Blob>} PDF blob
   */
  const convertHtmlToPDF = useCallback(async (
    htmlContent,
    fileName = 'document.pdf',
    options = {}
  ) => {
    setIsConverting(true);
    setLastError(null);

    try {
      // Merge options with defaults
      const mergedOptions = { ...defaultOptions, ...options };

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
              page-break-after: avoid;
            }
            
            p {
              margin-bottom: 1rem;
            }
            
            table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 1rem;
              page-break-inside: avoid;
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
            
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;

      // Prepare form data for Gotenberg
      const formData = new FormData();
      
      // Add HTML file
      const htmlBlob = new Blob([fullHtmlContent], { type: 'text/html' });
      formData.append('files', htmlBlob, 'index.html');
      
      // Add conversion options
      Object.entries(mergedOptions).forEach(([key, value]) => {
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
        const errorText = await response.text();
        throw new Error(`Gotenberg conversion failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      // Get PDF blob
      const pdfBlob = await response.blob();
      
      // Update state
      setLastConversionTime(new Date());
      
      return pdfBlob;
      
    } catch (error) {
      console.error('PDF conversion error:', error);
      setLastError(error);
      throw error;
    } finally {
      setIsConverting(false);
    }
  }, [gotenbergUrl, defaultOptions]);

  /**
   * Convert HTML and download as PDF
   * 
   * @param {string} htmlContent - HTML content to convert
   * @param {string} fileName - Name for the PDF file
   * @param {Object} options - Conversion options
   */
  const convertAndDownload = useCallback(async (
    htmlContent,
    fileName = 'document.pdf',
    options = {}
  ) => {
    try {
      const pdfBlob = await convertHtmlToPDF(htmlContent, fileName, options);
      
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
      
      toast.success('PDF generated and downloaded successfully!');
      
    } catch (error) {
      toast.error(`Failed to convert to PDF: ${error.message}`);
      throw error;
    }
  }, [convertHtmlToPDF]);

  /**
   * Convert DOM element to PDF
   * 
   * @param {HTMLElement} element - DOM element to convert
   * @param {string} fileName - Name for the PDF file
   * @param {Object} options - Conversion options
   */
  const convertElementToPDF = useCallback(async (
    element,
    fileName = 'document.pdf',
    options = {}
  ) => {
    if (!element) {
      throw new Error('Element is required for conversion');
    }

    const htmlContent = element.outerHTML;
    return convertAndDownload(htmlContent, fileName, options);
  }, [convertAndDownload]);

  /**
   * Convert current page to PDF
   * 
   * @param {string} fileName - Name for the PDF file
   * @param {Object} options - Conversion options
   */
  const convertPageToPDF = useCallback(async (
    fileName = 'page.pdf',
    options = {}
  ) => {
    const htmlContent = document.documentElement.outerHTML;
    return convertAndDownload(htmlContent, fileName, options);
  }, [convertAndDownload]);

  /**
   * Check if Gotenberg service is available
   * 
   * @returns {Promise<boolean>} Service availability status
   */
  const checkServiceAvailability = useCallback(async () => {
    try {
      const response = await fetch(`${gotenbergUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.warn('Gotenberg service check failed:', error);
      return false;
    }
  }, [gotenbergUrl]);

  return {
    // State
    isConverting,
    lastError,
    lastConversionTime,
    
    // Methods
    convertHtmlToPDF,
    convertAndDownload,
    convertElementToPDF,
    convertPageToPDF,
    checkServiceAvailability,
  };
};

export default useGotenbergPDF;
