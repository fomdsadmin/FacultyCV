import React, { useState, useEffect } from 'react';
import PageContainer from '../../Views/PageContainer.jsx';
import FacultyMenu from '../../Components/FacultyMenu.jsx';
import { cvIsUpToDate, getAllTemplates } from '../../graphql/graphqlHelpers.js';
import '../../CustomStyles/scrollbar.css';
import { getDownloadUrl, uploadLatexToS3 } from '../../utils/reportManagement.js';
import { useNotification } from '../../Contexts/NotificationContext.jsx';
import { getUserId } from '../../getAuthToken.js';
import TemplateList from './TemplateList.jsx';
import ReportPreview from './ReportPreview.jsx';
import { buildLatex } from './LatexFunctions/LatexBuilder.js';
import { useApp } from 'Contexts/AppContext.jsx';

const ReportsPage = () => {
  const {userInfo, getCognitoUser, toggleViewMode} = useApp();

  const [user, setUser] = useState(userInfo);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [latex, setLatex] = useState('');
  const [buildingLatex, setBuildingLatex] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadUrlDocx, setDownloadUrlDocx] = useState(null);
  const { setNotification } = useNotification();
  const [switchingTemplates, setSwitchingTemplates] = useState(false);
  

  useEffect(() => {
    setUser(userInfo);
    const fetchData = async () => {
      setLoading(true);
      setUser(userInfo);
      const templates = await getAllTemplates();
      setTemplates(templates);
      setLoading(false);
    };
    fetchData();
  }, [userInfo]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const createLatexFile = async (template, startYear, endYear) => {
    setSwitchingTemplates(true);

    // Update template with selected date range
    const templateWithDates = {
      ...template,
      start_year: startYear,
      end_year: endYear
    };

    const cvUpToDate = await cvIsUpToDate(
      await getUserId(),
      userInfo.user_id,
      template.template_id
    );

    const key = `${userInfo.user_id}/${template.template_id}/resume.tex`;

    if (true) {
      setBuildingLatex(true);

      // Direct function call - much simpler!
      const latex = await buildLatex(userInfo, templateWithDates);
      setLatex(latex);

      // Upload .tex to S3
      await uploadLatexToS3(latex, key);

      // Wait till URLs for both PDF and DOCX are available
      const pdfUrl = await getDownloadUrl(key.replace("tex", "pdf"), 0);
      const docxUrl = await getDownloadUrl(key.replace("tex", "docx"), 0);

      setNotification(true);
      setBuildingLatex(false);
      setSwitchingTemplates(false);
      setDownloadUrl(pdfUrl);
      setDownloadUrlDocx(docxUrl);
    } else {
      // If no new .tex was uploaded, fetch both URLs
      const pdfUrl = await getDownloadUrl(key.replace("tex", "pdf"), 0);
      const docxUrl = await getDownloadUrl(key.replace("tex", "docx"), 0);
      setSwitchingTemplates(false);
      setDownloadUrl(pdfUrl);
      setDownloadUrlDocx(docxUrl);
    }
  };

  const handleGenerate = (template, startYear, endYear) => {
    createLatexFile(template, startYear, endYear);
  };

  return (
    <PageContainer className="custom-scrollbar">
      <FacultyMenu
        userName={user.preferred_name || user.first_name}
        getCognitoUser={getCognitoUser}
        toggleViewMode={toggleViewMode} userInfo={userInfo}/>
      <main className="ml-4 overflow-auto custom-scrollbar w-full">
        <div className="w-full px-8 pt-4">
          <h1 className="text-3xl font-bold text-zinc-800 mb-2">Reports</h1>
        </div>
        <div className="flex w-full h-full px-8 pb-8">
          {/* Left Panel: Template List */}
          <TemplateList
            templates={templates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            onGenerate={handleGenerate}
            buildingLatex={buildingLatex}
            switchingTemplates={switchingTemplates}
            downloadUrl={downloadUrl}
            downloadUrlDocx={downloadUrlDocx}
            user={user}
          />

          {/* Right Panel: Resume Preview */}
          <div className="flex-1 flex flex-col items-center bg-gray-50 rounded-lg shadow-md px-8 overflow-auto custom-scrollbar h-[90vh]">
            <ReportPreview
              loading={loading}
              selectedTemplate={selectedTemplate}
              downloadUrl={downloadUrl}
            />
          </div>
        </div>
      </main>
    </PageContainer>
  );
};

export default ReportsPage;