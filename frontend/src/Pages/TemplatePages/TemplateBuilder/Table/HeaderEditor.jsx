import React from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";

// Create a custom Block class to use custom_tag instead of p
const CustomBlock = Quill.import('blots/block');
class CustomTagBlock extends CustomBlock {}
CustomTagBlock.tagName = 'custom_tag';

// Register the custom tag block for HeaderEditor
Quill.register({ 'formats/customtagblock': CustomTagBlock }, true);

const HeaderEditor = ({ header = "", onHeaderChange, headerWrapperTag = "div", onWrapperTagChange }) => {
    const handleHeaderChange = (value) => {
        // Value already contains <custom_tag> from Quill, just pass it through
        onHeaderChange(value);
    };

    // No conversion needed - Quill already uses custom_tag
    const displayContent = header || "";

    const wrapperTagOptions = [
        { value: "div", label: "div" },
        { value: "span", label: "span" },
        { value: "p", label: "p" },
    ];
    const modules = {
        toolbar: {
            container: [
                ["bold", "italic", "underline"],
                [{ "header": [1, 2, 3] }],
                [{ "list": "ordered" }, { "list": "bullet" }],
                ["link"],
                ["clean"]
            ]
        }
    };

    const formats = [
        "bold", "italic", "underline",
        "header",
        "list",
        "link",
        "customtagblock"
    ];

    return (
        <div className="mb-4 p-3 bg-gray-100 rounded border border-gray-300">
            <div className="mb-3">
                <strong className="text-xs text-gray-800">Table Header (Rich Text)</strong>
                <p className="text-gray-600 text-xs mt-1 mb-2">
                    Add formatted text, links, or instructions that will appear above the table.
                </p>
            </div>

            <div className="mb-3">
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4, fontWeight: 500 }}>
                    Wrapper Tag
                </label>
                <select
                    value={headerWrapperTag}
                    onChange={(e) => onWrapperTagChange(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        fontSize: 14,
                        boxSizing: "border-box"
                    }}
                >
                    {wrapperTagOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            &lt;{option.label}&gt;
                        </option>
                    ))}
                </select>
            </div>

            <div className="bg-white rounded border border-gray-300 overflow-hidden">
                <ReactQuill
                    theme="snow"
                    value={displayContent}
                    onChange={handleHeaderChange}
                    modules={modules}
                    formats={formats}
                    placeholder="Enter table header content..."
                    style={{
                        height: "200px",
                        fontSize: "12px"
                    }}
                />
            </div>
        </div>
    );
};

export default HeaderEditor;
