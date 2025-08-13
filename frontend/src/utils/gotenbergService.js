
import { getGotenbergPdf } from '../graphql/graphqlHelpers.js';

export const convertHtmlToPdf = async (htmlContent, options = {}) => {
  // Fixed boundary (must match in Lambda)
  const boundary = "----WebKitFormBoundary123456";

  // Build multipart request body manually
  let bodyParts = [];
  bodyParts.push(`--${boundary}`);
  bodyParts.push(`Content-Disposition: form-data; name="files"; filename="index.html"`);
  bodyParts.push(`Content-Type: text/html`);
  bodyParts.push("");
  bodyParts.push(htmlContent);
  
  // Add optional parameters
  if (options.marginTop) {
    bodyParts.push(`--${boundary}`);
    bodyParts.push(`Content-Disposition: form-data; name="marginTop"`);
    bodyParts.push("");
    bodyParts.push(options.marginTop);
  }
  if (options.marginBottom) {
    bodyParts.push(`--${boundary}`);
    bodyParts.push(`Content-Disposition: form-data; name="marginBottom"`);
    bodyParts.push("");
    bodyParts.push(options.marginBottom);
  }
  if (options.marginLeft) {
    bodyParts.push(`--${boundary}`);
    bodyParts.push(`Content-Disposition: form-data; name="marginLeft"`);
    bodyParts.push("");
    bodyParts.push(options.marginLeft);
  }
  if (options.marginRight) {
    bodyParts.push(`--${boundary}`);
    bodyParts.push(`Content-Disposition: form-data; name="marginRight"`);
    bodyParts.push("");
    bodyParts.push(options.marginRight);
  }
  if (options.paperWidth) {
    bodyParts.push(`--${boundary}`);
    bodyParts.push(`Content-Disposition: form-data; name="paperWidth"`);
    bodyParts.push("");
    bodyParts.push(options.paperWidth);
  }
  if (options.paperHeight) {
    bodyParts.push(`--${boundary}`);
    bodyParts.push(`Content-Disposition: form-data; name="paperHeight"`);
    bodyParts.push("");
    bodyParts.push(options.paperHeight);
  }
  if (options.preferCSSPageSize !== undefined) {
    bodyParts.push(`--${boundary}`);
    bodyParts.push(`Content-Disposition: form-data; name="preferCSSPageSize"`);
    bodyParts.push("");
    bodyParts.push(options.preferCSSPageSize.toString());
  }
  if (options.printBackground !== undefined) {
    bodyParts.push(`--${boundary}`);
    bodyParts.push(`Content-Disposition: form-data; name="printBackground"`);
    bodyParts.push("");
    bodyParts.push(options.printBackground.toString());
  }
  if (options.landscape !== undefined) {
    bodyParts.push(`--${boundary}`);
    bodyParts.push(`Content-Disposition: form-data; name="landscape"`);
    bodyParts.push("");
    bodyParts.push(options.landscape.toString());
  }
  if (options.scale) {
    bodyParts.push(`--${boundary}`);
    bodyParts.push(`Content-Disposition: form-data; name="scale"`);
    bodyParts.push("");
    bodyParts.push(options.scale.toString());
  }
  
  bodyParts.push(`--${boundary}--`);
  bodyParts.push("");

  const rawBody = bodyParts.join("\r\n");
  const base64Body = btoa(unescape(encodeURIComponent(rawBody)));

  try {
    const pdfBase64 = await getGotenbergPdf(base64Body);
    
    // Convert PDF Base64 → Blob
    const pdfBlob = base64ToBlob(pdfBase64, 'application/pdf');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    return {
      blob: pdfBlob,
      url: pdfUrl
    };
  } catch (error) {
    console.error('Error converting HTML to PDF via Lambda:', error);
    throw error;
  }
};

function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: mimeType });
}

export const defaultPdfOptions = {
  marginTop: '0.5in',
  marginBottom: '0.5in', 
  marginLeft: '0.5in',
  marginRight: '0.5in',
  paperWidth: '8.5in',
  paperHeight: '11in',
  preferCSSPageSize: false,
  printBackground: true,
  landscape: false,
  scale: 1.0
};
