import React from "react";
import ModalStylingWrapper from "SharedComponents/ModalStylingWrapper";
import { useTemplateModifier } from "../../../TemplateModifierContext";

const ModifiedWarningModal = ({ open, onClose, descriptions, sectionId }) => {
  const { setGroups } = useTemplateModifier();
  if (!open) return null;
  return (
    <ModalStylingWrapper useDefaultBox={true}>
      <button
        type="button"
        className="absolute top-2 right-2 btn btn-circle btn-ghost z-10"
        onClick={(e) => {
            e.stopPropagation();
            onClose();
        }}
        aria-label="Close"
      >
        ✕
      </button>
      <h2 className="text-lg font-bold mb-4">Section Changes</h2>
      <ul className="mb-4 list-disc pl-6 text-gray-700">
        {descriptions.map((desc, idx) => (
          <li key={idx}>{desc}</li>
        ))}
      </ul>
      <div className="flex gap-2 justify-end mt-2">
        <button
          className="btn btn-primary"
          onClick={(e) => {
            e.stopPropagation();
            setGroups(prevGroups =>
              prevGroups.map(group => ({
                ...group,
                prepared_sections: group.prepared_sections.map(section =>
                  section.data_section_id === sectionId
                    ? { ...section, modified: false, modified_description: [] }
                    : section
                )
              }))
            );
            onClose();
          }}
        >
          Resolve Warning
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onClose}
          aria-label="Exit"
        >
          Exit
        </button>
      </div>
    </ModalStylingWrapper>
  );
};

export default ModifiedWarningModal;
