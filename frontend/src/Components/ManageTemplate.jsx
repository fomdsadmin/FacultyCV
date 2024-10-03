import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaTrash, FaTimesCircle, FaPlusCircle } from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DeleteTemplateModal from './DeleteTemplateModal';
import { updateTemplate, getAllSections } from '../graphql/graphqlHelpers';

const ManageTemplate = ({ template, onBack, fetchTemplates }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [startYear, setStartYear] = useState(template.start_year || '');
  const [endYear, setEndYear] = useState(template.end_year || '');

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    const fetchedSections = await getAllSections();
    const includedSections = template.data_section_ids.split(',');
    const sectionsWithToggle = fetchedSections.map(section => ({
      ...section,
      showMinus: includedSections.includes(section.data_section_id),
    }));
    const orderedSections = sectionsWithToggle.sort((a, b) => {
      if (a.showMinus && b.showMinus) {
        return includedSections.indexOf(a.data_section_id) - includedSections.indexOf(b.data_section_id);
      }
      return a.showMinus ? -1 : 1;
    });
    
    setSections(orderedSections);
    setLoading(false);
  };

  const handleSaveTemplateChanges = async () => {
    if (!startYear || !endYear) {
      setErrorMessage('You must choose a start and end year.');
      return;
    }

    if (endYear !== 'Current' && parseInt(endYear) <= parseInt(startYear)) {
      setErrorMessage('End year must be after start year.');
      return;
    }

    const selectedSectionIds = sections
      .filter(section => section.showMinus)
      .map(section => section.data_section_id);

    if (selectedSectionIds.length === 0) {
      setErrorMessage('At least one section must be selected.');
      return;
    }

    setSavingTemplate(true);
    const selectedSectionIdsString = selectedSectionIds.join(',');
    
    try {
      const result = await updateTemplate(template.template_id, template.title, selectedSectionIdsString, startYear, endYear);
      
    } catch (error) {
      console.error('Error updating template:', error);
    }
    await fetchTemplates(); // Refresh the templates list after update
    setSavingTemplate(false);
    onBack(); // Go back to the previous screen after update
  };

  const handleToggle = (index) => {
    const newSections = [...sections];
    newSections[index].showMinus = !newSections[index].showMinus;
    setSections(newSections);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newSections = Array.from(sections);
    const [movedSection] = newSections.splice(result.source.index, 1);
    newSections.splice(result.destination.index, 0, movedSection);
    setSections(newSections);
  };

  const handleSelectAll = () => {
    const newSections = sections.map(section => ({
      ...section,
      showMinus: true,
    }));
    setSections(newSections);
  };

  const handleDeselectAll = () => {
    const newSections = sections.map(section => ({
      ...section,
      showMinus: false,
    }));
    setSections(newSections);
  };

  const handleTrashClick = () => {
    setIsModalOpen(true);
  };

  const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className=" ">
      <div className="flex justify-between items-center pt-4">
        <button onClick={onBack} className='text-zinc-800 btn btn-ghost min-h-0 h-8 leading-tight mr-4'>
          <FaArrowLeft className="h-6 w-6 text-zinc-800" />
        </button>
        <button onClick={handleTrashClick} className='text-red-600 btn btn-ghost bg-min-h-0 h-8 leading-tight'>
          <FaTrash className="h-8 w-8 text-red-600" />
        </button>
      </div>
      <div className='mt-5 leading-tight mr-4 ml-4'>
        <h2 className="text-2xl font-bold mb-6">Manage {template.title} Template</h2>
        {loading ? (
          <div className='w-full h-full flex items-center justify-center'>
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="text-red-500 text-sm mb-4">
                {errorMessage}
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveTemplateChanges}
                className="btn btn-primary text-white"
                disabled={savingTemplate}
              >
                {savingTemplate ? 'Saving...' : 'Save Template Changes'}
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <select
                className="input input-bordered w-full"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
              >
                <option value="">Select start year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <select
                className="input input-bordered w-full"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
              >
                <option value="">Select end year</option>
                <option value="Current">Current</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <h2 className='text-sm font-medium text-gray-700 mt-6'>Add or remove sections you want to include on the CV.</h2>
              <h2 className='text-sm font-medium text-gray-700'> Drag and drop sections in the order you want them to appear on the CV.</h2>
            </div>

            <div className="flex justify-end mb-4 space-x-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="btn btn-secondary text-white px-2 py-1 text-sm"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="btn btn-secondary text-white px-2 py-1 text-sm"
              >
                Deselect All
              </button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {sections.map((section, index) => (
                      <Draggable
                        key={section.data_section_id}
                        draggableId={section.data_section_id.toString()}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-2 p-2 border rounded flex justify-between items-center shadow-glow"
                          >
                            <div>
                              <h3 className="text-lg font-semibold">{section.title}</h3>
                              <p className="text-sm text-gray-600">{section.data_type}</p>
                            </div>
                            <button
                              onClick={() => handleToggle(index)}
                              className="btn btn-xs btn-circle btn-ghost"
                            >
                              {section.showMinus ? <FaTimesCircle className="h-6 w-6 text-red-500" /> : <FaPlusCircle className="h-6 w-6 text-green-500" />}
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </>
        )}
      </div>
      {isModalOpen && (
        <DeleteTemplateModal setIsModalOpen={setIsModalOpen} template={template} onBack={onBack} fetchTemplates={fetchTemplates}/>
      )}
    </div>
  );
};

export default ManageTemplate;
