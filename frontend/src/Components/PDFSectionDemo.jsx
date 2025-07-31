    import React from 'react';
import GotenbergPDFConverter from './GotenbergPDFConverter';

/**
 * Demo component showing how to use the GotenbergPDFConverter with section generation
 */
const PDFSectionDemo = () => {
  const handleConversionStart = () => {
    console.log('PDF conversion started...');
  };

  const handleConversionSuccess = (pdfBlob) => {
    console.log('PDF conversion successful!', pdfBlob);
  };

  const handleConversionError = (error) => {
    console.error('PDF conversion failed:', error);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">PDF Section Generator Demo</h1>
      
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Generate Custom Data Section
          </h2>
          <p className="text-gray-600 mb-6">
            Use the controls below to generate a custom number of rows and convert them to PDF.
            You can adjust the number of rows and preview the data before generating the PDF.
          </p>
          
          <GotenbergPDFConverter
            showSectionGenerator={true}
            sectionTitle="Sample Data Report"
            fileName="custom-data-report"
            onConversionStart={handleConversionStart}
            onConversionSuccess={handleConversionSuccess}
            onConversionError={handleConversionError}
            options={{
              marginTop: '0.75in',
              marginBottom: '0.75in',
              marginLeft: '0.75in',
              marginRight: '0.75in',
              format: 'A4',
              landscape: false,
              scale: 1.0,
              printBackground: true,
              waitDelay: '1s',
              emulatedMediaType: 'print'
            }}
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Regular PDF Converter
          </h2>
          <p className="text-gray-600 mb-4">
            This is the regular PDF converter without section generation.
          </p>
          
          <GotenbergPDFConverter
            fileName="regular-document"
            buttonText="Convert Current Page to PDF"
            htmlContent="<h1>Sample HTML Content</h1><p>This is a sample document that will be converted to PDF.</p>"
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Usage Instructions:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Use the number input or +/- buttons to set how many rows you want to generate</li>
            <li>Click "Generate X Rows" to create sample data</li>
            <li>Preview the generated data in the table below</li>
            <li>Click "Convert Section to PDF" to download the PDF</li>
            <li>The PDF will include a nicely formatted table with all your generated data</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PDFSectionDemo;
