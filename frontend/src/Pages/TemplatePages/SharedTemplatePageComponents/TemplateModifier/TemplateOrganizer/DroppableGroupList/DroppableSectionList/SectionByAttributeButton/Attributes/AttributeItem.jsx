import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const AttributeItem = ({ attribute, subSection, setSubSectionSettings }) => {
    // Get current renamed value from attributes_rename_dict or use original attribute name
    const [currentAttributeName, setCurrentAttributeName] = useState(subSection.attributes_rename_dict[attribute] || attribute);
    
    // Check if attribute is hidden
    const isHidden = subSection.hidden_attributes_list?.includes(attribute) || false;

    const handleAttributeNameChange = (e) => {
        const newAttributeName = e.target.value;
        setSubSectionSettings(prevSettings => ({
            ...prevSettings,
            sub_sections: prevSettings.sub_sections.map(prevSubSection => {
                if (prevSubSection.id === subSection.id) {
                    return {
                        ...prevSubSection,
                        attributes_rename_dict: {
                            ...prevSubSection.attributes_rename_dict,
                            [attribute]: newAttributeName
                        }
                    };
                }
                return prevSubSection;
            })
        }));
        setCurrentAttributeName(newAttributeName);
    };

    const handleReset = () => {
        setSubSectionSettings(prevSettings => ({
            ...prevSettings,
            sub_sections: prevSettings.sub_sections.map(prevSubSection => {
                if (prevSubSection.id === subSection.id) {
                    const newRenameDict = { ...prevSubSection.attributes_rename_dict };
                    delete newRenameDict[attribute];
                    return {
                        ...prevSubSection,
                        attributes_rename_dict: newRenameDict
                    };
                }
                return prevSubSection;
            })
        }));
        setCurrentAttributeName(attribute);
    };

    const toggleAttributeVisibility = () => {
        setSubSectionSettings(prevSettings => ({
            ...prevSettings,
            sub_sections: prevSettings.sub_sections.map(prevSubSection => {
                if (prevSubSection.id === subSection.id) {
                    const currentHiddenAttributes = prevSubSection.hidden_attributes_list || [];
                    let updatedHiddenAttributes;

                    if (currentHiddenAttributes.includes(attribute)) {
                        // Remove from hidden list (show attribute)
                        updatedHiddenAttributes = currentHiddenAttributes.filter(
                            attr => attr !== attribute
                        );
                    } else {
                        // Add to hidden list (hide attribute)
                        updatedHiddenAttributes = [...currentHiddenAttributes, attribute];
                    }

                    return {
                        ...prevSubSection,
                        hidden_attributes_list: updatedHiddenAttributes
                    };
                }
                return prevSubSection;
            })
        }));
    };

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500" title={attribute}>
                {attribute}
            </span>
            <div className="flex gap-1">
                <input
                    type="text"
                    value={currentAttributeName}
                    onChange={handleAttributeNameChange}
                    placeholder={attribute}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                    type="button"
                    onClick={toggleAttributeVisibility}
                    className={`px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors ${
                        isHidden ? 'text-red-500' : 'text-gray-500'
                    }`}
                    title={isHidden ? `Show ${attribute}` : `Hide ${attribute}`}
                >
                    {isHidden ? (
                        <FaEyeSlash className="h-3 w-3" />
                    ) : (
                        <FaEye className="h-3 w-3" />
                    )}
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                    title="Reset to original name"
                >
                    ↺
                </button>
            </div>
        </div>
    );
};

export default AttributeItem;