import { HIDDEN_ATTRIBUTE_GROUP_ID } from "./SharedTemplatePageComponents/TemplateModifier/TemplateModifierContext";

const deepCompare = (arg1, arg2) => {
    if (Object.prototype.toString.call(arg1) === Object.prototype.toString.call(arg2)) {
        if (Object.prototype.toString.call(arg1) === '[object Object]' || Object.prototype.toString.call(arg1) === '[object Array]') {
            if (Object.keys(arg1).length !== Object.keys(arg2).length) {
                return false;
            }
            return (Object.keys(arg1).every(function (key) {
                return deepCompare(arg1[key], arg2[key]);
            }));
        }
        return (arg1 === arg2);
    }
    return false;
}

export const syncTemplateSections = (groups, upToDateSections) => {
    return groups.map((group) => {
        let sectionModified = false;
        let modifiedDescriptionSet = new Set();

        // map prepared_sections -> possibly null (deleted) or updated section
        const updatedSections = group.prepared_sections.map((section) => {
            // match by title only
            const upToDateSection = getUpToDateSectionViaTitle(upToDateSections, section.title);

            // If null it means the section was deleted
            if (!upToDateSection) {
                sectionModified = true;
                return null;
            }

            const syncResult = syncSectionAttributes(section.attribute_groups, JSON.parse(upToDateSection.attributes));
            if (syncResult.modified) {
                sectionModified = true;
                modifiedDescriptionSet.add("Attributes were renamed, added, or deleted.");
            }

            if (upToDateSection.title !== section.title) {
                sectionModified = true;
                modifiedDescriptionSet.add("Section title was renamed.");
            }

            if (section.attributes_type && upToDateSection.attributes_type && !deepCompare(JSON.parse(upToDateSection.attributes_type), JSON.parse(section.attributes_type))) {
                sectionModified = true;
                modifiedDescriptionSet.add("Attribute types were changed");
            }

            if (section.modified_description) {
                section.modified_description.forEach((description) => {
                    modifiedDescriptionSet.add(description);
                });
            }

            return {
                ...section,
                attributes_type: upToDateSection.attributes_type,
                attribute_groups: syncResult.syncedAttributeGroups,
                title: upToDateSection.title,
                modified: section.modified || sectionModified,
                modified_description: [...modifiedDescriptionSet]
            };
        });

        // remove null entries produced for deleted sections
        const filteredUpdatedSections = (Array.isArray(updatedSections) ? updatedSections.filter(Boolean) : []);

        return {
            ...group,
            prepared_sections: filteredUpdatedSections
        };
    });
};

const syncSectionAttributes = (attributeGroups, upToDateAttributes) => {
    const upToDateAttrArr = Object.keys(upToDateAttributes);
    // Flatten all current attribute names in groups (just strings)
    const currentAttrNames = attributeGroups.flatMap(g => g.attributes);
    let modified = false;
    // Remove attributes not in upToDateAttrArr from each group
    const cleanedGroups = attributeGroups.map(attrGroup => {
        const filteredAttrs = attrGroup.attributes.filter(attr => upToDateAttrArr.includes(attr));
        if (filteredAttrs.length !== attrGroup.attributes.length) modified = true;
        return {
            ...attrGroup,
            attributes: filteredAttrs
        };
    });

    // Find new attributes to add
    const newAttrs = upToDateAttrArr.filter(attrName => !currentAttrNames.includes(attrName));
    if (newAttrs.length > 0) {
        const hiddenGroup = cleanedGroups.find(g => g.id === HIDDEN_ATTRIBUTE_GROUP_ID);
        if (hiddenGroup) {
            // Add new attributes to hidden group (just strings)
            hiddenGroup.attributes = [
                ...hiddenGroup.attributes,
                ...newAttrs
            ];
            modified = true;
        }
    }
    return {
        syncedAttributeGroups: cleanedGroups,
        modified
    };
}

const getUpToDateSectionViaTitle = (upToDateSections, sectionTitle) => {
    if (!sectionTitle) return null;
    const target = String(sectionTitle).trim(); // trim input to avoid whitespace mismatches
    // try exact match first
    let found = upToDateSections.find((s) => String(s.title || '').trim() === target);
    if (found) return found;
    // try case-insensitive match
    const lower = target.toLowerCase();
    found = upToDateSections.find((s) => String(s.title || '').toLowerCase().trim() === lower);
    return found || null;
};