import { useApp } from "Contexts/AppContext";
import { useState, useEffect } from "react";
import {
    checkPdfComplete,
    checkDocxComplete,
    doesDocxTagExist,
    doesPdfTagExist,
    checkDocxHasError,
    checkPdfHasError,
} from "../gotenbergGenerateUtils/gotenbergService";
import { addSubscription } from "../gotenbergGenerateUtils/gotenbergService";
import { getPdfKey, getDocxKey, getGenericKey, getPdfDownloadUrl, getDocxDownloadUrl, convertHtmlToPdf } from "../gotenbergGenerateUtils/gotenbergService";
import GenerateButton from "./GenerateButton";
import DownloadDocxButton from "./DownloadDocxButton";
import DownloadPdfButton from "./DownloadPdfButton";
import { useNotification } from "Contexts/NotificationContext";
import { useRef } from "react";

// onGenerate must return the html content
const CVGenerationComponent = ({
    getHtml,
    optionalKey,
    selectedTemplate,
    setPdfPreviewUrl,
    pdfGenerationCompleteMessage,
    docxGenerationCompleteMessage
}) => {

    const { userInfo: user, managedUser } = useApp();

    const userInfo = managedUser || user;
    const { setNotification } = useNotification();
    const [pdfExists, setPdfExists] = useState(false);
    const [docxExists, setDocxExists] = useState(false);
    const [pdfComplete, setPdfComplete] = useState(false);
    const [docxComplete, setDocxComplete] = useState(false);
    const [docxHasError, setDocxHasError] = useState(false);
    const [pdfHasError, setPdfHasError] = useState(false);

    const [pdfUrl, setPdfUrl] = useState(null);
    const [docxUrl, setDocxUrl] = useState(null);

    const [generating, setGenerating] = useState(false);

    const currentTemplateRef = useRef();

    useEffect(() => {
        currentTemplateRef.current = selectedTemplate;
    }, [selectedTemplate]);


    const onPdfComplete = async (backendKey) => {

        const currentKey = getGenericKey(userInfo, currentTemplateRef.current, optionalKey);

        console.log("JJFILTER KEYS: ", backendKey, getPdfKey(currentKey))

        const doesPdfHaveError = await checkPdfHasError(backendKey.replace("pdf/", "").replace(".pdf", ""));

        if (doesPdfHaveError) {
            setNotification({ message: "Error generating PDF and DOCX", type: "error" });
        }

        if (backendKey === getPdfKey(currentKey)) {

            if (doesPdfHaveError) {
                setPdfExists(false);
                setPdfComplete(true);
                setPdfHasError(true);

                // Docx needs pdf to generate, so if pdf has error, then docx has an error too
                setDocxHasError(true);
                return;
            }

            const pdfUrl = await getPdfDownloadUrl(currentKey);
            setPdfUrl(pdfUrl);
            setPdfPreviewUrl?.(pdfUrl);
            setPdfExists(true);
            setPdfComplete(true);
        }

        setNotification({ message: pdfGenerationCompleteMessage });

    }

    const onDocxComplete = async (backendKey) => {

        const currentKey = getGenericKey(userInfo, currentTemplateRef.current, optionalKey);

        const docxHaveError = await checkDocxHasError(backendKey.replace("docx/", "").replace(".docx", ""));

        if (docxHaveError) {
            setNotification({ message: "Error generating DOCX", type: "error" });
        }

        if (backendKey === getDocxKey(currentKey)) {

            if (docxHaveError) {
                setDocxExists(false);
                setDocxComplete(true);
                setDocxHasError(true);
                return;
            }

            setDocxUrl(await getDocxDownloadUrl(currentKey));
            setDocxExists(true);
            setDocxComplete(true);
        }

        setNotification({ message: docxGenerationCompleteMessage });

    }

    const onGenerate = async () => {
        setGenerating(true);

        // get key earlier in case user switches templates thus changing the key
        const key = getGenericKey(userInfo, currentTemplateRef.current, optionalKey);

        setPdfPreviewUrl?.(null);
        setPdfComplete(false);
        setDocxComplete(false);
        setPdfHasError(false);
        setDocxHasError(false);

        const html = await getHtml();

        const onUploadSuccessful = () => {
            setNotification({ message: "CV Template Uploaded Successfully!" });
        }

        await convertHtmlToPdf(html, {}, key, onUploadSuccessful);
    }

    const onGenerationError = () => {

    }

    const resetStates = () => {
        setPdfExists(false);
        setDocxExists(false);
        setPdfComplete(false);
        setDocxComplete(false);

        setPdfUrl(null);
        setDocxUrl(null);
        setPdfPreviewUrl?.(null);

        setGenerating(true);
    }

    useEffect(() => {
        if (pdfComplete && docxComplete) {
            setGenerating(false);
        }
    }, [pdfComplete, docxComplete])

    useEffect(() => {
        const setDocumentStates = async () => {
            const key = getGenericKey(userInfo, currentTemplateRef.current, optionalKey);
            const promises = [
                checkPdfComplete(key),
                checkDocxComplete(key),
                doesDocxTagExist(key),
                doesPdfTagExist(key),
                checkDocxHasError(key),
                checkPdfHasError(key)
            ];

            const [
                pdfComplete,
                docxComplete,
                docxTagExists,
                pdfTagExists,
                docxHasError,
                pdfHasError
            ] = await Promise.all(promises);

            setPdfExists(pdfTagExists);
            setDocxExists(docxTagExists);
            setDocxHasError(docxHasError || pdfHasError);
            setPdfHasError(pdfHasError);

            if (pdfComplete && !pdfHasError) {
                const pdfUrl = await getPdfDownloadUrl(key);
                setPdfUrl(pdfUrl);
                setPdfPreviewUrl(pdfUrl);
                setPdfComplete(pdfComplete);
            }

            if (docxComplete && !docxHasError) {
                setDocxUrl(await getDocxDownloadUrl(key));
                setDocxComplete(docxComplete)
            }
            setGenerating(false);
        }

        resetStates();
        setDocumentStates();
    }, [selectedTemplate, userInfo]);

    useEffect(() => {
        if (
            ((generating && !pdfExists && !pdfComplete) ||
                (pdfExists && !pdfComplete)) &&
            !pdfHasError
        ) {
            setGenerating(true);
            addSubscription(getPdfKey(getGenericKey(userInfo, currentTemplateRef.current, optionalKey)), onPdfComplete, onGenerationError);
        }
    }, [generating, pdfExists, pdfComplete])

    useEffect(() => {
        if (((generating && !docxExists && !docxComplete) ||
            (docxExists && !docxComplete)) &&
            !docxHasError
        ) {
            setGenerating(true);
            addSubscription(getDocxKey(getGenericKey(userInfo, currentTemplateRef.current, optionalKey)), onDocxComplete, onGenerationError);
        }
    }, [generating, docxExists, docxComplete])


    return (
        <div className="cv-generation-component space-y-4">
            {/* Generate Button */}
            <GenerateButton
                generating={generating}
                pdfComplete={pdfComplete}
                docxComplete={docxComplete}
                pdfHasError={pdfHasError}
                docxHasError={docxHasError}
                onGenerate={onGenerate}
            />

            {/* Download Buttons */}
            <div className="space-y-2">
                <DownloadPdfButton
                    pdfUrl={pdfUrl}
                    pdfComplete={pdfComplete}
                    generating={generating}
                    pdfHasError={pdfHasError}
                    downloadName={`${selectedTemplate?.title || 'cv'}${optionalKey}.pdf`}
                />

                <DownloadDocxButton
                    docxUrl={docxUrl}
                    docxComplete={docxComplete}
                    generating={generating}
                    docxHasError={docxHasError}
                    downloadName={`${selectedTemplate?.title || 'cv'}${optionalKey}.docx`}
                />
            </div>
        </div>
    );

}

export default CVGenerationComponent