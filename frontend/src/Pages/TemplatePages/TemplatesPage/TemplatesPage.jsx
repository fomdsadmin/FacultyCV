import { useState, useEffect } from 'react';
import PageContainer from '../../../Views/PageContainer.jsx';
import AdminMenu from '../../../Components/AdminMenu.jsx';
import NewTemplatePage from '../NewTemplatePage.jsx';
import TemplateCard from '../../../Components/TemplateCard.jsx';
import EditReportFormatting from '../../../Components/EditReportFormat.jsx';
import EditTemplatePage from 'Pages/TemplatePages/EditTemplatePage/EditTemplatePage.jsx';
import { TemplatePageProvider, useTemplatePageContext } from './TemplatePageContext.jsx';
import { useApp } from 'Contexts/AppContext.jsx';

const TemplatesPageContent = () => {
  const { getCognitoUser, userInfo} = useApp();
  const { templates, activeTemplate, handleManageClick, handleBack,loading } = useTemplatePageContext();
  
  // Local state only
  const [searchTerm, setSearchTerm] = useState('');
  const [openNewTemplate, setOpenNewTemplate] = useState(false);
  const [editReportFormatting, setEditReportFormatting] = useState(false);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const searchedTemplates = templates.filter(template => {
    const title = template.title || '';
    const matchesSearch = title.toLowerCase().startsWith(searchTerm.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => { return a.title.localeCompare(b.title) });

  const handleAddNewTemplate = () => {
    setOpenNewTemplate(true);
  };

  const handleEditReportFormatting = () => {
    setEditReportFormatting(true);
  }

  const handleBackFromNewTemplate = () => {
    setOpenNewTemplate(false);
  };

  const handleBackFromEditReportFormatting = () => {
    setEditReportFormatting(false);
  }

  return (
    <PageContainer>
      <AdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      <main className='ml-4 pr-5 overflow-auto custom-scrollbar w-full mb-4'>
        {loading ? (
          <div className='w-full h-full flex items-center justify-center'>
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <>
            {openNewTemplate ? (
              <NewTemplatePage onBack={handleBackFromNewTemplate} />
            ) : editReportFormatting ? (
              <EditReportFormatting onBack={handleBackFromEditReportFormatting} />
            ) : activeTemplate === null ? (
              <div className='!overflow-auto !h-full custom-scrollbar'>
                <h1 className="text-left m-4 text-4xl font-bold text-zinc-600">Templates</h1>
                <button 
                  className="btn btn-info text-white m-4" 
                  onClick={handleAddNewTemplate}
                >
                  Add New Template
                </button>
                <button 
                  className="btn btn-info text-white m-4" 
                  onClick={handleEditReportFormatting}
                >
                  Edit Report Formatting
                </button>
                <div className='m-4 flex'>
                  <label className="input input-bordered flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      className="grow"
                      placeholder="Search"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="h-4 w-4 opacity-70"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                        clipRule="evenodd" />
                    </svg>
                  </label>
                </div>
                {searchedTemplates.map((template) => (
                  <TemplateCard onClick={handleManageClick} key={template.template_id} id={template.template_id} title={template.title}></TemplateCard>
                ))}
              </div>
            ) : (
              <div className='!h-full custom-scrollbar'>
                <EditTemplatePage onBack={handleBack} />
              </div>
            )}
          </>
        )}
      </main>
    </PageContainer>
  )
}

const TemplatesPage = () => {
  return (
    <TemplatePageProvider>
      <TemplatesPageContent />
    </TemplatePageProvider>
  )
}

export default TemplatesPage;
