import React from "react";
import { FaTimes, FaCalendarAlt, FaUser, FaFileAlt } from "react-icons/fa";

const DeclarationViewModal = ({ isOpen, onClose, declaration, user, year }) => {
  if (!isOpen || !declaration || !user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (value) => {
    if (!value) return <span className="text-gray-500">Not specified</span>;
    
    const isYes = value.toUpperCase() === "YES";
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        isYes ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isYes ? "Yes" : "No"}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-100 text-black p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FaFileAlt className="text-xl" />
            <div>
              <h2 className="text-xl font-bold">Declaration Details</h2>
              <p className="text-black">
                {user.first_name} {user.last_name} • {year}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FaUser className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Faculty Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Name:</span>
                <span className="ml-2">{user.first_name} {user.last_name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <span className="ml-2">{user.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Department:</span>
                <span className="ml-2">{user.primary_department}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Submitted:</span>
                <span className="ml-2">{formatDate(declaration.created_on)}</span>
              </div>
            </div>
          </div>

          {/* Declaration Sections */}
          <div className="space-y-6">
            {/* Conflict of Interest */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Conflict of Interest & Commitment</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Declaration Status:</span>
                  {getStatusBadge(declaration.coi)}
                </div>
                {declaration.coiSubmissionDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Submission Date:</span>
                    <span className="text-gray-900">{formatDate(declaration.coiSubmissionDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Faculty of Medicine Merit */}
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Faculty of Medicine Merit</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Wishes to be considered:</span>
                  {getStatusBadge(declaration.fomMerit)}
                </div>
                {declaration.meritJustification && (
                  <div>
                    <span className="text-gray-700 font-medium">Justification:</span>
                    <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded">{declaration.meritJustification}</p>
                  </div>
                )}
              </div>
            </div>

            {/* PSA Awards */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">PSA Awards</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Wishes to be considered:</span>
                  {getStatusBadge(declaration.psa)}
                </div>
                {declaration.psaSubmissionDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Submission Date:</span>
                    <span className="text-gray-900">{formatDate(declaration.psaSubmissionDate)}</span>
                  </div>
                )}
                {declaration.psaJustification && (
                  <div>
                    <span className="text-gray-700 font-medium">Justification:</span>
                    <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded">{declaration.psaJustification}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Promotion */}
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Promotion Review</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Wishes to be considered:</span>
                  {getStatusBadge(declaration.promotion)}
                </div>
                {declaration.promotionSubmissionDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Submission Date:</span>
                    <span className="text-gray-900">{formatDate(declaration.promotionSubmissionDate)}</span>
                  </div>
                )}
                {declaration.promotionEffectiveDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Effective Date:</span>
                    <span className="text-gray-900">{formatDate(declaration.promotionEffectiveDate)}</span>
                  </div>
                )}
                {declaration.promotionPathways && (
                  <div>
                    <span className="text-gray-700 font-medium">Pathways:</span>
                    <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded">{declaration.promotionPathways}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Honorific Impact Report */}
            {declaration.honorific && (
              <div className="border-l-4 border-indigo-500 pl-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Honorific Impact Report</h4>
                <p className="text-gray-900 bg-gray-50 p-3 rounded">{declaration.honorific}</p>
              </div>
            )}

            {/* Support Anticipated */}
            {declaration.supportAnticipated && (
              <div className="border-l-4 border-teal-500 pl-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Support Anticipated</h4>
                <p className="text-gray-900 bg-gray-50 p-3 rounded">{declaration.supportAnticipated}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeclarationViewModal;