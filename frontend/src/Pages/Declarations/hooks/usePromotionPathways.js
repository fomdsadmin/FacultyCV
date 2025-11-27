import { useMemo, useCallback } from "react";

const TRADITIONAL = "Traditional";
const TRADITIONAL_INDIGENOUS = "Traditional - Indigenous scholarly activity";
const BLENDED = "Blended with scholarship of teaching or professional contributions";

/**
 * Custom hook to manage promotion pathways as an array instead of a comma-separated string
 */
const usePromotionPathways = (promotionPathways, setPromotionPathways) => {
  // Parse the comma-separated string into an array
  const pathwaysArray = useMemo(() => {
    if (!promotionPathways) return [];
    return promotionPathways.split(", ").filter((p) => p.trim());
  }, [promotionPathways]);

  // Helper to update pathways array
  const updatePathways = useCallback((newArray) => {
    setPromotionPathways(newArray.join(", "));
  }, [setPromotionPathways]);

  // Check if a pathway is included
  const hasPathway = useCallback((pathway) => {
    return pathwaysArray.includes(pathway);
  }, [pathwaysArray]);

  // Toggle Traditional pathway
  const toggleTraditional = useCallback((isChecked) => {
    let newArray = [...pathwaysArray];
    
    if (isChecked) {
      if (!newArray.some((p) => p.includes(TRADITIONAL))) {
        newArray.push(TRADITIONAL);
      }
    } else {
      newArray = newArray.filter((p) => !p.includes(TRADITIONAL));
    }
    
    updatePathways(newArray);
  }, [pathwaysArray, updatePathways]);

  // Toggle Traditional - Indigenous pathway
  const toggleIndigenous = useCallback((isChecked) => {
    let newArray = [...pathwaysArray];
    
    if (isChecked) {
      newArray = newArray.filter((p) => p !== TRADITIONAL);
      if (!newArray.includes(TRADITIONAL_INDIGENOUS)) {
        newArray.push(TRADITIONAL_INDIGENOUS);
      }
    } else {
      newArray = newArray.filter((p) => p !== TRADITIONAL_INDIGENOUS);
      if (!newArray.includes(TRADITIONAL)) {
        newArray.push(TRADITIONAL);
      }
    }
    
    updatePathways(newArray);
  }, [pathwaysArray, updatePathways]);

  // Toggle Blended pathway
  const toggleBlended = useCallback((isChecked) => {
    let newArray = [...pathwaysArray];
    
    if (isChecked) {
      if (!newArray.includes(BLENDED)) {
        newArray.push(BLENDED);
      }
    } else {
      newArray = newArray.filter((p) => p !== BLENDED);
    }
    
    updatePathways(newArray);
  }, [pathwaysArray, updatePathways]);

  return {
    hasTraditional: hasPathway(TRADITIONAL),
    hasIndigenous: hasPathway(TRADITIONAL_INDIGENOUS),
    hasBlended: hasPathway(BLENDED),
    toggleTraditional,
    toggleIndigenous,
    toggleBlended,
  };
};

export default usePromotionPathways;
