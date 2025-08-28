import React from 'react';

const DownloadPdfButton = ({
    pdfUrl,
    pdfComplete,
    generating,
    downloadName
}) => {
    
    const handleDownloadPdf = async () => {
        if (pdfUrl) {
            try {
                // Fetch the file as a blob
                const response = await fetch(pdfUrl);
                if (!response.ok) {
                    throw new Error('Failed to fetch PDF');
                }
                const blob = await response.blob();
                
                // Create download link with blob
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = downloadName || "cv.pdf";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Clean up the blob URL
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error downloading PDF:', error);
                // Fallback to opening in new tab
                window.open(pdfUrl, '_blank');
            }
        }
    };

    const getPdfButtonState = () => {
        if (pdfUrl && pdfComplete) {
            return { 
                text: "Download PDF", 
                style: "btn-success", 
                disabled: false 
            };
        } else if (generating && !pdfComplete) {
            return { 
                text: (
                    <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                        PDF Processing...
                    </span>
                ), 
                style: "btn-secondary opacity-50 cursor-not-allowed", 
                disabled: true 
            };
        } else {
            return { 
                text: "No PDF available - Please generate first", 
                style: "btn-secondary opacity-50 cursor-not-allowed", 
                disabled: true 
            };
        }
    };

    const buttonState = getPdfButtonState();

    return (
        <button
            onClick={handleDownloadPdf}
            className={`btn w-full ${buttonState.style}`}
            disabled={buttonState.disabled}
        >
            {buttonState.text}
        </button>
    );
};

export default DownloadPdfButton;