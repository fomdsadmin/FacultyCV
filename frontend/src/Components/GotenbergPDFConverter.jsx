import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaDownload, FaSpinner, FaFileAlt, FaPlus, FaMinus } from 'react-icons/fa';

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
 * - showSectionGenerator: Enable section generator UI with row controls (default: false)
 * - sectionTitle: Title for the generated section (default: 'Generated Section')
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
  disabled = false,
  showSectionGenerator = false,
  sectionTitle = 'Generated Section'
}) => {
  const [isConverting, setIsConverting] = useState(false);
  const [lastConversionTime, setLastConversionTime] = useState(null);
  const [numberOfRows, setNumberOfRows] = useState(5);
  const [generatedData, setGeneratedData] = useState([]);

  /**
   * Generate sample data for the section
   */
  const generateSampleData = useCallback((numRows) => {
    const sampleData = [];
    for (let i = 1; i <= numRows; i++) {
      sampleData.push({
        id: i,
        title: `Sample Item ${i}`,
        description: `This is a sample description for item ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
        date: new Date(2024, 0, i).toLocaleDateString(),
        category: `Category ${(i % 3) + 1}`,
        status: i % 2 === 0 ? 'Active' : 'Pending'
      });
    }
    setGeneratedData(sampleData);
  }, []);

  /**
   * Generate HTML content for the section
   */
  const generateSectionHTML = useCallback(() => {
    return `
      <div class="pdf-section">
        <h1>${sectionTitle}</h1>
        <div class="section-meta">
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <p>Number of items: ${generatedData.length}</p>
        </div>
        
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Date</th>
              <th>Category</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${generatedData.map(item => `
              <tr>
                <td>${item.id}</td>
                <td>${item.title}</td>
                <td>${item.description}</td>
                <td>${item.date}</td>
                <td>${item.category}</td>
                <td class="status-${item.status.toLowerCase()}">${item.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="section-footer">
          <p>End of ${sectionTitle}</p>
        </div>
      </div>
    `;
  }, [sectionTitle, generatedData]);

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
      
      // If showSectionGenerator is true, use generated section content
      if (showSectionGenerator && generatedData.length > 0) {
        contentToConvert = generateSectionHTML();
      }
      // If children are provided, convert JSX to HTML string
      else if (children && !htmlContent) {
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
            
            .pdf-section {
              max-width: 100%;
              margin: 0 auto;
            }
            
            .section-meta {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
              border-left: 4px solid #007bff;
            }
            
            .section-meta p {
              margin: 5px 0;
              font-size: 14px;
              color: #666;
            }
            
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 12px;
            }
            
            .data-table th {
              background-color: #343a40;
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-weight: 600;
            }
            
            .data-table td {
              padding: 10px 8px;
              border-bottom: 1px solid #dee2e6;
              vertical-align: top;
            }
            
            .data-table tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            
            .status-active {
              color: #28a745;
              font-weight: bold;
            }
            
            .status-pending {
              color: #ffc107;
              font-weight: bold;
            }
            
            .section-footer {
              margin-top: 30px;
              padding: 20px;
              text-align: center;
              color: #666;
              border-top: 2px solid #dee2e6;
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
    onConversionError,
    showSectionGenerator,
    generatedData.length,
    generateSectionHTML
  ]);

  return (
    <div className={`gotenberg-pdf-converter ${className}`}>
      {showSectionGenerator && (
        <div className="section-generator mb-6 p-6 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Section Generator</h3>
          
          <div className="mb-4">
            <label htmlFor="rowCount" className="block text-sm font-medium text-gray-700 mb-2">
              Number of rows to generate:
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setNumberOfRows(Math.max(1, numberOfRows - 1))}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700"
                type="button"
              >
                -
              </button>
              <input
                id="rowCount"
                type="number"
                min="1"
                max="100"
                value={numberOfRows}
                onChange={(e) => setNumberOfRows(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setNumberOfRows(Math.min(100, numberOfRows + 1))}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700"
                type="button"
              >
                +
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <button
              onClick={() => generateSampleData(numberOfRows)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors duration-200"
              type="button"
            >
              Generate {numberOfRows} Row{numberOfRows !== 1 ? 's' : ''}
            </button>
          </div>
          
          {generatedData.length > 0 && (
            <div className="preview-section">
              <h4 className="text-md font-medium mb-3 text-gray-700">Preview:</h4>
              <div className="max-h-64 overflow-y-auto border rounded-md bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generatedData.slice(0, 5).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-900">{item.id}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{item.title}</td>
                        <td className="px-3 py-2 text-sm text-gray-500 max-w-xs truncate">{item.description}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{item.date}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{item.category}</td>
                        <td className="px-3 py-2 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {generatedData.length > 5 && (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center bg-gray-50">
                    ... and {generatedData.length - 5} more row{generatedData.length - 5 !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={convertToPDF}
        disabled={disabled || isConverting || (showSectionGenerator && generatedData.length === 0)}
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
            {showSectionGenerator && generatedData.length > 0 
              ? `Convert Section to PDF (${generatedData.length} rows)` 
              : buttonText}
          </>
        )}
      </button>
      
      {showSectionGenerator && generatedData.length === 0 && (
        <p className="mt-2 text-sm text-gray-500">
          Generate some data first to convert to PDF
        </p>
      )}
      
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
