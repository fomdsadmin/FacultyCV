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
        <div style={{ marginBottom: 16, padding: "12px", backgroundColor: "#f5f5f5", borderRadius: 4, border: "1px solid #e0e0e0" }}>
            <div style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: 12, color: "#333" }}>Table Header (Rich Text)</strong>
                <p style={{ color: "#666", fontSize: 11, marginTop: 4, marginBottom: 8 }}>
                    Add formatted text, links, or instructions that will appear above the table.
                </p>
            </div>

            <div style={{
                backgroundColor: "white",
                borderRadius: 4,
                border: "1px solid #ddd",
                overflow: "hidden"
            }}>
                <ReactQuill
                    theme="snow"
                    value={header}
                    onChange={onHeaderChange}
                    modules={modules}
                    formats={formats}
                    placeholder="Enter table header content..."
                    style={{
                        height: "200px",
                        fontSize: 12
                    }}
                />
            </div>
        </div>
    );
};

export default HeaderEditor;
