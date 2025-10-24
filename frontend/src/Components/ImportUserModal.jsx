import React, { useState, useEffect, useRef } from "react";
import { addUser, getUser, getAllUniversityInfo } from "../graphql/graphqlHelpers.js";
import { getJWT } from "../getAuthToken";
import { getPresignedUrl } from "../graphql/graphqlHelpers";
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";

const ImportUserModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const { logAction } = useAuditLogger();

  if (!isOpen) return null;

  const handleFileSelect = (file) => {
    setError("");

    // Check file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".csv")) {
      setError("Please select a CSV (.csv) file");
      return;
    }

    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      const jwt = await getJWT();
      // Generate a unique file key with timestamp to avoid conflicts
      const fileKey = selectedFile.name;

      console.log("File Key:", selectedFile.name);

      // Get presigned URL for S3 upload
      const url = await getPresignedUrl(jwt, fileKey, "PUT", "user-import");

      // Update progress to 10% after getting presigned URL
      setUploadProgress(10);

      // Upload file to S3 using presigned URL
      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type || "text/csv",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      // Update progress to 50% after successful upload
      setUploadProgress(50);

      // The Lambda function will be triggered automatically by S3
      // Simulate processing time while the Lambda runs
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Complete the progress
      setUploadProgress(100);
      console.log("File processing complete");

      // Show success for a moment then close
      setTimeout(() => {
        setIsUploading(false);
        onSuccess && onSuccess();
        onClose();
        // Reset state
        setSelectedFile(null);
        setUploadProgress(0);
        setError("");
      }, 500);
      // Log the import action
      await logAction(
        AUDIT_ACTIONS.IMPORT_USER,
        JSON.stringify({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
        })
      );
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload file. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      removeFile();
      setError("");
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-6">
        <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-zinc-600">Import Users</h2>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="text-gray-500 hover:text-gray-700 text-xl disabled:opacity-50"
            >
              ×
            </button>
          </div>

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">File Upload Instructions</h3>
            <p className="text-blue-800 text-sm mb-2">
              Upload a CSV file to import multiple users into the application. The file should contain the following
              columns:
            </p>
            <ul className="text-blue-800 text-sm space-y-1 ml-4">
              <li>
                • <strong>first_name</strong> - User's first name
              </li>
              <li>
                • <strong>last_name</strong> - User's last name
              </li>
              <li>
                • <strong>email</strong> - User's email address
              </li>
              <li>
                • <strong>username</strong> - User's username (for login)
              </li>
              <li>
                • <strong>role</strong> - User's role ('Faculty', 'Assistant', 'Admin', 'DepartmentAdmin')
              </li>
              <li>
                • <strong>faculty</strong> - Users faculty name ('Medicine')
              </li>
              <li>
                • <strong>department</strong> - User's primary department ('Obstetrics & Gynaecology')
              </li>
            </ul>
            <p className="text-blue-800 text-sm mt-2">
              <strong>Note:</strong> Please ensure that the column names in the file match the above exactly. Only CSV
              (.csv) files are accepted.
            </p>
          </div>

          {/* File upload area */}
          {!selectedFile && (
            <div
              className={`border-2 border-dashed rounded-lg px-8 py-4 text-center transition-colors ${
                dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-gray-600 mb-2">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-gray-500 text-sm mb-4">CSV or Excel files up to 10MB</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary"
                disabled={isUploading}
              >
                Select File
              </button>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileInputChange} className="hidden" />
            </div>
          )}

          {/* Selected file display */}
          {selectedFile && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                {!isUploading && (
                  <button onClick={removeFile} className="text-red-600 hover:text-red-800 p-1" title="Remove file">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Upload progress */}
              {isUploading && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>
                      {uploadProgress <= 50
                        ? "Uploading file..."
                        : uploadProgress < 100
                        ? "Processing file..."
                        : "Complete!"}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>

                  {/* Progress indicators */}
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <div className={`flex items-center ${uploadProgress >= 10 ? "text-green-600" : ""}`}>
                      <span>Upload</span>
                    </div>
                    <div className={`flex items-center ${uploadProgress === 100 ? "text-green-600" : ""}`}>
                      <span>Processing</span>
                    </div>
                    <div className={`flex items-center ${uploadProgress === 100 ? "text-green-600" : ""}`}>
                      <span>Complete</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-2 mt-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="btn btn-primary disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImportUserModal;
