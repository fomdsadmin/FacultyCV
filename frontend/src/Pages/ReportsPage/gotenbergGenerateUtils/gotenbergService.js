import { getPresignedGotenbergBucketUrl } from "../../../graphql/graphqlHelpers";
import { subscribeToGotenbergStatus } from "../../../graphql/graphqlHelpers";

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

// Replace pollForCompletion with subscription-based approach
// Returns a cancel function
export const subscribeToCompletion = (
  userInfo,
  selectedTemplate,
  onPdfReady,
  onDocxReady,
  onProgress,
  onComplete
) => {
  const pdfKey = getPdfKey(userInfo, selectedTemplate);
  const docxKey = getDocxKey(userInfo, selectedTemplate);
  
  console.log('🔔 Setting up subscriptions for:');
  console.log('📄 PDF Key:', pdfKey);
  console.log('📝 DOCX Key:', docxKey);
  
  let pdfReady = false;
  let docxReady = false;
  let pdfSubscription = null;
  let docxSubscription = null;

  const checkCompletion = () => {
    if (pdfReady && docxReady) {
      onProgress?.('Both files ready');
      onComplete?.(true);
      // Clean up subscriptions
      pdfSubscription?.unsubscribe();
      docxSubscription?.unsubscribe();
    }
  };

  // Subscribe to PDF generation updates
  onProgress?.('Waiting for PDF generation...');
  console.log('🔔 Creating PDF subscription...');
  pdfSubscription = subscribeToGotenbergStatus(
    pdfKey,
    async (data) => {
      console.log('✅ PDF generation complete:', data);
      pdfReady = true;
      
      // Get the download URL
      const pdfUrl = await getPdfDownloadUrl(userInfo, selectedTemplate);
      if (pdfUrl) {
        onPdfReady(pdfUrl);
        onProgress?.('PDF ready, waiting for DOCX...');
      }
      
      checkCompletion();
    },
    (error) => {
      console.error('❌ PDF subscription error:', error);
      onComplete?.(false);
    }
  );

  // Subscribe to DOCX generation updates
  console.log('🔔 Creating DOCX subscription...');
  docxSubscription = subscribeToGotenbergStatus(
    docxKey,
    async (data) => {
      console.log('✅ DOCX generation complete:', data);
      docxReady = true;
      
      // Get the download URL
      const docxUrl = await getDocxDownloadUrl(userInfo, selectedTemplate);
      if (docxUrl) {
        onDocxReady(docxUrl);
        onProgress?.('DOCX ready, waiting for PDF...');
      }
      
      checkCompletion();
    },
    (error) => {
      console.error('❌ DOCX subscription error:', error);
      onComplete?.(false);
    }
  );

  console.log('🔔 Subscriptions created:', {
    pdfSubscription: !!pdfSubscription,
    docxSubscription: !!docxSubscription
  });

  // Return cancel function
  return () => {
    console.log('🛑 Cancelling subscriptions');
    pdfSubscription?.unsubscribe();
    docxSubscription?.unsubscribe();
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
