import React, { useState } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import { updateSection } from '../graphql/graphqlHelpers';

const DeleteSectionModal = ({ setIsModalOpen, section, onBack, getDataSections }) => {
  const [deletingSection, setDeletingSection] = useState(false);

  async function deleteSection() {
    setDeletingSection(true);
    try {
        
        // Check if section.attributes is a string and parse it if necessary
        let attributes;
        if (typeof section.attributes === 'string') {
            attributes = JSON.parse(section.attributes);
        } else {
            attributes = section.attributes;
        }
        
        const attributesString = JSON.stringify(attributes);
        
        const result = await updateSection(section.data_section_id, true, attributesString);
        
    } catch (error) {
        console.error('Error deleting section: ', error);
    }
    setDeletingSection(false);
    await getDataSections();
    setIsModalOpen(false);
    onBack();
}


  return (
    <dialog className="modal-dialog" open>
      <div className="modal-content">
        <div>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            onClick={() => setIsModalOpen(false)}
          >
            ✕
          </button>
          <p className='mt-10 font-bold'>Deleting this section will put it in the archived sections. Are you sure you want to do this?</p>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="btn btn-warning mr-2 text-white"
              onClick={deleteSection}
              disabled={deletingSection}
            >
              {deletingSection ? 'Deleting Section...' : 'Delete Section'}
            </button>
            <button
              type="button"
              className="btn btn-info text-white"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default DeleteSectionModal;
