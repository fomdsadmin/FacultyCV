import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PDFTableGenerator = () => {
  // Configure the number of rows here
  const NUMBER_OF_ROWS = 18700;
  
  // Function to generate random data
  const generateRandomData = () => {
    const names = ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Eve Davis', 'Frank Miller', 'Grace Wilson', 'Henry Ford', 'Ivy Chen', 'Jack Robinson'];
    const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'IT', 'Operations', 'Legal', 'Design', 'Research'];
    const statuses = ['Active', 'Inactive', 'Pending', 'On Leave', 'Remote'];
    const cities = ['New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'Toronto', 'Berlin', 'Singapore', 'Dubai', 'Mumbai'];
    const skills = [
      ['JavaScript', 'Python', 'React'], ['SQL', 'MongoDB', 'GraphQL'], 
      ['AWS', 'Docker', 'Kubernetes'], ['Machine Learning', 'Data Analysis', 'Statistics'],
      ['Project Management', 'Agile', 'Scrum'], ['UI/UX Design', 'Figma', 'Adobe Creative Suite'],
      ['Marketing', 'SEO', 'Content Strategy'], ['Finance', 'Excel', 'SAP'],
      ['Legal Research', 'Contract Law', 'Compliance'], ['Sales', 'CRM', 'Negotiation']
    ];
    const projects = [
      'E-commerce Platform Redesign\nLed team of 8 developers\nCompleted 2 weeks ahead of schedule',
      'Data Migration Project\nMigrated 2M+ records\nZero downtime deployment',
      'Mobile App Development\niOS and Android versions\n4.8 star rating on app stores',
      'Security Audit Implementation\nPCI DSS compliance achieved\nReduced security incidents by 75%',
      'Customer Portal Enhancement\nImproved user satisfaction by 40%\nReduced support tickets by 30%',
      'AI Chatbot Integration\nHandles 80% of customer inquiries\nSaved $50K annually in support costs',
      'Cloud Infrastructure Setup\nAWS multi-region deployment\n99.9% uptime SLA achieved',
      'Marketing Campaign Automation\nIncreased lead generation by 60%\nROI improved by 3.2x'
    ];
    const achievements = [
      'Employee of the Month (3x)\nCertified Solutions Architect\nPublished 2 technical papers',
      'Led digital transformation initiative\nMentored 12 junior developers\nSpoke at 3 industry conferences',
      'Increased sales by 150%\nClosed $2M+ deals in Q4\nTop performer for 2 consecutive years',
      'Reduced operational costs by 25%\nImplemented lean processes\nImproved team efficiency by 40%',
      'Patent holder (2 patents)\nOpen source contributor\nTech blog with 10K+ followers',
      'Diversity & Inclusion champion\nVolunteer coordinator\nCSR program leader'
    ];
    
    return {
      name: names[Math.floor(Math.random() * names.length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      city: cities[Math.floor(Math.random() * cities.length)],
      score: Math.floor(Math.random() * 100) + 1,
      salary: (Math.floor(Math.random() * 150) + 50) * 1000,
      skills: skills[Math.floor(Math.random() * skills.length)].join('\n• '),
      currentProject: projects[Math.floor(Math.random() * projects.length)],
      achievements: achievements[Math.floor(Math.random() * achievements.length)],
      email: `${names[Math.floor(Math.random() * names.length)].toLowerCase().replace(' ', '.')}@company.com`,
      phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      startDate: `${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 28) + 1}/${Math.floor(Math.random() * 10) + 2015}`
    };
  };

  // Function to get random color
  const getRandomColor = () => {
    const colors = [
      [255, 230, 230], // Light red
      [230, 255, 230], // Light green
      [230, 230, 255], // Light blue
      [255, 255, 230], // Light yellow
      [255, 230, 255], // Light magenta
      [230, 255, 255], // Light cyan
      [245, 245, 245], // Light gray
      [255, 245, 230], // Light orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Function to create advanced cell content with bold text support
  const createAdvancedCell = (title, content, options = {}) => {
    const { 
      titleColor = [0, 0, 0], 
      contentColor = [60, 60, 60], 
      backgroundColor = [255, 255, 255],
      titleSize = 7,
      contentSize = 6,
      makeTitleBold = true,
      makeContentBold = false
    } = options;
    
    return {
      content: `${title.toUpperCase()}\n${content}`,
      styles: {
        fillColor: backgroundColor,
        fontSize: contentSize,
        cellPadding: 3,
        valign: 'top',
        textColor: contentColor,
        fontStyle: makeTitleBold || makeContentBold ? 'bold' : 'normal'
      }
    };
  };

  // Alternative: Create cells with specific bold content
  const createBoldContentCell = (content, options = {}) => {
    const { 
      backgroundColor = [255, 255, 255],
      textColor = [0, 0, 0],
      fontSize = 6,
      isBold = false
    } = options;
    
    return {
      content: content,
      styles: {
        fillColor: backgroundColor,
        fontSize: fontSize,
        cellPadding: 3,
        valign: 'top',
        textColor: textColor,
        fontStyle: isBold ? 'bold' : 'normal'
      }
    };
  };

  const generatePDF = () => {
    console.log(`🚀 Starting PDF generation for ${NUMBER_OF_ROWS} rows...`);
    
    // Prepare data with advanced formatting (no emojis, structured text)
    const tableData = Array.from({ length: NUMBER_OF_ROWS }).map((_, i) => {
      const data = generateRandomData();
      return [
        createAdvancedCell(
          'EMPLOYEE INFO',
          `${data.name}\nID: EMP${(i + 1).toString().padStart(4, '0')}\nDepartment: ${data.department}`,
          { backgroundColor: getRandomColor(), titleSize: 7, contentSize: 6, makeContentBold: true }
        ),
        createAdvancedCell(
          'CONTACT DETAILS',
          `Email: ${data.email}\nPhone: ${data.phone}\nStart: ${data.startDate}`,
          { backgroundColor: getRandomColor(), contentColor: [60, 60, 60] }
        ),
        createAdvancedCell(
          'WORK STATUS',
          `Status: ${data.status}\nLocation: ${data.city}\nPerformance: ${data.score}%`,
          { 
            backgroundColor: data.status === 'Active' ? [200, 255, 200] : 
                           data.status === 'Inactive' ? [255, 200, 200] : [255, 255, 200],
            contentColor: data.status === 'Active' ? [0, 100, 0] : [150, 0, 0],
            makeContentBold: data.status === 'Active'
          }
        ),
        createAdvancedCell(
          'COMPENSATION',
          `Salary: $${data.salary.toLocaleString()}\nRating: ${data.score >= 80 ? 'EXCELLENT' : data.score >= 60 ? 'GOOD' : 'NEEDS IMPROVEMENT'}\nBonus: ${data.score >= 70 ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`,
          { 
            backgroundColor: data.salary >= 120000 ? [255, 215, 0] : [230, 255, 230],
            contentColor: data.salary >= 120000 ? [0, 0, 0] : [60, 60, 60],
            makeContentBold: data.salary >= 120000
          }
        ),
        createAdvancedCell(
          'TECHNICAL SKILLS',
          `Primary Skills:\n* ${data.skills.replace(/\n• /g, '\n* ')}`,
          { backgroundColor: getRandomColor() }
        ),
        createAdvancedCell(
          'CURRENT PROJECT',
          data.currentProject,
          { backgroundColor: getRandomColor() }
        ),
        createAdvancedCell(
          'ACHIEVEMENTS',
          data.achievements,
          { backgroundColor: getRandomColor() }
        ),
      ];
    });

    console.log(`📊 Data preparation complete. Starting PDF generation...`);
    
    // Start timing the actual PDF generation
    const startTime = performance.now();
    
    const doc = new jsPDF('landscape'); // Use landscape for 6 columns

    autoTable(doc, {
      head: [
        // Group headers
        [
          { content: 'EMPLOYEE INFORMATION', colSpan: 2, styles: { halign: 'center', fillColor: [52, 73, 94], fontStyle: 'bold', fontSize: 10 } },
          { content: 'STATUS & PERFORMANCE', colSpan: 2, styles: { halign: 'center', fillColor: [155, 89, 182], fontStyle: 'bold', fontSize: 10 } },
          { content: 'PROFESSIONAL DETAILS', colSpan: 3, styles: { halign: 'center', fillColor: [230, 126, 34], fontStyle: 'bold', fontSize: 10 } }
        ],
        // Column headers
        ['Personal Details', 'Contact Info', 'Work Status', 'Compensation', 'Skills', 'Current Project', 'Achievements']
      ],
      body: tableData,
      startY: 25,
      margin: { top: 25, bottom: 20, left: 8, right: 8 },
      styles: {
        fontSize: 6,
        cellPadding: 2,
        overflow: 'linebreak',
        valign: 'top',
        halign: 'left',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 35 }, // Personal Details
        1: { cellWidth: 30 }, // Contact Info
        2: { cellWidth: 25 }, // Work Status
        3: { cellWidth: 30 }, // Compensation
        4: { cellWidth: 35 }, // Skills
        5: { cellWidth: 40 }, // Current Project
        6: { cellWidth: 40 }  // Achievements
      },
      tableWidth: 'auto',
      pageBreak: 'auto',
      didDrawPage: (data) => {
        // Header with custom styling
        doc.setFontSize(18);
        doc.setTextColor(41, 128, 185);
        doc.text('COMPREHENSIVE EMPLOYEE DATABASE REPORT', data.settings.margin.left, 15);
        
        // Add a line under the header
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(0.5);
        doc.line(data.settings.margin.left, 17, doc.internal.pageSize.width - data.settings.margin.right, 17);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Multi-line data | Grouped columns | Advanced formatting', data.settings.margin.left, 20);
        
        // Footer with enhanced styling
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const pageNumber = doc.internal.getNumberOfPages();
        const totalRows = NUMBER_OF_ROWS;
        
        // Add footer line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(data.settings.margin.left, doc.internal.pageSize.height - 15, doc.internal.pageSize.width - data.settings.margin.right, doc.internal.pageSize.height - 15);
        
        doc.text(
          `Page ${pageNumber} | Total Records: ${totalRows} | Generated: ${new Date().toLocaleDateString()}`, 
          data.settings.margin.left, 
          doc.internal.pageSize.height - 10
        );
      },
    });

    // Add text below the table with bullet points
    const finalY = doc.lastAutoTable.finalY || 25;
    
    // Add some spacing
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.text('TABLE SUMMARY & NOTES', 8, finalY + 15);
    
    // Add bullet points below the table
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const bulletPoints = [
      '• This comprehensive report contains detailed employee information across multiple departments',
      '• Performance ratings are calculated based on quarterly reviews and project deliverables',
      '• Salary information is current as of the last HR update and includes base compensation only',
      '• Skills assessment reflects both technical competencies and soft skills evaluations',
      '• Project assignments are updated monthly and reflect current workload distribution',
      '• Achievement records include both individual accomplishments and team contributions',
      '• Contact information is maintained in accordance with company privacy policies'
    ];
    
    let textY = finalY + 25;
    bulletPoints.forEach(point => {
      doc.text(point, 8, textY);
      textY += 6;
    });
    
    // Add a disclaimer section
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('CONFIDENTIAL DOCUMENT - For internal use only', 8, textY + 10);
    doc.text('Generated automatically by Employee Management System', 8, textY + 18);

    // End timing and calculate duration
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`✅ PDF generation complete!`);
    console.log(`⏱️  PDF Generation Time: ${duration.toFixed(2)}ms (${(duration / 1000).toFixed(2)}s)`);
    console.log(`📄 Generated PDF with ${NUMBER_OF_ROWS} rows`);

    doc.save(`employee-data-${NUMBER_OF_ROWS}-rows.pdf`);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Advanced PDF Table Generator</h2>
      <p className="text-gray-600 mb-4">Generate a comprehensive PDF with grouped columns, multi-line content, and {NUMBER_OF_ROWS} rows of detailed employee data.</p>
      
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
        <h3 className="font-semibold text-green-800 mb-2">✅ New Features Added:</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>Bold text support:</strong> Employee names, high salaries, and active status are bold</li>
          <li>• <strong>Text below tables:</strong> Bullet points, summaries, and disclaimers</li>
          <li>• <strong>Professional formatting:</strong> Headers, footers, and structured content</li>
          <li>• <strong>Dynamic styling:</strong> Content changes based on data values</li>
        </ul>
      </div>

      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">HTML & Emoji Limitations:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• jsPDF autoTable doesn't support HTML tags in cells</li>
          <li>• Unicode emojis don't render properly in PDFs</li>
          <li>• Alternative: Use structured text formatting instead</li>
          <li>• For HTML support, consider puppeteer or html2pdf libraries</li>
        </ul>
      </div>

      <button
        onClick={generatePDF}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
      >
        📄 Generate Advanced PDF ({NUMBER_OF_ROWS} rows)
      </button>
      <div className="mt-4 text-sm text-gray-500">
        <p><strong>Features:</strong> Grouped headers, multi-line cells, bold text, table summaries</p>
        <p><strong>Groups:</strong> Employee Info | Status & Performance | Professional Details</p>
        <p><strong>Content:</strong> Personal details, contact info, skills, projects, achievements</p>
        <p><strong>Formatting:</strong> No emojis, structured text, bold formatting, bullet points below table</p>
      </div>
    </div>
  );
};

export default PDFTableGenerator;
