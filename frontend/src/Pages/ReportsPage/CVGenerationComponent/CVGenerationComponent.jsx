import { useApp } from "Contexts/AppContext";
import { useState, useEffect } from "react";
import {
    checkPdfComplete,
    checkDocxComplete,
    doesDocxTagExist,
    doesPdfTagExist,
} from "../gotenbergGenerateUtils/gotenbergService";
import { addSubscription } from "../gotenbergGenerateUtils/gotenbergService";
import { getPdfKey, getDocxKey, getGenericKey, getPdfDownloadUrl, getDocxDownloadUrl, convertHtmlToPdf } from "../gotenbergGenerateUtils/gotenbergService";
import GenerateButton from "./GenerateButton";
import DownloadDocxButton from "./DownloadDocxButton";
import DownloadPdfButton from "./DownloadPdfButton";
import { useNotification } from "Contexts/NotificationContext";

// onGenerate must return the html content
const CVGenerationComponent = ({
    getHtml,
    optionalKey,
    selectedTemplate,
    setPdfPreviewUrl,
    pdfGenerationCompleteMessage,
    docxGenerationCompleteMessage
}) => {

    const { userInfo } = useApp();
    const { setNotification } = useNotification();
    const [pdfExists, setPdfExists] = useState(false);
    const [docxExists, setDocxExists] = useState(false);
    const [pdfComplete, setPdfComplete] = useState(false);
    const [docxComplete, setDocxComplete] = useState(false);

    const [pdfUrl, setPdfUrl] = useState(null);
    const [docxUrl, setDocxUrl] = useState(null);

    const [generating, setGenerating] = useState(false);

    const getKey = () => {
        return getGenericKey(userInfo, selectedTemplate, optionalKey);
    }

    const onPdfComplete = async (backendKey) => {
        if (backendKey === getPdfKey(getKey())) {
            const pdfUrl = await getPdfDownloadUrl(getKey())
            setPdfUrl(pdfUrl);
            setPdfPreviewUrl?.(pdfUrl)
        }
        setPdfExists(true);
        setPdfComplete(true);
        setNotification({ message: pdfGenerationCompleteMessage });
    }

    const onDocxComplete = async (backendKey) => {

        if (backendKey === getDocxKey(getKey())) {
            setDocxUrl(await getDocxDownloadUrl(getKey()));
        }
        setDocxExists(true);
        setDocxComplete(true);
        setNotification({ message: docxGenerationCompleteMessage });
    }

    const onGenerate = async () => {
        setGenerating(true);

        setPdfPreviewUrl?.(null);
        setPdfComplete(false);
        setDocxComplete(false);

        const html = await getHtml();
        await convertHtmlToPdf(html, {}, getKey());
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

        setGenerating(false);
    }

    useEffect(() => {
        if (pdfComplete && docxComplete) {
            setGenerating(false);
        }
    }, [pdfComplete, docxComplete])

    useEffect(() => {
        const setDocumentStates = async () => {
            const promises = [
                checkPdfComplete(getKey()),
                checkDocxComplete(getKey()),
                doesDocxTagExist(getKey()),
                doesPdfTagExist(getKey())
            ];

            const [
                pdfComplete,
                docxComplete,
                docxTagExists,
                pdfTagExists
            ] = await Promise.all(promises);

            setPdfExists(pdfTagExists);
            setDocxExists(docxTagExists);

            if (pdfComplete) {
                const pdfUrl = await getPdfDownloadUrl(getKey());
                setPdfUrl(pdfUrl);
                setPdfPreviewUrl(pdfUrl);
                setPdfComplete(pdfComplete);
            }

            if (docxComplete) {
                setDocxUrl(await getPdfDownloadUrl(getKey()));
                setDocxComplete(docxComplete)
            }
        }

        resetStates();
        setDocumentStates();
    }, [selectedTemplate, userInfo]);

    useEffect(() => {
        if (
            (generating && !pdfExists && !pdfComplete) ||
            (pdfExists && !pdfComplete)
        ) {
            setGenerating(true);
            addSubscription(getPdfKey(getKey()), onPdfComplete, onGenerationError);
        }
    }, [generating, pdfExists, pdfComplete])

    useEffect(() => {
        if ((generating && !docxExists && !docxComplete) ||
            (docxExists && !docxComplete)
        ) {
            setGenerating(true);
            addSubscription(getDocxKey(getKey()), onDocxComplete, onGenerationError);
        }
    }, [generating, docxExists, docxComplete])


    return (
        <div className="cv-generation-component space-y-4">
            {/* Generate Button */}
            <GenerateButton
                generating={generating}
                pdfComplete={pdfComplete}
                docxComplete={docxComplete}
                onGenerate={onGenerate}
            />

            {/* Download Buttons */}
            <div className="space-y-2">
                <DownloadPdfButton
                    pdfUrl={pdfUrl}
                    pdfComplete={pdfComplete}
                    generating={generating}
                    downloadName={`${selectedTemplate?.title || 'cv'}${optionalKey}.pdf`}
                />

                <DownloadDocxButton
                    docxUrl={docxUrl}
                    docxComplete={docxComplete}
                    generating={generating}
                    downloadName={`${selectedTemplate?.title || 'cv'}${optionalKey}.docx`}
                />
            </div>
        </div>
    );

}

export default CVGenerationComponent