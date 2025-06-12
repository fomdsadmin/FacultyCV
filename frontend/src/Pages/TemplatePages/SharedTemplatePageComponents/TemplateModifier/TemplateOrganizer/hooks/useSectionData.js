import { useTemplateModifier } from "../../TemplateModifierContext";

export const useSectionData = (dataSectionId) => {
    const { getGroupIdContainingPreparedSectionId, HIDDEN_GROUP_ID } = useTemplateModifier();
    
    const groupId = getGroupIdContainingPreparedSectionId(dataSectionId);
    const isInHiddenGroup = groupId === HIDDEN_GROUP_ID;
    
    return { groupId, isInHiddenGroup };
};