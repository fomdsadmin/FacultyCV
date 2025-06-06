import { useTemplate } from "Pages/NewTemplate/TemplateContext";

export const useSectionData = (dataSectionId) => {
    const { getGroupIdContainingPreparedSectionId, HIDDEN_GROUP_ID } = useTemplate();
    
    const groupId = getGroupIdContainingPreparedSectionId(dataSectionId);
    const isInHiddenGroup = groupId === HIDDEN_GROUP_ID;
    
    return { groupId, isInHiddenGroup };
};