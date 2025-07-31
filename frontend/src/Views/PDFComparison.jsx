import React from 'react';
import PDFTableGenerator from './PDFTableGenerator';
import ReactPDFGenerator from './ReactPDFGenerator';

const PDFComparison = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">PDF Generation Comparison</h1>
          <p className="text-lg text-gray-600">
            Compare jsPDF autoTable vs React-PDF for different use cases
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* jsPDF autoTable Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <h2 className="text-xl font-semibold text-gray-800">jsPDF + autoTable</h2>
            </div>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold text-blue-800 mb-2">Best For:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Converting existing HTML/React components</li>
                <li>• Large datasets (500+ rows efficiently)</li>
                <li>• Complex layouts with rich HTML content</li>
                <li>• Leveraging existing CSS styling</li>
                <li>• html2canvas integration for complex UIs</li>
              </ul>
            </div>
            <PDFTableGenerator />
          </div>
          
          {/* React-PDF Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <h2 className="text-xl font-semibold text-gray-800">React-PDF</h2>
            </div>
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <h3 className="font-semibold text-green-800 mb-2">Best For:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Professional reports, invoices, documents</li>
                <li>• Superior typography and formatting control</li>
                <li>• Server-side PDF generation</li>
                <li>• Optimized file sizes and performance</li>
                <li>• Built-from-scratch document layouts</li>
              </ul>
            </div>
            <ReactPDFGenerator />
          </div>
        </div>
        
        {/* Feature Comparison Table */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold">Feature</th>
                  <th className="text-center p-3 font-semibold">jsPDF + autoTable</th>
                  <th className="text-center p-3 font-semibold">React-PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-3 font-medium">Performance (Large Data)</td>
                  <td className="p-3 text-center">✅ Excellent</td>
                  <td className="p-3 text-center">⚠️ Good (slower)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Emoji Support</td>
                  <td className="p-3 text-center">❌ No</td>
                  <td className="p-3 text-center">✅ Full Support</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">HTML/CSS Styling</td>
                  <td className="p-3 text-center">❌ Limited</td>
                  <td className="p-3 text-center">✅ CSS-like</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Complex Layouts</td>
                  <td className="p-3 text-center">⚠️ Manual</td>
                  <td className="p-3 text-center">✅ Flexbox</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">File Size</td>
                  <td className="p-3 text-center">✅ Smaller</td>
                  <td className="p-3 text-center">⚠️ Larger</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Learning Curve</td>
                  <td className="p-3 text-center">⚠️ Steeper</td>
                  <td className="p-3 text-center">✅ React-like</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Bundle Size</td>
                  <td className="p-3 text-center">✅ Smaller</td>
                  <td className="p-3 text-center">⚠️ Larger</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Runtime Generation</td>
                  <td className="p-3 text-center">✅ Fast</td>
                  <td className="p-3 text-center">⚠️ Slower</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Recommendations */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Choose jsPDF when:</h3>
            <ul className="text-blue-700 space-y-2">
              <li>• You need to handle massive datasets (10k+ rows)</li>
              <li>• Performance is critical</li>
              <li>• You're building reports/exports for business data</li>
              <li>• Bundle size is a concern</li>
              <li>• Simple table layouts are sufficient</li>
            </ul>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-3">Choose React-PDF when:</h3>
            <ul className="text-green-700 space-y-2">
              <li>• You need rich, modern document layouts</li>
              <li>• Emojis and Unicode characters are important</li>
              <li>• You want React-like component development</li>
              <li>• Complex styling and formatting is required</li>
              <li>• Smaller datasets (under 1000 rows)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFComparison;
