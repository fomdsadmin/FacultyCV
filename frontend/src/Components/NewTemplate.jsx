import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaTimesCircle, FaPlusCircle } from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { addTemplate, getAllSections } from '../graphql/graphqlHelpers';

const NewTemplate = ({ onBack, fetchTemplates }) => {
  const [addingTemplate, setAddingTemplate] = useState(false);
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    const fetchedSections = await getAllSections();
    const sectionsWithToggle = fetchedSections.map(section => ({
      ...section,
      showMinus: true,
    })).sort((a, b) => a.title.localeCompare(b.title));
    console.log('Sections:', sectionsWithToggle);
    setSections(sectionsWithToggle);
    setLoading(false);
  };

  const handleCreateTemplate = async () => {
    if (!title.trim()) {
      setErrorMessage('Template title cannot be blank.');
      return;
    }

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

    const selectedSectionIdsString = selectedSectionIds.join(',');
    console.log('Selected section IDs:', selectedSectionIdsString);
    setAddingTemplate(true);
    try {
      const result = await addTemplate(title, selectedSectionIdsString, startYear, endYear);
      console.log('Created template:', result);
    } catch (error) {
      console.error('Error creating template:', error);
    }
    await fetchTemplates(); // Refresh the templates list after creation
    setAddingTemplate(false);
    onBack(); // Go back to the previous screen after creation
  };

  const handleToggle = (index) => {
    const newSections = [...sections];
    newSections[index].showMinus = !newSections[index].showMinus;
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

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newSections = Array.from(sections);
    const [movedSection] = newSections.splice(result.source.index, 1);
    newSections.splice(result.destination.index, 0, movedSection);
    setSections(newSections);
  };

  const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className=" ">
      <button onClick={onBack} className="text-zinc-800 btn btn-ghost min-h-0 h-8 mt-5 leading-tight mr-4">
        <FaArrowLeft className="h-6 w-6 text-zinc-800" />
      </button>
      <div className='mt-5 leading-tight mr-4 ml-4'>
        <h2 className="text-2xl font-bold mb-6">Create New Template</h2>
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
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={handleCreateTemplate}
                className="btn btn-primary text-white"
                disabled={addingTemplate}
              >
                {addingTemplate ? 'Creating...' : 'Create Template'}
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Title</label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Enter template title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
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

            <h2 className='text-sm font-medium text-gray-700 mt-6'>Add or remove sections you want to include on the CV.</h2>
            <h2 className='text-sm font-medium text-gray-700'> Drag and drop sections in the order you want them to appear on the CV.</h2>

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
    </div>
  );
};

export default NewTemplate;
