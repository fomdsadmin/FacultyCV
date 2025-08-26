// Example usage of the HTML builder
import { buildHtml } from './HtmlBuilder.js';

// Example function to generate HTML CV
export const generateHtmlCV = async (userInfo, template) => {
    try {
        // Call the HTML builder with user info and template
        const htmlOutput = await buildHtml(userInfo, template);
        
        // Return the generated HTML
        return htmlOutput;
    } catch (error) {
        console.error('Error generating HTML CV:', error);
        throw error;
    }
};

// Example function to download HTML as file
export const downloadHtmlCV = async (userInfo, template, filename = 'cv.html') => {
    try {
        const htmlContent = await generateHtmlCV(userInfo, template);
        
        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading HTML CV:', error);
        throw error;
    }
};

// Example function to display HTML in a new window
export const previewHtmlCV = async (userInfo, template) => {
    try {
        const htmlContent = await generateHtmlCV(userInfo, template);
        
        const newWindow = window.open('', '_blank');
        newWindow.document.write(htmlContent);
        newWindow.document.close();
    } catch (error) {
        console.error('Error previewing HTML CV:', error);
        throw error;
    }
};

// Example function to convert HTML to PDF (requires additional library like html2pdf)
export const convertHtmlToPdf = async (userInfo, template, filename = 'cv.pdf') => {
    try {
        const htmlContent = await generateHtmlCV(userInfo, template);
        
        // Note: This would require importing html2pdf.js or similar library
        // const html2pdf = (await import('html2pdf.js')).default;
        
        // const element = document.createElement('div');
        // element.innerHTML = htmlContent;
        
        // const opt = {
        //     margin: 0.2,
        //     filename: filename,
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
