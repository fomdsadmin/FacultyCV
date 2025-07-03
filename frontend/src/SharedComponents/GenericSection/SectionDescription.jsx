import { useGenericSection } from "./GenericSectionContext"
import { useState } from "react";

const MAX_LINES = 4;

const SectionDescription = () => {
    const { section } = useGenericSection();
    const [expanded, setExpanded] = useState(false);

    // Support both \newline and real newlines
    const formattedDescription = section.description
        ? section.description.trim().replace(/\/newline|\n/g, "<br>")
        : "";

    // Count lines for both cases
    const lineCount = section.description
        ? section.description.split(/\/newline|\n/).length
        : 0;
    return (
        <div className="m-4 flex flex-col">
            <div
                className={`transition-all duration-200 overflow-hidden ${expanded ? "" : "line-clamp-3"}`}
                style={
                    !expanded
                        ? { display: "-webkit-box", WebkitLineClamp: MAX_LINES, WebkitBoxOrient: "vertical" }
                        : {}
                }
            >
                <span dangerouslySetInnerHTML={{ __html: formattedDescription }} />
            </div>
            {section.description && section.description.length > 0 && lineCount > MAX_LINES && (
                <button
                    className="text-blue-600 text-sm mt-2 self-start hover:underline"
                    onClick={() => setExpanded((prev) => !prev)}
                >
                    {expanded ? "Show less" : "Show more"}
                </button>
            )}
        </div>
    );
}

export default SectionDescription