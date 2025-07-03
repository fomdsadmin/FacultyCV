import { useGenericSection } from "./GenericSectionContext"
import { useState, useRef, useEffect } from "react";

const MAX_LINES = 4;

const SectionDescription = () => {
    const { section } = useGenericSection();
    const [expanded, setExpanded] = useState(false);
    const [needsExpansion, setNeedsExpansion] = useState(false);
    const textRef = useRef(null);

    // Simpler formattedDescription processing:
    const formattedDescription = section.description
        ? section.description
            .trim()
            .replace(/\/newline|\n/g, "<br>")
            .replace(/\\li\s*/g, "• ")  // Convert \li to bullet points
        : "";

    useEffect(() => {
        if (textRef.current && section.description) {
            const element = textRef.current;
            const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
            const maxHeight = lineHeight * MAX_LINES;

            // Check if content height exceeds the max height for MAX_LINES
            setNeedsExpansion(element.scrollHeight > maxHeight);
        }
    }, [section.description]);

    return (
        <div className="m-4 flex flex-col">
            <div
                ref={textRef}
                className={`transition-all duration-200 overflow-hidden ${expanded ? "" : "line-clamp-4"}`}
                style={
                    !expanded
                        ? { display: "-webkit-box", WebkitLineClamp: MAX_LINES, WebkitBoxOrient: "vertical" }
                        : {}
                }
            >
                <span dangerouslySetInnerHTML={{ __html: formattedDescription }} />
            </div>
            {section.description && section.description.length > 0 && needsExpansion && (
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