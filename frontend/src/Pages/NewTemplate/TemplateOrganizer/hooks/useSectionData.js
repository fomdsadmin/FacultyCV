import { useTemplate } from "Pages/NewTemplate/TemplateContext";
import { useTemplateOrganizer } from "../TemplateOrganizerContext";

export const useSectionData = (dataSectionId) => {
    const { getGroupIdContainingPreparedSectionId, HIDDEN_GROUP_ID } = useTemplateOrganizer();
    
    const groupId = getGroupIdContainingPreparedSectionId(dataSectionId);
    const isInHiddenGroup = groupId === HIDDEN_GROUP_ID;
    
    return { groupId, isInHiddenGroup };
};