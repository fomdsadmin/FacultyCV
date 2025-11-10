import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const HeaderEditor = ({ header = "", onHeaderChange }) => {
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
        "link"
    ];

    return (
        <div className="mb-4 p-3 bg-gray-100 rounded border border-gray-300">
            <div className="mb-3">
                <strong className="text-xs text-gray-800">Table Header (Rich Text)</strong>
                <p className="text-gray-600 text-xs mt-1 mb-2">
                    Add formatted text, links, or instructions that will appear above the table.
                </p>
            </div>

            <div className="bg-white rounded border border-gray-300 overflow-hidden">
                <ReactQuill
                    theme="snow"
                    value={header}
                    onChange={onHeaderChange}
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
