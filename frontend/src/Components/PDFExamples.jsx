import React, { useState } from 'react';
import GotenbergPDFConverter from './GotenbergPDFConverter';
import CVPDFGenerator from './CVPDFGenerator';
import useGotenbergPDF from '../hooks/useGotenbergPDF';
import { toast } from 'react-toastify';

/**
 * Example component demonstrating how to use the Gotenberg PDF converters
 */
const PDFExamples = () => {
  const [htmlContent, setHtmlContent] = useState(`
    <h1>Sample Document</h1>
    <p>This is a sample HTML document that will be converted to PDF.</p>
    <h2>Features</h2>
    <ul>
      <li>HTML to PDF conversion</li>
      <li>Custom styling support</li>
      <li>Professional formatting</li>
    </ul>
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <tr>
        <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Feature</th>
        <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Status</th>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">HTML Support</td>
        <td style="border: 1px solid #ddd; padding: 8px;">✅ Working</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">CSS Styling</td>
        <td style="border: 1px solid #ddd; padding: 8px;">✅ Working</td>
      </tr>
    </table>
  `);

  const [sampleCVData] = useState({
    personalInfo: {
      name: 'Dr. John Smith',
      email: 'john.smith@university.edu',
      phone: '+1 (555) 123-4567',
      address: '123 University Ave, Academic City, AC 12345'
    },
    education: [
      {
        degree: 'Ph.D.',
        field: 'Computer Science',
        institution: 'University of Technology',
        startDate: '2015',
        endDate: '2019',
        description: 'Dissertation: "Advanced Machine Learning Techniques for Data Analysis"'
      },
      {
        degree: 'M.S.',
        field: 'Computer Science',
        institution: 'State University',
        startDate: '2013',
        endDate: '2015'
      }
    ],
    employment: [
      {
        position: 'Assistant Professor',
        organization: 'University of Excellence',
        startDate: '2019',
        endDate: null,
        description: 'Teaching and research in machine learning and data science'
      },
      {
        position: 'Research Intern',
        organization: 'Tech Corporation',
        startDate: '2018',
        endDate: '2018',
        description: 'Summer internship focusing on deep learning applications'
      }
    ],
    publications: [
      {
        title: 'Machine Learning in Academic Research',
        authors: 'Smith, J., Doe, J., Johnson, M.',
        journal: 'Journal of Computer Science',
        year: '2023',
        doi: '10.1000/journal.123456'
      },
      {
        title: 'Data Analysis Techniques for Large Datasets',
        authors: 'Smith, J., Brown, A.',
        journal: 'International Conference on Data Science',
        year: '2022'
      }
    ]
  });

  const {
    isConverting,
    convertAndDownload,
    convertElementToPDF,
    checkServiceAvailability
  } = useGotenbergPDF();

  const handleConvertCurrentPage = async () => {
    try {
      await convertElementToPDF(
        document.body,
        'current-page.pdf',
        {
          marginTop: '1in',
          marginBottom: '1in',
          marginLeft: '1in',
          marginRight: '1in'
        }
      );
    } catch (error) {
      toast.error(`Failed to convert page: ${error.message}`);
    }
  };

  const handleCheckService = async () => {
    const isAvailable = await checkServiceAvailability();
    if (isAvailable) {
      toast.success('Gotenberg service is running and available!');
    } else {
      toast.error('Gotenberg service is not available. Please check if Docker is running.');
    }
  };

  return (
    <div className="pdf-examples p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gotenberg PDF Converter Examples</h1>
      
      {/* Service Status */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Service Status</h2>
        <button
          onClick={handleCheckService}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Check Gotenberg Service
        </button>
        <p className="mt-2 text-sm text-gray-600">
          Make sure Docker is running and execute: <code className="bg-gray-200 px-2 py-1 rounded">docker-compose up -d</code>
        </p>
      </div>

      {/* HTML Content Converter */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">HTML Content Converter</h2>
        <textarea
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          className="w-full h-48 p-3 border rounded-md mb-4 font-mono text-sm"
          placeholder="Enter HTML content here..."
        />
        <div className="flex gap-2">
          <GotenbergPDFConverter
            htmlContent={htmlContent}
            fileName="sample-document.pdf"
            buttonText="Convert HTML to PDF"
          />
          <button
            onClick={() => convertAndDownload(htmlContent, 'custom-document.pdf')}
            disabled={isConverting}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {isConverting ? 'Converting...' : 'Use Hook Directly'}
          </button>
        </div>
      </div>

      {/* CV PDF Generator */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">CV PDF Generator</h2>
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <h3 className="font-semibold">Sample CV Data:</h3>
          <p className="text-sm text-gray-600 mt-1">
            Name: {sampleCVData.personalInfo.name}<br/>
            Education: {sampleCVData.education.length} entries<br/>
            Employment: {sampleCVData.employment.length} entries<br/>
            Publications: {sampleCVData.publications.length} entries
          </p>
        </div>
        <CVPDFGenerator
          cvData={sampleCVData}
          fileName="sample-cv.pdf"
          showPreview={true}
          onGenerationStart={() => console.log('CV generation started')}
          onGenerationSuccess={() => console.log('CV generation completed')}
          onGenerationError={(error) => console.error('CV generation failed:', error)}
        />
      </div>

      {/* Page Converter */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Current Page Converter</h2>
        <p className="mb-4 text-gray-600">
          Convert the current page (this entire component) to PDF.
        </p>
        <button
          onClick={handleConvertCurrentPage}
          disabled={isConverting}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 transition-colors"
        >
          {isConverting ? 'Converting...' : 'Convert Current Page'}
        </button>
      </div>

      {/* Setup Instructions */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Make sure Docker is installed and running</li>
          <li>Run <code className="bg-white px-2 py-1 rounded">docker-compose up -d</code> in the project root</li>
          <li>Wait for Gotenberg to start (check with "Check Gotenberg Service" button)</li>
          <li>Use any of the converters above to generate PDFs</li>
        </ol>
        <div className="mt-4 p-3 bg-white rounded border-l-4 border-blue-400">
          <p className="text-sm">
            <strong>Note:</strong> The Gotenberg service will be available at:
          </p>
          <ul className="list-disc list-inside text-sm mt-1 ml-4">
            <li>Direct access: <code>http://localhost:3000</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PDFExamples;
