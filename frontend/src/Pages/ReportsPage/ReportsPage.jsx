import React, { useState, useEffect } from 'react';
import PageContainer from '../../Views/PageContainer.jsx';
import FacultyMenu from '../../Components/FacultyMenu.jsx';
import { getAllTemplates } from '../../graphql/graphqlHelpers.js';
import '../../CustomStyles/scrollbar.css';
import { useNotification } from '../../Contexts/NotificationContext.jsx';
import TemplateList from './TemplateList.jsx';
import ReportPreview from './ReportPreview.jsx';
import { useApp } from 'Contexts/AppContext.jsx';
import { checkPdfComplete, checkDocxComplete, getPdfDownloadUrl, getDocxDownloadUrl, doesDocxTagExist, doesPdfTagExist, subscribeToCompletion } from './gotenbergGenerateUtils/gotenbergService.js';
import { useRef } from 'react';

const ReportsPage = () => {
  const { userInfo, getCognitoUser, toggleViewMode } = useApp();

  const [user, setUser] = useState(userInfo);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);

  // Download states
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadUrlDocx, setDownloadUrlDocx] = useState(null);
  const [downloadBlob, setDownloadBlob] = useState(null);
  const [downloadBlobDocx, setDownloadBlobDocx] = useState(null);

  // Generation states
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [startYear, setStartYear] = useState(null);
  const [endYear, setEndYear] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [isDocxReady, setIsDocxReady] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [docxTagExists, setDocxTagExists] = useState(false);
  const [pdfTagExists, setPdfTagExists] = useState(false);
  const cancelRef = useRef(null);

  const { setNotification } = useNotification();

  useEffect(() => {
    const helper = async () => {
      setIsGenerating(true);
      const promises = [
        checkPdfComplete(userInfo, selectedTemplate),
        checkDocxComplete(userInfo, selectedTemplate),
        doesDocxTagExist(userInfo, selectedTemplate),
        doesPdfTagExist(userInfo, selectedTemplate)
      ];

      const [
        isPdfComplete,
        isDocxComplete,
        pdfTagExists,
        docxTagExists
      ] = await Promise.all(promises);

      setDocxTagExists(docxTagExists);
      setPdfTagExists(pdfTagExists);

      if (!pdfTagExists && !docxTagExists) {
        setIsGenerating(false);
      }

      if ((!isPdfComplete && pdfTagExists) || (!isDocxComplete && docxTagExists)) {
        cancelRef.current?.();
        cancelRef.current = null;

        const cancel = subscribeToCompletion(
          userInfo,
          selectedTemplate,
          handlePdfReady,
          handleDocxReady,
          handleProgress,
          (success) => {
            handleGenerateComplete(success);
            // auto-clear cancel after completion
            cancelRef.current = null;
          }
        );

        cancelRef.current = cancel;
      }

      if (isPdfComplete) {
        setIsPdfReady(true);
        setDownloadUrl(await getPdfDownloadUrl(userInfo, selectedTemplate));
      }

      if (isDocxComplete) {
        setIsDocxReady(true);
        setDownloadUrlDocx(await getDocxDownloadUrl(userInfo, selectedTemplate));
      }

      if (isPdfComplete && isDocxComplete) {
        setIsGenerating(false);
      }
    }

    if (selectedTemplate && userInfo) {
      helper();
    }
  }, [selectedTemplate, userInfo])

  useEffect(() => {
    setUser(userInfo);
    const fetchData = async () => {
      setLoading(true);
      setUser(userInfo);
      const templates = await getAllTemplates();
      setTemplates(templates);
      setLoading(false);
    };
    fetchData();
  }, [userInfo]);

  const handleTemplateSelect = (template) => {
    clearGenerationState();
    setSelectedTemplate(template);
  };

  const clearGenerationState = () => {
    setDownloadUrl(null);
    setDownloadUrlDocx(null);
    setDownloadBlob(null);
    setDownloadBlobDocx(null);
    setIsPdfReady(false);
    setIsDocxReady(false);
    setIsGenerating(false);
    setDocxTagExists(false);
    setPdfTagExists(false);
    setProcessingMessage("");
  };

  const handleGenerateStart = (template, startYear, endYear) => {
    console.log("Generation started for template:", template.title);
    setSelectedTemplate(template);
    setStartYear(startYear);
    setEndYear(endYear);
    setIsGenerating(true);
    setIsPdfReady(false);
    setIsDocxReady(false);
    setProcessingMessage("Starting conversion...");
    // Clear previous downloads
    setDownloadUrl(null);
    setDownloadUrlDocx(null);
    setDownloadBlob(null);
    setDownloadBlobDocx(null);
  };

  const handlePdfReady = (pdfUrl) => {
    console.log("PDF ready with URL:", pdfUrl);
    setDownloadUrl(pdfUrl);
    setIsPdfReady(true);
    setDownloadBlob(null);
    setNotification({ message: "PDF Generated!" });
    setProcessingMessage("Generating DOCX");
  };

  const handleDocxReady = (docxUrl) => {
    console.log("DOCX ready with URL:", docxUrl);
    setDownloadUrlDocx(docxUrl);
    setIsDocxReady(true);
    setDownloadBlobDocx(null);
    setNotification({ message: "DOCX Generated!" });
    setIsGenerating(false);
  };

  const handleProgress = (message) => {
    setProcessingMessage(message);
  };

  const handleGenerateComplete = (success) => {
    console.log('Generation completed, success:', success);
    setIsGenerating(false); // RE-ENABLE THE GENERATE BUTTON

    if (success) {
      setProcessingMessage("Generation completed successfully");
    } else {
      setProcessingMessage("Generation completed with errors or timeout");
    }

    // Clear the processing message after a delay
    setTimeout(() => {
      setProcessingMessage("");
    }, 3000);
  };

  return (
    <PageContainer className="custom-scrollbar">
      <FacultyMenu
        userName={user.preferred_name || user.first_name}
        getCognitoUser={getCognitoUser}
        toggleViewMode={toggleViewMode}
        userInfo={userInfo}
      />
      <main className="ml-4 overflow-auto custom-scrollbar w-full">
        <div className="w-full px-8 pt-4">
          <h1 className="text-3xl font-bold text-zinc-800 mb-2">Reports</h1>
        </div>
        <div className="flex w-full h-full px-8 pb-8">
          <TemplateList
            templates={templates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            onGenerateStart={handleGenerateStart}
            onGenerateComplete={handleGenerateComplete}
            onPdfReady={handlePdfReady}
            onDocxReady={handleDocxReady}
            onProgress={handleProgress}
            isGenerating={isGenerating}
            isPdfReady={isPdfReady}
            isDocxReady={isDocxReady}
            downloadUrl={downloadUrl}
            downloadBlob={downloadBlob}
            downloadUrlDocx={downloadUrlDocx}
            downloadBlobDocx={downloadBlobDocx}
            processingMessage={processingMessage}
            user={user}
            cancelRef={cancelRef}
            docxTagExists={docxTagExists}
            pdfTagExists={pdfTagExists}
          />

          <div className="flex-1 flex flex-col items-center bg-gray-50 rounded-lg shadow-md px-8 overflow-auto custom-scrollbar h-[90vh]">
            <ReportPreview
              loading={loading}
              selectedTemplate={selectedTemplate}
              downloadUrl={downloadUrl}
              downloadBlob={downloadBlob}
              generatingPdf={isGenerating && !isPdfReady}
            />
          </div>
        </div>
      </main>
    </PageContainer>
  );
};

export default ReportsPage;