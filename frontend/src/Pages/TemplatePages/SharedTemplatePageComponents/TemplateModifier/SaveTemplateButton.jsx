"use client"

import { useState } from "react"
import { addTemplate } from "../../../../graphql/graphqlHelpers"
import { toast } from "react-toastify"
import { useTemplateModifier } from "./TemplateModifierContext"

const SaveTemplateButton = () => {
    const {
        title,
        startYear,
        endYear,
        groups,
        HIDDEN_GROUP_ID,
        onBack
    } = useTemplateModifier()

    const [addingTemplate, setAddingTemplate] = useState(false)

    const saveTemplate = async () => {
        if (!title.trim()) {
            toast.warning("Template title cannot be blank.", { autoClose: 3000 })
            return
        }

        // Remove the hidden group from groups
        const clean_groups = groups.filter(group => group.id !== HIDDEN_GROUP_ID)
        console.log(HIDDEN_GROUP_ID)

        // Build template structure from groups data
        const templateStructure = JSON.stringify(clean_groups)
        console.log(clean_groups);

        setAddingTemplate(true)
        try {
            await addTemplate(title, templateStructure, startYear, endYear)
            toast.success("Template created successfully!", { autoClose: 3000 })
            onBack()
        } catch (error) {
            console.error("Error creating template:", error)
            toast.error("Failed to create template. Please try again.", { autoClose: 3000 })
        }
        setAddingTemplate(false)
    }

    const handleClick = async () => {
        await saveTemplate();
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            className="btn btn-primary text-white"
            disabled={addingTemplate}
        >
            {addingTemplate ? "Saving..." : "Save Template"}
        </button>
    )
}

export default SaveTemplateButton
