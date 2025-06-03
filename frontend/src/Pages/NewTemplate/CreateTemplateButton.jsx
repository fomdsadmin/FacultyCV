"use client"

import { useTemplate } from "./TemplateContext"

const CreateTemplateButton = () => {
    const { addingTemplate, createTemplate } = useTemplate()

    const handleClick = async () => {
        await createTemplate()
    }

    return (
        <button type="button" onClick={handleClick} className="btn btn-primary text-white" disabled={addingTemplate}>
            {addingTemplate ? "Creating..." : "Create Template"}
        </button>
    )
}

export default CreateTemplateButton
