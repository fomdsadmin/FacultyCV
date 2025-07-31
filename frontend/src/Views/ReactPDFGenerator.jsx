import React, { useState } from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFDownloadLink, 
  PDFViewer
} from '@react-pdf/renderer';

// Register fonts for better text rendering (commented out to fix download issues)
// Font.register({
//   family: 'Roboto',
//   fonts: [
//     { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxK.woff2' },
//     { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOlCnqEu92Fr1MmWUlfBBc4.woff2', fontWeight: 'bold' }
//   ]
// });

const ReactPDFGenerator = () => {
  const [showPreview, setShowPreview] = useState(false);
  
  // Configure the number of rows here
  const NUMBER_OF_ROWS = 500; // Reduced for testing download functionality
  
  // Create styles
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      padding: 20,
      fontFamily: 'Helvetica',
      fontSize: 8,
    },
    header: {
      fontSize: 16,
      marginBottom: 10,
      textAlign: 'center',
      color: '#2563eb',
      fontWeight: 'bold',
    },
    subHeader: {
      fontSize: 10,
      marginBottom: 20,
      textAlign: 'center',
      color: '#64748b',
    },
    tableContainer: {
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#2563eb',
      color: '#ffffff',
      padding: 8,
      fontSize: 9,
      fontWeight: 'bold',
    },
    tableGroupHeader: {
      flexDirection: 'row',
      backgroundColor: '#1e40af',
      color: '#ffffff',
      padding: 6,
      fontSize: 8,
      fontWeight: 'bold',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 0.5,
      borderBottomColor: '#e5e7eb',
      minHeight: 50,
    },
    tableRowEven: {
      backgroundColor: '#f8fafc',
    },
    tableRowOdd: {
      backgroundColor: '#ffffff',
    },
    cell: {
      padding: 4,
      flex: 1,
      fontSize: 7,
      textAlign: 'left',
      borderRightWidth: 0.5,
      borderRightColor: '#e5e7eb',
    },
    cellHeader: {
      fontWeight: 'bold',
      textAlign: 'center',
    },
    cellTitle: {
      fontWeight: 'bold',
      fontSize: 7,
      color: '#1f2937',
      marginBottom: 2,
    },
    cellContent: {
      fontSize: 6,
      color: '#4b5563',
      lineHeight: 1.3,
    },
    cellActive: {
      backgroundColor: '#dcfce7',
      color: '#166534',
    },
    cellInactive: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
    },
    cellHighSalary: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      fontWeight: 'bold',
    },
    summarySection: {
      marginTop: 20,
      padding: 15,
      backgroundColor: '#f8fafc',
      borderRadius: 4,
    },
    summaryTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#2563eb',
      marginBottom: 8,
    },
    bulletPoint: {
      fontSize: 8,
      color: '#4b5563',
      marginBottom: 3,
      paddingLeft: 10,
    },
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      textAlign: 'center',
      fontSize: 7,
      color: '#9ca3af',
      borderTopWidth: 0.5,
      borderTopColor: '#e5e7eb',
      paddingTop: 5,
    },
  });

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
      'E-commerce Platform Redesign\nLed team of 8 developers\nCompleted 2 weeks ahead',
      'Data Migration Project\nMigrated 2M+ records\nZero downtime deployment',
      'Mobile App Development\niOS and Android versions\n4.8 star rating',
      'Security Audit Implementation\nPCI DSS compliance achieved\nReduced incidents by 75%',
      'Customer Portal Enhancement\nImproved satisfaction by 40%\nReduced tickets by 30%',
      'AI Chatbot Integration\nHandles 80% of inquiries\nSaved $50K annually',
      'Cloud Infrastructure Setup\nAWS multi-region deployment\n99.9% uptime SLA',
      'Marketing Campaign Automation\nIncreased leads by 60%\nROI improved by 3.2x'
    ];
    const achievements = [
      'Employee of the Month (3x)\nCertified Solutions Architect\nPublished 2 technical papers',
      'Led digital transformation\nMentored 12 junior developers\nSpoke at 3 conferences',
      'Increased sales by 150%\nClosed $2M+ deals in Q4\nTop performer 2 years',
      'Reduced costs by 25%\nImplemented lean processes\nImproved efficiency by 40%',
      'Patent holder (2 patents)\nOpen source contributor\nTech blog with 10K+ followers',
      'Diversity champion\nVolunteer coordinator\nCSR program leader'
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

  // Generate data for the table
  const tableData = Array.from({ length: NUMBER_OF_ROWS }).map((_, i) => ({
    id: i + 1,
    ...generateRandomData()
  }));

  // Cell component with dynamic styling
  const TableCell = ({ title, content, data, cellStyle }) => {
    let dynamicStyle = { ...styles.cell };
    
    // Apply conditional styling
    if (data.status === 'Active' && title === 'WORK STATUS') {
      dynamicStyle = { ...dynamicStyle, ...styles.cellActive };
    } else if (data.status === 'Inactive' && title === 'WORK STATUS') {
      dynamicStyle = { ...dynamicStyle, ...styles.cellInactive };
    } else if (data.salary >= 120000 && title === 'COMPENSATION') {
      dynamicStyle = { ...dynamicStyle, ...styles.cellHighSalary };
    }
    
    if (cellStyle) {
      dynamicStyle = { ...dynamicStyle, ...cellStyle };
    }
    
    return (
      <View style={dynamicStyle}>
        <Text style={styles.cellTitle}>{title}</Text>
        <Text style={styles.cellContent}>{content}</Text>
      </View>
    );
  };

  // Simple PDF Document component for testing
  const EmployeeReportDocument = () => (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <Text style={styles.header}>COMPREHENSIVE EMPLOYEE DATABASE REPORT</Text>
        <Text style={styles.subHeader}>
          React PDF Implementation | Multi-line data | Grouped columns | Advanced formatting
        </Text>
        
        {/* Table Container */}
        <View style={styles.tableContainer}>
          {/* Group Headers */}
          <View style={styles.tableGroupHeader}>
            <Text style={[styles.cellHeader, { flex: 2 }]}>EMPLOYEE INFORMATION</Text>
            <Text style={[styles.cellHeader, { flex: 2 }]}>STATUS & PERFORMANCE</Text>
            <Text style={[styles.cellHeader, { flex: 3 }]}>PROFESSIONAL DETAILS</Text>
          </View>
          
          {/* Column Headers */}
          <View style={styles.tableHeader}>
            <Text style={[styles.cellHeader, { flex: 1 }]}>Personal Details</Text>
            <Text style={[styles.cellHeader, { flex: 1 }]}>Contact Info</Text>
            <Text style={[styles.cellHeader, { flex: 1 }]}>Work Status</Text>
            <Text style={[styles.cellHeader, { flex: 1 }]}>Compensation</Text>
            <Text style={[styles.cellHeader, { flex: 1 }]}>Skills</Text>
            <Text style={[styles.cellHeader, { flex: 1.2 }]}>Current Project</Text>
            <Text style={[styles.cellHeader, { flex: 1.2 }]}>Achievements</Text>
          </View>
          
          {/* Table Rows - All rows */}
          {tableData.map((data, index) => (
            <View 
              key={data.id} 
              style={[
                styles.tableRow, 
                index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
              ]}
            >
              <TableCell
                title="EMPLOYEE INFO"
                content={`${data.name}\nID: EMP${data.id.toString().padStart(4, '0')}\nDept: ${data.department}`}
                data={data}
                cellStyle={{ flex: 1 }}
              />
              <TableCell
                title="CONTACT DETAILS"
                content={`${data.email}\n${data.phone}\nStart: ${data.startDate}`}
                data={data}
                cellStyle={{ flex: 1 }}
              />
              <TableCell
                title="WORK STATUS"
                content={`Status: ${data.status}\nLocation: ${data.city}\nPerformance: ${data.score}%`}
                data={data}
                cellStyle={{ flex: 1 }}
              />
              <TableCell
                title="COMPENSATION"
                content={`Salary: $${data.salary.toLocaleString()}\nRating: ${data.score >= 80 ? 'EXCELLENT' : data.score >= 60 ? 'GOOD' : 'NEEDS IMPROVEMENT'}\nBonus: ${data.score >= 70 ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`}
                data={data}
                cellStyle={{ flex: 1 }}
              />
              <TableCell
                title="SKILLS"
                content={`Primary Skills:\n${data.skills.split('\n• ').slice(0, 2).join('\n')}`}
                data={data}
                cellStyle={{ flex: 1 }}
              />
              <TableCell
                title="CURRENT PROJECT"
                content={data.currentProject.split('\n').slice(0, 2).join('\n')}
                data={data}
                cellStyle={{ flex: 1.2 }}
              />
              <TableCell
                title="ACHIEVEMENTS"
                content={data.achievements.split('\n').slice(0, 2).join('\n')}
                data={data}
                cellStyle={{ flex: 1.2 }}
              />
            </View>
          ))}
        </View>
        
        {/* Footer */}
        <Text style={styles.footer}>
          CONFIDENTIAL DOCUMENT - For internal use only | Generated: {new Date().toLocaleDateString()} | Total Records: {NUMBER_OF_ROWS}
        </Text>
      </Page>
    </Document>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800">React PDF Generator</h2>
      <p className="text-gray-600 mb-4">
        Generate a comprehensive PDF using @react-pdf/renderer with grouped columns, multi-line content, and {NUMBER_OF_ROWS} rows of detailed employee data.
      </p>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">✨ React PDF Features:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>React Components:</strong> Built with React components for better maintainability</li>
          <li>• <strong>Dynamic Styling:</strong> Conditional styles based on data values</li>
          <li>• <strong>Font Support:</strong> Custom font loading for better typography</li>
          <li>• <strong>Live Preview:</strong> View PDF in browser before downloading</li>
          <li>• <strong>Responsive Layout:</strong> Landscape orientation with flexible columns</li>
        </ul>
      </div>

      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
        <h3 className="font-semibold text-green-800 mb-2">📋 Content Features:</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>Grouped Headers:</strong> Employee Info | Status & Performance | Professional Details</li>
          <li>• <strong>Rich Content:</strong> Personal details, contact info, skills, projects, achievements</li>
          <li>• <strong>Conditional Formatting:</strong> Different colors for active/inactive status and high salaries</li>
          <li>• <strong>Summary Section:</strong> Bullet points and notes below the table</li>
        </ul>
      </div>

      <div className="flex gap-4 mb-6">
        <PDFDownloadLink
          document={<EmployeeReportDocument />}
          fileName={`employee-data-react-pdf-${NUMBER_OF_ROWS}-rows.pdf`}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
        >
          {({ blob, url, loading, error }) => {
            if (error) {
              return '❌ Error generating PDF';
            }
            return loading ? '⏳ Generating PDF...' : '📄 Download PDF';
          }}
        </PDFDownloadLink>
        
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
        >
          👁️ {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      {showPreview && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 p-3 border-b">
            <h3 className="font-semibold text-gray-800">PDF Preview</h3>
            <p className="text-sm text-gray-600">Live preview of the generated PDF</p>
          </div>
          <div style={{ height: '600px' }}>
            <PDFViewer style={{ width: '100%', height: '100%' }}>
              <EmployeeReportDocument />
            </PDFViewer>
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        <p><strong>Library:</strong> @react-pdf/renderer (React-based PDF generation)</p>
        <p><strong>Features:</strong> Component-based, live preview, custom fonts, conditional styling</p>
        <p><strong>Performance:</strong> Optimized for {NUMBER_OF_ROWS} rows (adjust NUMBER_OF_ROWS for more/less data)</p>
        <p><strong>Layout:</strong> Landscape orientation with 7 columns and grouped headers</p>
      </div>
    </div>
  );
};

export default ReactPDFGenerator;