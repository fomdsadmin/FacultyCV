import { DragDropContext } from "react-beautiful-dnd";
import DroppableGroup from "./DroppableGroupList/DroppableGroup";
import { toast } from "react-toastify";
import { useTemplateModifier } from "../TemplateModifierContext";

export default function TemplateOrganizer() {

  const {
    groups,
    setGroups,
    HIDDEN_GROUP_ID,
    HIDDEN_ATTRIBUTE_GROUP_ID,
  } = useTemplateModifier();

  // Helper function to handle group reordering
  const handleGroupReorder = (source, destination) => {
    const newGroups = Array.from(groups);
    const [moved] = newGroups.splice(source.index, 1);
    newGroups.splice(destination.index, 0, moved);
    setGroups(newGroups);
  };

  // Helper function to handle section reordering
  const handleSectionReorder = (source, destination) => {
    const sourceGroupIndex = groups.findIndex((l) => l.id === source.droppableId);
    const destGroupIndex = groups.findIndex((l) => l.id === destination.droppableId);
    const sourceGroup = groups[sourceGroupIndex];
    const destGroup = groups[destGroupIndex];

    const sourcePreparedSections = Array.from(sourceGroup.prepared_sections);
    const [movedPreparedSection] = sourcePreparedSections.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      // Moving within the same group
      sourcePreparedSections.splice(destination.index, 0, movedPreparedSection);
      const updatedLists = [...groups];
      updatedLists[sourceGroupIndex] = { ...sourceGroup, prepared_sections: sourcePreparedSections };
      setGroups(updatedLists);
    } else {
      // Moving to different group
      const destPreparedSections = Array.from(destGroup.prepared_sections);
      destPreparedSections.splice(destination.index, 0, movedPreparedSection);
      const updatedGroups = [...groups];
      updatedGroups[sourceGroupIndex] = { ...sourceGroup, prepared_sections: sourcePreparedSections };
      updatedGroups[destGroupIndex] = { ...destGroup, prepared_sections: destPreparedSections };
      setGroups(updatedGroups);
    }
  };

  // Helper function to handle attribute group reordering
  const handleAttributeGroupReorder = (source, destination, type) => {
    // Extract section ID from type (format: attribute-group-{sectionId})
    const sectionId = type.replace('attribute-group-', '');

    console.log('Attribute Group Reorder:', { sectionId, type, source, destination });
    console.log('Current groups structure:', groups);

    const updatedGroups = groups.map(group => ({
      ...group,
      prepared_sections: group.prepared_sections.map(section => {
        // Add safety check for section.data_section_id
        if (!section || !section.data_section_id) {
          console.log('Section missing or has no data_section_id:', section);
          return section;
        }

        // Convert section.data_section_id to string for comparison
        if (section.data_section_id.toString() === sectionId) {
          console.log('Found matching section:', section.data_section_id);

          if (!section.attribute_groups) {
            console.log('Section has no attribute_groups:', section);
            return section;
          }

          // Find the hidden attribute group index
          const hiddenAttributeGroupIndex = section.attribute_groups.findIndex(
            attributeGroup => attributeGroup.id === HIDDEN_ATTRIBUTE_GROUP_ID
          );

          // Prevent moving the hidden attribute group or moving other groups to position 0
          if (source.index === hiddenAttributeGroupIndex || destination.index === 0) {
            console.log('Cannot move hidden attribute group or move items to position 0');
            return section;
          }

          // Prevent moving items to the hidden attribute group position
          if (destination.index <= hiddenAttributeGroupIndex) {
            console.log('Cannot move items to or before the hidden attribute group position');
            return section;
          }

          const sourceAttributeGroups = Array.from(section.attribute_groups);
          const [movedAttributeGroup] = sourceAttributeGroups.splice(source.index, 1);
          sourceAttributeGroups.splice(destination.index, 0, movedAttributeGroup);

          console.log('Updated attribute groups:', sourceAttributeGroups);
          return {
            ...section,
            attribute_groups: sourceAttributeGroups
          };
        }
        return section;
      })
    }));

    setGroups(updatedGroups);
  };

  // Helper function to handle attribute reordering
  const handleAttributeReorder = (source, destination, type) => {
    // Extract section ID from type (format: attributes-{sectionId})
    const sectionId = type.replace('attributes-', '');

    // Extract attribute group IDs from droppableId (format: attributes-{sectionId}-{attributeGroupId})
    const sourceAttributeGroupId = source.droppableId.replace(`attributes-${sectionId}-`, '');
    const destAttributeGroupId = destination.droppableId.replace(`attributes-${sectionId}-`, '');

    console.log('Attribute Reorder:', {
      sectionId,
      sourceAttributeGroupId,
      destAttributeGroupId,
      source,
      destination
    });

    const updatedGroups = groups.map(group => ({
      ...group,
      prepared_sections: group.prepared_sections.map(section => {
        // Add safety check for section.data_section_id
        if (!section || !section.data_section_id) {
          console.log('Section missing or has no data_section_id:', section);
          return section;
        }

        // Convert section.data_section_id to string for comparison
        if (section.data_section_id.toString() === sectionId) {
          console.log('Found matching section for attributes:', section.data_section_id);

          if (!section.attribute_groups || !Array.isArray(section.attribute_groups)) {
            console.log('Section has no attribute_groups or is not an array:', section);
            return section;
          }

          // Find source and destination attribute groups
          const sourceAttributeGroupIndex = section.attribute_groups.findIndex(attributeGroup => {
            if (!attributeGroup || !attributeGroup.id) {
              console.log('Attribute group missing or has no ID:', attributeGroup);
              return false;
            }
            return attributeGroup.id.toString() === sourceAttributeGroupId;
          });

          const destAttributeGroupIndex = section.attribute_groups.findIndex(attributeGroup => {
            if (!attributeGroup || !attributeGroup.id) {
              console.log('Attribute group missing or has no ID:', attributeGroup);
              return false;
            }
            return attributeGroup.id.toString() === destAttributeGroupId;
          });

          console.log('Attribute group indices:', { sourceAttributeGroupIndex, destAttributeGroupIndex });

          if (sourceAttributeGroupIndex === -1 || destAttributeGroupIndex === -1) {
            console.log('Could not find attribute groups');
            return section;
          }

          const sourceAttributeGroup = section.attribute_groups[sourceAttributeGroupIndex];
          const destAttributeGroup = section.attribute_groups[destAttributeGroupIndex];

          if (!sourceAttributeGroup || !sourceAttributeGroup.attributes) {
            console.log('Source attribute group missing or has no attributes:', sourceAttributeGroup);
            return section;
          }

          // Check if destination is the hidden attribute group
          const isMovingToHidden = destAttributeGroup.id === HIDDEN_ATTRIBUTE_GROUP_ID;
          
          if (isMovingToHidden) {
            // Count total visible attributes (attributes not in hidden group)
            const totalVisibleAttributes = section.attribute_groups.reduce((count, group) => {
              if (group.id !== HIDDEN_ATTRIBUTE_GROUP_ID && group.attributes) {
                return count + group.attributes.length;
              }
              return count;
            }, 0);

            // If there's only 1 visible attribute left, prevent moving it to hidden
            if (totalVisibleAttributes <= 1) {
              console.log('Cannot move the last visible attribute to hidden group');
              toast.warning('At least one attribute must be displayed!', {autoClose: 3000})
              return section;
            }
          }

          // Get the moved attribute
          const sourceAttributes = Array.from(sourceAttributeGroup.attributes);
          const [movedAttribute] = sourceAttributes.splice(source.index, 1);

          console.log('Moving attribute:', movedAttribute);

          const updatedAttributeGroups = [...section.attribute_groups];

          if (sourceAttributeGroupId === destAttributeGroupId) {
            // Moving within same attribute group
            sourceAttributes.splice(destination.index, 0, movedAttribute);
            updatedAttributeGroups[sourceAttributeGroupIndex] = {
              ...sourceAttributeGroup,
              attributes: sourceAttributes
            };
          } else {
            // Moving to different attribute group
            if (!destAttributeGroup || !destAttributeGroup.attributes) {
              console.log('Destination attribute group missing or has no attributes:', destAttributeGroup);
              return section;
            }

            const destAttributes = Array.from(destAttributeGroup.attributes);
            destAttributes.splice(destination.index, 0, movedAttribute);

            // Update both attribute groups
            updatedAttributeGroups[sourceAttributeGroupIndex] = {
              ...sourceAttributeGroup,
              attributes: sourceAttributes
            };
            updatedAttributeGroups[destAttributeGroupIndex] = {
              ...destAttributeGroup,
              attributes: destAttributes
            };
          }

          console.log('Updated attribute groups:', updatedAttributeGroups);
          return {
            ...section,
            attribute_groups: updatedAttributeGroups
          };
        }
        return section;
      })
    }));

    setGroups(updatedGroups);
  };

  const onDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    // Find the default group index
    const hiddenGroupIndex = groups.findIndex(group => group.id === HIDDEN_GROUP_ID);

    // If default group is not at the bottom of the page, don't allow any group reordering
    console.log(result);
    if (destination.index >= hiddenGroupIndex && result.source.droppableId === "all-groups") {
      return;
    }

    // Handle different drag types
    if (type === "column") {
      handleGroupReorder(source, destination);
    } else if (type.startsWith("attribute-group-")) {
      handleAttributeGroupReorder(source, destination, type);
    } else if (type.startsWith("attributes-")) {
      handleAttributeReorder(source, destination, type);
    } else {
      // Handle section reordering (existing logic)
      handleSectionReorder(source, destination);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
        <DroppableGroup groups={groups} />
    </DragDropContext>
  );
}
