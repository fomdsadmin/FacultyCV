import React from 'react'
import { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import AdminMenu from '../Components/AdminMenu.jsx';
import { getAllTemplates } from '../graphql/graphqlHelpers.js';
import NewTemplate from '../Components/NewTemplate.jsx';
import TemplateCard from '../Components/TemplateCard.jsx';
import ManageTemplate from '../Components/ManageTemplate.jsx';

const Templates = ({ getCognitoUser, userInfo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openNewTemplate, setOpenNewTemplate] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setTemplates([]);
    const retrievedTemplates = await getAllTemplates();

    console.log('Templates:', retrievedTemplates);

    setTemplates(retrievedTemplates);
    setLoading(false);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };


  const handleManageClick = (value) => {
    const template = templates.filter((template) => template.template_id == value);
    setActiveTemplate(template[0]);
  };

  const searchedTemplates = templates.filter(template => {
    const title = template.title || '';

    const matchesSearch = title.toLowerCase().startsWith(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleBack = () => {
    setActiveTemplate(null);
  };

  const handleAddNewTemplate = () => {
    setOpenNewTemplate(true);
  };

  const handleBackFromNewTemplate = () => {
    setOpenNewTemplate(false);
  };

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
              <NewTemplate onBack={handleBackFromNewTemplate} fetchTemplates={fetchTemplates} />
            ) : activeTemplate === null ? (
              <div className='!overflow-auto !h-full custom-scrollbar'>
                <h1 className="text-left m-4 text-4xl font-bold text-zinc-600">Templates</h1>
                <button 
                  className="btn btn-info text-white m-4" 
                  onClick={handleAddNewTemplate}
                >
                  Add New Template
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
                <ManageTemplate template={activeTemplate} onBack={handleBack} fetchTemplates={fetchTemplates}></ManageTemplate>
              </div>
            )}
          </>
        )}
      </main>
    </PageContainer>
  )
}

export default Templates;
