import React, { useState } from "react";

const EditItemsJson = ({ setItems, items }) => {
    const [open, setOpen] = useState(false);
    const [jsonText, setJsonText] = useState(() => JSON.stringify(items, null, 2));
    const [copied, setCopied] = useState(false);

    const handleOpen = () => {
        setJsonText(JSON.stringify(items, null, 2));
        setOpen(true);
        setCopied(false);
    };
    const handleClose = () => setOpen(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(jsonText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    };
    const handleSave = () => {
        try {
            const parsed = JSON.parse(jsonText);
            setItems(parsed);
            setOpen(false);
        } catch (e) {
            alert("Invalid JSON");
        }
    };

    return (
        <>
            <button
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleOpen}
            >
                Edit Items JSON
            </button>
            {open && (
                <div className="fixed inset-0 bg-black bg-opacity-25 z-[9999] flex items-center justify-center">
                    <div className="bg-white rounded-lg p-8 min-w-[600px] max-w-[90vw] shadow-2xl flex flex-col">
                        <h2 className="mb-4 text-xl font-bold">Edit Items JSON</h2>
                        <textarea
                            value={jsonText}
                            onChange={e => setJsonText(e.target.value)}
                            className="w-full h-[350px] font-mono text-sm mb-4 border border-gray-300 rounded-lg p-3 resize-vertical"
                        />
                        <div className="flex gap-3 mb-2">
                            <button className="btn btn-secondary" onClick={handleCopy}>
                                {copied ? "Copied!" : "Copy JSON"}
                            </button>
                            <button className="btn btn-success" onClick={handleSave}>
                                Save
                            </button>
                            <button className="btn btn-outline" onClick={handleClose}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EditItemsJson;