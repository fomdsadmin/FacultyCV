import React, { useState } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import { deleteTemplate } from '../graphql/graphqlHelpers';

const DeleteTemplateModal = ({ setIsModalOpen, template, onBack, fetchTemplates }) => {
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  async function removeTemplate() {
    setDeletingTemplate(true);
    try {
      const result = await deleteTemplate(template.template_id);
      
    } catch (error) {
      console.error('Error deleting template: ', error);
    }
    setDeletingTemplate(false);
    await fetchTemplates();
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
          <p className='mt-10 font-bold'>Are you sure you want to delete this template?</p>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="btn btn-warning mr-2 text-white"
              onClick={removeTemplate}
              disabled={deletingTemplate}
            >
              {deletingTemplate ? 'Deleting Template...' : 'Delete Template'}
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

export default DeleteTemplateModal;
