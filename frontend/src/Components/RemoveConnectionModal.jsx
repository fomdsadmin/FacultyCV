import React, { useState } from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';

const RemoveConnectionModal = ({ connection, onConfirm, onCancel, isRemoving }) => {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <FaExclamationTriangle className="text-red-600 text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Remove Connection</h3>
            </div>
            <button
              onClick={onCancel}
              disabled={isRemoving}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to remove your connection with{' '}
              <span className="font-semibold text-gray-900">
                {connection.faculty_first_name} {connection.faculty_last_name}
              </span>
              ?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone. You will need to send a new invite to reconnect.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onCancel}
              disabled={isRemoving}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isRemoving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRemoving ? 'Removing...' : 'Remove Connection'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RemoveConnectionModal;
