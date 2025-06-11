import { createContext, useContext, useState, useEffect } from 'react';
import { getAllTemplates } from '../../../graphql/graphqlHelpers.js';

const TemplatePageContext = createContext(null);

export const useTemplatePageContext = () => {
  const context = useContext(TemplatePageContext);
  if (!context) {
    throw new Error('useTemplatePageContext must be used within a TemplatePageProvider');
  }
  return context;
};

export const TemplatePageProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
    setTemplates([]);
    setLoading(true);
    const retrievedTemplates = await getAllTemplates();
    setLoading(false);
    setTemplates(retrievedTemplates);
  };

  const handleManageClick = (value) => {
    const template = templates.filter((template) => template.template_id === value);
    setActiveTemplate(template[0]);
  };

  const handleBack = () => {
    setActiveTemplate(null);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <TemplatePageContext.Provider value={{ 
      templates,
      activeTemplate,
      fetchTemplates,
      handleManageClick,
      handleBack,
      loading
    }}>
      {children}
    </TemplatePageContext.Provider>
  );
};