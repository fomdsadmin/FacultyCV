// Example usage of the HTML builder
import { buildHtml } from './HtmlBuilder.js';

// Example function to generate HTML CV (now supports single user or array of users)
export const generateHtmlCV = async (userInfoInput, template) => {
    try {
        // Call the HTML builder with user info (single or array) and template
        const htmlOutput = await buildHtml(userInfoInput, template);
        
        // Return the generated HTML
        return htmlOutput;
    } catch (error) {
        console.error('Error generating HTML CV:', error);
        throw error;
    }
};

// Example function to download HTML as file (supports multiple users)
export const downloadHtmlCV = async (userInfoInput, template, filename = 'cv.html') => {
    try {
        const htmlContent = await generateHtmlCV(userInfoInput, template);
        
        // Adjust filename for multiple users
        const finalFilename = Array.isArray(userInfoInput) && userInfoInput.length > 1 
            ? `multiple_cvs_${userInfoInput.length}_users.html`
            : filename;
        
        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading HTML CV:', error);
        throw error;
    }
};

// Example function to display HTML in a new window (supports multiple users)
export const previewHtmlCV = async (userInfoInput, template) => {
    try {
        const htmlContent = await generateHtmlCV(userInfoInput, template);
        
        const newWindow = window.open('', '_blank');
        newWindow.document.write(htmlContent);
        newWindow.document.close();
    } catch (error) {
        console.error('Error previewing HTML CV:', error);
        throw error;
    }
};

// Example function to convert HTML to PDF (supports multiple users)
export const convertHtmlToPdf = async (userInfoInput, template, filename = 'cv.pdf') => {
    try {
        const htmlContent = await generateHtmlCV(userInfoInput, template);
        
        // Adjust filename for multiple users
        const finalFilename = Array.isArray(userInfoInput) && userInfoInput.length > 1 
            ? `multiple_cvs_${userInfoInput.length}_users.pdf`
            : filename;
        
        // Note: This would require importing html2pdf.js or similar library
        // const html2pdf = (await import('html2pdf.js')).default;
        
        // const element = document.createElement('div');
        // element.innerHTML = htmlContent;
        
        // const opt = {
        //     margin: 0.2,
        //     filename: finalFilename,
        //     image: { type: 'jpeg', quality: 0.98 },
        //     html2canvas: { scale: 2 },
        //     jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        // };
        
        // return html2pdf().set(opt).from(element).save();
        
        console.log('PDF conversion would happen here with html2pdf.js library');
        return htmlContent;
    } catch (error) {
        console.error('Error converting HTML to PDF:', error);
        throw error;
    }
};
