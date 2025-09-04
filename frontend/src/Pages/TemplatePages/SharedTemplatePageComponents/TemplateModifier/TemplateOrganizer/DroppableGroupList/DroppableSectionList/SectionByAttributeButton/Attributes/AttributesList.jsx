import { useTemplateModifier } from "Pages/TemplatePages/SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext";
import AttributeItem from "./AttributeItem";

const AttributesList = ({ subSection, preparedSection, setSubSectionSettings }) => {
    const { HIDDEN_ATTRIBUTE_GROUP_ID } = useTemplateModifier();

    // Get shown attributes from prepared section
    const getShownAttributes = () => {
        const visibleAttributeGroups = preparedSection.attribute_groups?.filter(
            group => group.id !== HIDDEN_ATTRIBUTE_GROUP_ID
        ) || [];

        // Flatten all attributes from all visible groups into a single array
        return visibleAttributeGroups.flatMap(group => group.attributes || []);
    };

    const shownAttributes = getShownAttributes();

    if (shownAttributes.length === 0) return null;

    return (
        <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-medium text-gray-700">
                    Attributes ({shownAttributes.length}):
                </h5>
            </div>
            <div className="space-y-2">
                {shownAttributes.map((attribute) => (
                    <AttributeItem
                        key={`${subSection.id}-${attribute}`}
                        attribute={attribute}
                        subSection={subSection}
                        setSubSectionSettings={setSubSectionSettings}
                    />
                ))}
            </div>
        </div>
    );
};

export default AttributesList;