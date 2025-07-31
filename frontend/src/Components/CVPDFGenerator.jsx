import React from 'react';
import { toast } from 'react-toastify';
import { FaDownload, FaSpinner, FaEye, FaFileAlt } from 'react-icons/fa';
import useGotenbergPDF from '../hooks/useGotenbergPDF';

/**
 * CVPDFGenerator Component
 * 
 * A specialized component for generating PDFs from CV data using Gotenberg
 * This component integrates with the existing CV system
 */
const CVPDFGenerator = ({
  cvData,
  template = 'default',
  fileName = 'cv-document.pdf',
  gotenbergUrl = 'http://localhost:3001', // Use CORS proxy by default
  className = '',
  showPreview = true,
  onGenerationStart,
  onGenerationSuccess,
  onGenerationError,
}) => {
  const {
    isConverting,
    convertAndDownload,
    checkServiceAvailability
  } = useGotenbergPDF(gotenbergUrl);

  /**
   * Generate HTML content from CV data
   */
  const generateCVHTML = () => {
    if (!cvData) {
      throw new Error('CV data is required');
    }

    // Basic CV template - you can expand this based on your CV data structure
    const html = `
      <div class="cv-container">
        <header class="cv-header">
          <h1 class="cv-name">${cvData.personalInfo?.name || 'Name Not Provided'}</h1>
          <div class="cv-contact">
            ${cvData.personalInfo?.email ? `<p>Email: ${cvData.personalInfo.email}</p>` : ''}
            ${cvData.personalInfo?.phone ? `<p>Phone: ${cvData.personalInfo.phone}</p>` : ''}
            ${cvData.personalInfo?.address ? `<p>Address: ${cvData.personalInfo.address}</p>` : ''}
          </div>
        </header>

        ${cvData.sections ? cvData.sections.map(section => `
          <section class="cv-section">
            <h2 class="section-title">${section.title || 'Section'}</h2>
            <div class="section-content">
              ${section.content || section.items?.map(item => `
                <div class="cv-item">
                  ${item.title ? `<h3 class="item-title">${item.title}</h3>` : ''}
                  ${item.subtitle ? `<p class="item-subtitle">${item.subtitle}</p>` : ''}
                  ${item.date ? `<p class="item-date">${item.date}</p>` : ''}
                  ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                </div>
              `).join('') || ''}
            </div>
          </section>
        `).join('') : ''}

        ${cvData.education && cvData.education.length > 0 ? `
          <section class="cv-section">
            <h2 class="section-title">Education</h2>
            <div class="section-content">
              ${cvData.education.map(edu => `
                <div class="cv-item">
                  <h3 class="item-title">${edu.degree || ''} ${edu.field ? `in ${edu.field}` : ''}</h3>
                  <p class="item-subtitle">${edu.institution || ''}</p>
                  <p class="item-date">${edu.startDate || ''} - ${edu.endDate || 'Present'}</p>
                  ${edu.description ? `<p class="item-description">${edu.description}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        ${cvData.employment && cvData.employment.length > 0 ? `
          <section class="cv-section">
            <h2 class="section-title">Employment</h2>
            <div class="section-content">
              ${cvData.employment.map(job => `
                <div class="cv-item">
                  <h3 class="item-title">${job.position || ''}</h3>
                  <p class="item-subtitle">${job.organization || ''}</p>
                  <p class="item-date">${job.startDate || ''} - ${job.endDate || 'Present'}</p>
                  ${job.description ? `<p class="item-description">${job.description}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        ${cvData.publications && cvData.publications.length > 0 ? `
          <section class="cv-section">
            <h2 class="section-title">Publications</h2>
            <div class="section-content">
              ${cvData.publications.map(pub => `
                <div class="cv-item">
                  <h3 class="item-title">${pub.title || ''}</h3>
                  <p class="item-subtitle">${pub.authors || ''}</p>
                  <p class="item-date">${pub.journal || ''} (${pub.year || ''})</p>
                  ${pub.doi ? `<p class="item-description">DOI: ${pub.doi}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}
      </div>

      <style>
        .cv-container {
          max-width: 800px;
          margin: 0 auto;
          font-family: 'Georgia', 'Times New Roman', serif;
          line-height: 1.6;
          color: #333;
        }

        .cv-header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }

        .cv-name {
          font-size: 2.5em;
          margin: 0 0 10px 0;
          font-weight: bold;
          color: #2c3e50;
        }

        .cv-contact {
          font-size: 1em;
          color: #666;
        }

        .cv-contact p {
          margin: 5px 0;
        }

        .cv-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }

        .section-title {
          font-size: 1.5em;
          color: #2c3e50;
          border-bottom: 1px solid #bdc3c7;
          padding-bottom: 5px;
          margin-bottom: 15px;
          font-weight: bold;
        }

        .section-content {
          margin-left: 20px;
        }

        .cv-item {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }

        .item-title {
          font-size: 1.2em;
          margin: 0 0 5px 0;
          color: #34495e;
          font-weight: bold;
        }

        .item-subtitle {
          margin: 0 0 5px 0;
          font-style: italic;
          color: #555;
        }

        .item-date {
          margin: 0 0 10px 0;
          font-size: 0.9em;
          color: #777;
          font-weight: bold;
        }

        .item-description {
          margin: 0;
          text-align: justify;
        }

        @media print {
          .cv-container {
            max-width: none;
            margin: 0;
          }
          
          .cv-section {
            page-break-inside: avoid;
          }
          
          .cv-item {
            page-break-inside: avoid;
          }
        }
      </style>
    `;

    return html;
  };

  /**
   * Handle PDF generation
   */
  const handleGeneratePDF = async () => {
    try {
      if (onGenerationStart) {
        onGenerationStart();
      }

      // Check if Gotenberg service is available
      const isServiceAvailable = await checkServiceAvailability();
      if (!isServiceAvailable) {
        throw new Error('Gotenberg service is not available. Please ensure it is running on ' + gotenbergUrl);
      }

      const htmlContent = generateCVHTML();
      
      await convertAndDownload(
        htmlContent,
        fileName,
        {
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
        }
      );

      if (onGenerationSuccess) {
        onGenerationSuccess();
      }

    } catch (error) {
      console.error('CV PDF generation error:', error);
      toast.error(`Failed to generate CV PDF: ${error.message}`);
      
      if (onGenerationError) {
        onGenerationError(error);
      }
    }
  };

  /**
   * Handle preview generation
   */
  const handlePreview = async () => {
    try {
      const htmlContent = generateCVHTML();
      
      // Create preview blob
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window for preview
      const previewWindow = window.open(url, '_blank');
      if (!previewWindow) {
        toast.error('Please allow popups to view the preview');
      }
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
    } catch (error) {
      console.error('CV preview error:', error);
      toast.error(`Failed to generate preview: ${error.message}`);
    }
  };

  if (!cvData) {
    return (
      <div className={`cv-pdf-generator ${className}`}>
        <div className="text-gray-500 text-center py-4">
          <FaFileAlt className="mx-auto mb-2 text-2xl" />
          <p>No CV data available for PDF generation</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`cv-pdf-generator ${className}`}>
      <div className="flex gap-2">
        {showPreview && (
          <button
            onClick={handlePreview}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaEye className="-ml-1 mr-2 h-4 w-4" />
            Preview
          </button>
        )}
        
        <button
          onClick={handleGeneratePDF}
          disabled={isConverting}
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
              Generating PDF...
            </>
          ) : (
            <>
              <FaDownload className="-ml-1 mr-2 h-4 w-4" />
              Generate CV PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CVPDFGenerator;
