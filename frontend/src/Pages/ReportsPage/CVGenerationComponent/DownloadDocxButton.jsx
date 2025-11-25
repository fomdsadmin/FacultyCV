import React from 'react';

const DownloadDocxButton = ({
    docxUrl,
    docxComplete,
    generating,
    downloadName,
    docxHasError
}) => {

const handleDownloadDocx = async () => {
    if (!docxUrl) return;
    try {
        const response = await fetch(docxUrl);
        if (!response.ok) throw new Error("Failed to fetch DOCX");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = downloadName || "cv.docx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Error downloading DOCX:", e);
        window.open(docxUrl, "_blank");
    }
};

    const getDocxButtonState = () => {
        if (docxHasError) {
            return {
                text: "Error generating DOCX please try again",
                style: "btn-secondary opacity-50 cursor-not-allowed",
                disabled: true
            };
        } else if (docxUrl && docxComplete) {
            return {
                text: "Download DOCX",
                style: "btn-success",
                disabled: false
            };
        } else if (generating && !docxComplete) {
            return {
                text: (
                    <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                        DOCX Processing...
                    </span>
                ),
                style: "btn-secondary opacity-50 cursor-not-allowed",
                disabled: true
            };
        } else {
            return {
                text: "No DOCX available - Please generate first",
                style: "btn-secondary opacity-50 cursor-not-allowed",
                disabled: true
            };
        }
    };

    const buttonState = getDocxButtonState();

    return (
        <button
            onClick={handleDownloadDocx}
            className={`btn w-full ${buttonState.style}`}
            disabled={buttonState.disabled}
        >
            {buttonState.text}
        </button>
    );
};

export default DownloadDocxButton;