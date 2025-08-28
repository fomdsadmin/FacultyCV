import React, { useState, useEffect } from 'react';
import PageContainer from '../../Views/PageContainer.jsx';
import FacultyMenu from '../../Components/FacultyMenu.jsx';
import { getAllTemplates } from '../../graphql/graphqlHelpers.js';
import '../../CustomStyles/scrollbar.css';
import TemplateList from './TemplateList.jsx';
import ReportPreview from './CVGenerationComponent/ReportPreview.jsx';
import { useApp } from 'Contexts/AppContext.jsx';

const ReportsPage = () => {
  const { userInfo, getCognitoUser, toggleViewMode } = useApp();

  const [user, setUser] = useState(userInfo);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    setUser(userInfo);
    const fetchData = async () => {
      setUser(userInfo);
      const templates = await getAllTemplates();
      setTemplates(templates);
    };
    fetchData();
  }, [userInfo]);

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