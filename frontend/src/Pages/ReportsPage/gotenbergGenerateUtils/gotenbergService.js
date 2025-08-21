import { getPresignedGotenbergBucketUrl } from "../../../graphql/graphqlHelpers";

export const getHtmlKey = (userInfo, selectedTemplate) => {
  return `html/${userInfo.username}${selectedTemplate.template_id}.html`;
}

export const getPdfKey = (userInfo, selectedTemplate) => {
  return `pdf/${userInfo.username}${selectedTemplate.template_id}.pdf`;
}

export const getDocxKey = (userInfo, selectedTemplate) => {
  return `docx/${userInfo.username}${selectedTemplate.template_id}.docx`;
}

// Check if PDF is complete by checking tags on the HTML file
export const checkPdfComplete = async (userInfo, selectedTemplate) => {
  try {
    const htmlKey = getHtmlKey(userInfo, selectedTemplate);
    console.log('Checking PDF completion via HTML file tags for key:', htmlKey);

    const tags = await getPresignedGotenbergBucketUrl(htmlKey, 'GET_TAGS');
    console.log('HTML file tags response for PDF status:', tags);

    if (!tags) {
      console.log('No HTML tags response - PDF likely not ready');
      return false;
    }

    console.log('JSON parse failed, using string matching');
    const isComplete = tags.includes('isPdfComplete') && tags.includes('Value=true');
    console.log('PDF complete status from string matching:', isComplete);
    return isComplete;

  } catch (error) {
    console.log('PDF not ready yet or error checking HTML tags:', error);
    return false;
  }
};

// Helper function to check if PDF tags contain isPdfComplete = true
export const doesPdfTagExist = async (userInfo, selectedTemplate) => {
  const htmlKey = getHtmlKey(userInfo, selectedTemplate);
  const tags = await getPresignedGotenbergBucketUrl(htmlKey, 'GET_TAGS');
  if (!tags) {
    console.log('No tags provided for PDF check');
    return false;
  }

  return tags.includes('isPdfComplete')
};

// Helper function to check if DOCX tags contain isDocxComplete = true  
export const doesDocxTagExist = async (userInfo, selectedTemplate) => {
  const pdfKey = getPdfKey(userInfo, selectedTemplate);
  const tags = await getPresignedGotenbergBucketUrl(pdfKey, 'GET_TAGS');
  if (!tags) {
    console.log('No tags provided for DOCX check');
    return false;
  }

  return tags.includes('isDocxComplete')
};

// Check if DOCX is complete by checking tags on the PDF file
export const checkDocxComplete = async (userInfo, selectedTemplate) => {
  try {
    const pdfKey = getPdfKey(userInfo, selectedTemplate);
    console.log('Checking DOCX completion via PDF file tags for key:', pdfKey);

    const tags = await getPresignedGotenbergBucketUrl(pdfKey, 'GET_TAGS');
    console.log('PDF file tags response for DOCX status:', tags);

    if (!tags) {
      console.log('No PDF tags response - DOCX likely not ready');
      return false;
    }

    console.log('JSON parse failed, using string matching for DOCX');
    const isComplete = tags.includes('isDocxComplete') && tags.includes('Value=true');
    console.log('DOCX complete status from string matching:', isComplete);
    return isComplete;

  } catch (error) {
    console.log('DOCX not ready yet or error checking PDF tags:', error);
    return false;
  }
};

// Get PDF download URL if ready
export const getPdfDownloadUrl = async (userInfo, selectedTemplate) => {
  try {
    const isReady = await checkPdfComplete(userInfo, selectedTemplate);
    if (isReady) {
      const pdfKey = getPdfKey(userInfo, selectedTemplate);
      console.log('Getting PDF download URL for key:', pdfKey);

      const url = await getPresignedGotenbergBucketUrl(pdfKey, 'GET');
      console.log('PDF download URL received:', url ? 'URL obtained' : 'No URL');
      return url;
    }
    return null;
  } catch (error) {
    console.error('Error getting PDF download URL:', error);
    return null;
  }
};

// Get DOCX download URL if ready
export const getDocxDownloadUrl = async (userInfo, selectedTemplate) => {
  try {
    const isReady = await checkDocxComplete(userInfo, selectedTemplate);
    if (isReady) {
      const docxKey = getDocxKey(userInfo, selectedTemplate);
      console.log('Getting DOCX download URL for key:', docxKey);

      const url = await getPresignedGotenbergBucketUrl(docxKey, 'GET');
      console.log('DOCX download URL received:', url ? 'URL obtained' : 'No URL');
      return url;
    }
    return null;
  } catch (error) {
    console.error('Error getting DOCX download URL:', error);
    return null;
  }
};

// Poll for PDF first, then DOCX once PDF is ready
// Returns a cancel function
export const pollForCompletion = (
  userInfo,
  selectedTemplate,
  onPdfReady,
  onDocxReady,
  onProgress,
  onComplete,
  maxAttempts = 60
) => {
  let cancel = false;
  let attempts = 0;
  let pdfReady = false;
  let docxReady = false;
  let timeoutId = null;

  // token prevents older pollers from continuing after a new one starts
  const token = Symbol();

  const scheduleNext = () => {
    if (cancel) return;                  // ✅ re-check just before scheduling
    timeoutId = setTimeout(poll, 2000, token);
  };

  const poll = async (tkn) => {
    // if this iteration belongs to an obsolete poller, stop
    if (tkn !== token) return;

    if (cancel) return;

    attempts++;
    console.log(`Polling attempt ${attempts}/${maxAttempts}`);

    try {
      if (!pdfReady) {
        pdfReady = await checkPdfComplete(userInfo, selectedTemplate);
        if (cancel || tkn !== token) return;  // ✅ mid-await cancellation guard

        if (pdfReady) {
          const pdfUrl = await getPdfDownloadUrl(userInfo, selectedTemplate);
          if (cancel || tkn !== token) return;
          if (pdfUrl) {
            onPdfReady(pdfUrl);
            onProgress?.('PDF ready, starting DOCX conversion...');
          }
        } else {
          onProgress?.(`Generating PDF... (${attempts}/${maxAttempts})`);
        }
      }

      if (pdfReady && !docxReady) {
        docxReady = await checkDocxComplete(userInfo, selectedTemplate);
        if (cancel || tkn !== token) return;

        if (docxReady) {
          const docxUrl = await getDocxDownloadUrl(userInfo, selectedTemplate);
          if (cancel || tkn !== token) return;
          if (docxUrl) {
            onDocxReady(docxUrl);
            onProgress?.('Both PDF and DOCX are ready');
          }
        } else {
          onProgress?.(`PDF ready, generating DOCX... (${attempts}/${maxAttempts})`);
        }
      }

      // stop conditions
      if ((pdfReady && docxReady) || attempts >= maxAttempts) {
        cancel = true;                    // ✅ freeze further scheduling
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (pdfReady && docxReady) {
          onProgress?.('Both files ready');
          onComplete?.(true);
        } else {
          if (pdfReady && !docxReady) {
            onProgress?.('PDF ready, DOCX timeout - may still be processing');
          } else {
            onProgress?.('PDF timeout - may still be processing');
          }
          onComplete?.(false);
        }
        return;
      }

      // schedule next tick (after all awaits + checks)
      scheduleNext();
    } catch (err) {
      // On error, stop and surface failure
      cancel = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      console.error('Polling error:', err);
      onComplete?.(false);
    }
  };

  // kick off
  scheduleNext(); // start via the same scheduler path

  // cancel function
  return () => {
    if (cancel) return;
    cancel = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    console.log('Polling cancelled');
  };
};



export const convertHtmlToPdf = async (htmlContent, options = {}, userInfo, selectedTemplate) => {
  console.log('Starting HTML to PDF conversion...');
  console.log('PDF Key:', getPdfKey(userInfo, selectedTemplate));
  console.log('HTML Key:', getHtmlKey(userInfo, selectedTemplate));

  try {
    // Step 1: Upload HTML to S3 (this will trigger the Lambda via S3 event)
    const htmlKey = getHtmlKey(userInfo, selectedTemplate);
    console.log('Getting upload URL for HTML key:', htmlKey);

    const htmlUploadUrl = await getPresignedGotenbergBucketUrl(htmlKey, 'PUT');

    if (!htmlUploadUrl) {
      throw new Error('Failed to get presigned URL for HTML upload');
    }

    console.log('Got HTML upload URL, uploading content...');

    // Upload HTML file to S3
    const htmlUploadResponse = await fetch(htmlUploadUrl, {
      method: 'PUT',
      body: htmlContent,
      headers: {
        'Content-Type': 'text/html',
      },
    });

    if (!htmlUploadResponse.ok) {
      throw new Error(`Failed to upload HTML to S3: ${htmlUploadResponse.statusText}`);
    }

    console.log('HTML uploaded successfully to S3');
    console.log('S3 trigger should start the conversion process automatically');

    // Return success - the S3 trigger will handle starting the conversion
    return {
      status: 'PROCESSING',
      message: 'HTML uploaded, conversion will start automatically via S3 trigger...'
    };
  } catch (error) {
    console.error('Error uploading HTML to S3:', error);
    throw error;
  }
};

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
