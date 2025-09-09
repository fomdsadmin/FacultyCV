import React, { useState, useEffect } from 'react';
import PageContainer from '../../Views/PageContainer.jsx';
import FacultyMenu from '../../Components/FacultyMenu.jsx';
import { getAllTemplates } from '../../graphql/graphqlHelpers.js';
import '../../CustomStyles/scrollbar.css';
import TemplateList from './TemplateList.jsx';
import ReportPreview from './CVGenerationComponent/ReportPreview.jsx';
import { useApp } from 'Contexts/AppContext.jsx';

const ReportsPage = () => {
  const { userInfo, getCognitoUser, toggleViewMode, isManagingUser, currentViewRole } = useApp();

  const [user, setUser] = useState(isManagingUser ? isManagingUser : userInfo);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    setUser(userInfo);
    const fetchData = async () => {
      setUser(userInfo);
      const allTemplates = await getAllTemplates();
      const filteredTemplates = allTemplates.filter((template) => {
        const [currentRole,] = currentViewRole.split('-');
        const currentDept = userInfo.primary_department;
        console.log(JSON.parse(template.template_structure))
        const templateCreatedWithRole = JSON.parse(template.template_structure).created_with_role;
        const [templateRole, templateDept] = templateCreatedWithRole.split('-');

        if (template.title === "Master Template") {
          return false;
        }

        // Superadmins can see all templates
        if (templateCreatedWithRole === "Admin" || templateCreatedWithRole === "Admin-All") {
          return true;
        }

        // Admin-dept can see all templates of their dept
        if (currentRole === "Admin" && currentDept === templateDept) {
          return true;
        }

        // FacultyAdmin can see all templates
        if (currentRole === "FacultyAdmin") {
          return true;
        }

        // Regular users can see templates from their department
        if (currentDept === templateDept && currentDept !== undefined && templateDept !== undefined) {
          return true;
        }

        return false;
      });

      setTemplates(filteredTemplates);
    };
    fetchData();
  }, [userInfo, currentViewRole]); // Add currentViewRole as dependency

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setPdfUrl(null); // Clear previous PDF when selecting new template
  };

  return (
    <PageContainer className="custom-scrollbar">
      <FacultyMenu
        userName={user.preferred_name || user.first_name}
        getCognitoUser={getCognitoUser}
        toggleViewMode={toggleViewMode}
        userInfo={userInfo}
      />
      <main className="ml-4 overflow-auto custom-scrollbar w-full">
        <div className="w-full px-8 pt-4">
          <h1 className="text-3xl font-bold text-zinc-800 mb-2">Reports</h1>
        </div>
        <div className="flex w-full h-full px-8 pb-8">
          <TemplateList
            templates={templates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            user={user}
            setPdfPreviewUrl={setPdfUrl}
          />

          <div className="flex-1 flex flex-col items-center bg-gray-50 rounded-lg shadow-md px-8 overflow-auto custom-scrollbar h-[90vh]">
            <ReportPreview pdfUrl={pdfUrl} />
          </div>
        </div>
      </main>
    </PageContainer>
  );
};

export default ReportsPage;