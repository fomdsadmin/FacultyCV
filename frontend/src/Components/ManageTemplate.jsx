import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';
import DeleteTemplateModal from './DeleteTemplateModal';
import { getAllSections, updateTemplate } from '../graphql/graphqlHelpers';
import TemplateOrganizer from '../Pages/NewTemplate/TemplateOrganizer/TemplateOrganizer';
import { toast } from 'react-toastify';

const ManageTemplate = ({ template, onBack, fetchTemplates }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(template.title || '');
  const [startYear, setStartYear] = useState(template.start_year || '');
  const [endYear, setEndYear] = useState(template.end_year || '');
  const [sectionsHidden, setSectionsHidden] = useState([]);

  useEffect(() => {
    initializeTemplate();
  }, [sectionsHidden]);

  const initializeTemplate = async () => {
    setLoading(true);

    try {
      // Simply parse the JSON string - it already contains the complete groups structure
      const templateStructure = JSON.parse(template.template_structure);

        setGroups(templateStructure);
    } catch (error) {
      console.error('Error parsing template structure:', error);
      toast.error("Failed to load template data.", { autoClose: 3000 });
      setGroups([]); // Set to empty array as fallback
    }

    setLoading(false);
  };

  const fetchSections = async () => {
    const fetchedSections = await getAllSections()
    const sortedSections = fetchedSections
      .sort((a, b) => a.title.localeCompare(b.title))

    setSectionsHidden(sortedSections)
    setLoading(false)
  }

  const handleSaveTemplate = async (templateData) => {
    await updateTemplate(templateData);
    await fetchTemplates();
    onBack();
  };

  const handleTrashClick = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="">
      <div className="flex justify-between items-center pt-4">
        <button onClick={onBack} className='text-zinc-800 btn btn-ghost min-h-0 h-8 leading-tight mr-4'>
          <FaArrowLeft className="h-6 w-6 text-zinc-800" />
        </button>
        <button onClick={handleTrashClick} className='text-red-600 btn btn-ghost bg-min-h-0 h-8 leading-tight'>
          <FaTrash className="h-8 w-8 text-red-600" />
        </button>
      </div>

      <div className='mt-5 leading-tight mr-4 ml-4'>
        <h2 className="text-2xl font-bold mb-6">Manage Template</h2>

        {loading ? (
          <div className='w-full h-full flex items-center justify-center'>
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <TemplateOrganizer
            // Data
            groups={groups}
            setGroups={setGroups}
            title={title}
            setTitle={setTitle}
            startYear={startYear}
            setStartYear={setStartYear}
            endYear={endYear}
            setEndYear={setEndYear}
            // Actions
            onSave={handleSaveTemplate}
            // Configuration
            mode="edit"
            templateId={template.template_id}
            showMetadata={true}
            showActions={true}
            showInstructions={true}
          />
        )}
      </div>

      {isModalOpen && (
        <DeleteTemplateModal
          setIsModalOpen={setIsModalOpen}
          template={template}
          onBack={onBack}
          fetchTemplates={fetchTemplates}
        />
      )}
    </div>
  );
};

export default ManageTemplate;
