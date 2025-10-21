import { useState, useEffect } from "react";
import ModalStylingWrapper from "SharedComponents/ModalStylingWrapper";
import { useTemplateModifier } from "Pages/TemplatePages/SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext";
import AttributeSelector from "../Attributes/AttributeSelector";
import SubSectionPreview from "../SubSection/SubSectionPreview";
import ModalFooter from "./ModalFooter";

const SectionByAttributeModal = ({ isOpen, preparedSection, onClose }) => {
    const { sectionsMap } = useTemplateModifier();
    const [selectedAttribute, setSelectedAttribute] = useState("");
    const [subSectionSettings, setSubSectionSettings] = useState({ sub_sections: [], display_titles: true });

    // Get available dropdown attributes
    const getDropdownAttributes = () => {
        if (!sectionsMap || !sectionsMap[preparedSection.data_section_id]) {
            return [];
        }
        try {
            const attributesType = JSON.parse(sectionsMap[preparedSection.data_section_id].attributes_type);
            return Object.keys(attributesType.dropdown || {});
        } catch (error) {
            console.error("Error parsing attributes_type:", error);
            return [];
        }
    };

    // Initialize selected attribute from current section_by_attribute
    useEffect(() => {
        setSelectedAttribute(preparedSection.section_by_attribute || "");

        if (preparedSection.sub_section_settings) {
            setSubSectionSettings(preparedSection.sub_section_settings);
        }
    }, [preparedSection.section_by_attribute, preparedSection.sub_section_settings]);

    // Generate sub sections when attribute changes
    useEffect(() => {
        if (selectedAttribute && sectionsMap && sectionsMap[preparedSection.data_section_id]) {
            try {
                const attributesType = JSON.parse(sectionsMap[preparedSection.data_section_id].attributes_type);
                const values = attributesType.dropdown[selectedAttribute] || [];

                // Get shown attributes from prepared section
                const shownAttributeGroup = preparedSection.attribute_groups?.find(
                    group => group.id === "Shown (Attributes here will be shown)"
                );
                const shownAttributes = shownAttributeGroup?.attributes || [];

                // Check if subsections already exist for this attribute
                if (preparedSection.sub_section_settings && preparedSection.section_by_attribute === selectedAttribute) {
                    // Use existing subsections, ensure each has a 'hidden' flag
                    const normalized = {
                        ...preparedSection.sub_section_settings,
                        sub_sections: (preparedSection.sub_section_settings.sub_sections || []).map(s => ({
                            ...s,
                            hidden: typeof s.hidden === "boolean" ? s.hidden : false
                        }))
                    };
                    setSubSectionSettings(normalized);
                } else {
                    // Generate new subsections
                    const newSubSections = values.map((value, index) => ({
                        id: `${preparedSection.data_section_id}_${selectedAttribute}_${index}`,
                        original_title: value, // Dropdown value
                        renamed_title: "", // User can customize this
                        attributes: shownAttributes, // Array of attributes from original section
                        attributes_rename_dict: {}, // Object to store renamed attribute names,
                        hidden_attributes_list: [], // Array that determines which attributes should be hidden
                        hidden: false // new: whether this sub-section is hidden
                    }));

                    setSubSectionSettings({
                        sub_sections: newSubSections,
                        display_titles: true,
                    });
                }
            } catch (error) {
                console.error("Error creating sub sections:", error);
                setSubSectionSettings({ sub_sections: [], display_titles: true });
            }
        } else {
            setSubSectionSettings({ sub_sections: [], display_titles: true });
        }
    }, [selectedAttribute, sectionsMap, preparedSection]);

    // toggle hidden state for a subsection
    const toggleSubSectionHidden = (id) => {
        setSubSectionSettings(prev => {
            const subs = (prev.sub_sections || []).map(s => s.id === id ? { ...s, hidden: !s.hidden } : s);
            return { ...prev, sub_sections: subs };
        });
    };

    if (!isOpen) return null;

    return (
        <ModalStylingWrapper useDefaultBox={false}>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                onClick={onClose}
            >
                <div
                    className="bg-white rounded-lg shadow-lg p-6 max-w-6xl w-full mx-4 relative max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
                        onClick={onClose}
                    >
                        ✕
                    </button>

                    <h3 className="text-lg font-semibold mb-4">
                        Configure Section Organization
                    </h3>

                    <div className="mb-4">
                        <AttributeSelector
                            preparedSection={preparedSection}
                            selectedAttribute={selectedAttribute}
                            dropdownAttributes={getDropdownAttributes()}
                            setSelectedAttribute={setSelectedAttribute}
                            subSectionSettings={subSectionSettings}
                            setSubSectionSettings={setSubSectionSettings}
                        />

                        <SubSectionPreview
                            subSections={subSectionSettings.sub_sections}
                            setSubSectionSettings={setSubSectionSettings}
                            preparedSection={preparedSection}
                            toggleSubSectionHidden={toggleSubSectionHidden} // new prop to allow hide button actions
                        />
                    </div>

                    <ModalFooter
                        preparedSection={preparedSection}
                        selectedAttribute={selectedAttribute}
                        subSectionSettings={subSectionSettings}
                        onClose={onClose}
                    />
                </div>
            </div>
        </ModalStylingWrapper>
    );
};

export default SectionByAttributeModal;