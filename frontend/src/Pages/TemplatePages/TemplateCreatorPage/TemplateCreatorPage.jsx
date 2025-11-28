import { FaArrowLeft } from "react-icons/fa"
import { useState, useEffect } from "react"
import { useApp } from "Contexts/AppContext";
import TemplateBuilder from "../TemplateBuilder/TemplateBuilder";

export function getInitialEmptyTemplate(currentRole) {
  return {
    title: "",
    sort_ascending: true,
    created_with_role: currentRole,
    show_declaration: false,
    show_fom_logo: false,
    show_visual_nesting: false,
    templateBuilder: {
      items: []
    }
  };
}

const TemplateCreatorPage = ({ onBack }) => {
  const [template, setTemplate] = useState({ items: [] });
  const { currentViewRole } = useApp();

  useEffect(() => {
    setTemplate(getInitialEmptyTemplate(currentViewRole));
  }, [currentViewRole])

  return (
    <div className="">
      <button onClick={onBack} className="text-zinc-800 btn btn-ghost min-h-0 h-8 mt-5 leading-tight mr-4">
        <FaArrowLeft className="h-6 w-6 text-zinc-800" />
      </button>
      <div className="mt-5 leading-tight mr-4 ml-4">
        <h2 className="text-2xl font-bold mb-6">New Template</h2>
        <TemplateBuilder
          template={template}
          setTemplate={setTemplate}
          onBack={onBack}
        />
      </div>
    </div>
  )
}

export default TemplateCreatorPage
