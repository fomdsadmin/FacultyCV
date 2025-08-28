import React from 'react';

const GenerateButton = ({
    generating,
    pdfComplete,
    docxComplete,
    onGenerate
}) => {

    const customGenerating = generating || (!pdfComplete ^ !docxComplete);

    const handleGenerate = () => {
        if (onGenerate && !customGenerating) {
            onGenerate();
        }
    };

    const getGenerateButtonText = () => {
        console.log("JJFilter generating;", customGenerating)
        if (customGenerating) {
            if (!pdfComplete && !docxComplete) {
                return "Generating PDF & DOCX...";
            } else if (pdfComplete && !docxComplete) {
                return "PDF Done, Generating DOCX...";
            } else if (!pdfComplete && docxComplete) {
                return "DOCX Done, Generating PDF...";
            } else {
                return "Processing...";
            }
        }
        return "Generate PDF & DOCX";
    };

    return (
        <button
            className={`w-full btn ${customGenerating ? 'btn-secondary cursor-not-allowed opacity-75' : 'btn-primary'}`}
            onClick={handleGenerate}
            disabled={customGenerating}
        >
            {customGenerating ? (
                <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {getGenerateButtonText()}
                </span>
            ) : (
                getGenerateButtonText()
            )}
        </button>
    );
};

export default GenerateButton;