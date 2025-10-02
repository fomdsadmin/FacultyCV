import React, { useRef, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';

const TextEntry = ({ attrsObj, attributes, formData, handleChange }) => {
  if (!attrsObj) return null;
  
  // Helper function to determine if field should span 2 columns
  const shouldSpanTwoColumns = (content, fieldName) => {
    const lower = fieldName.toLowerCase();
    const charThreshold = 10;
    
    // Always span 2 columns for certain field types
    if (["title", "details", "description", "note"].some(key => lower.includes(key))) {
      return true;
    }
    
    // Span 2 columns if content exceeds threshold
    return content && content.length > charThreshold;
  };
  
  // Helper function to calculate rows needed
  const calculateRows = (content, fieldName) => {
    const lower = fieldName.toLowerCase();
    
    // Default rows for different field types
    if (["details", "description", "note"].some(key => lower.includes(key))) {
      return Math.min(7, Math.max(2, Math.ceil((content || '').length / 80)));
    }
    
    // For other fields, calculate based on content length
    if (content && content.length > 50) {
      return Math.min(7, Math.max(2, Math.ceil(content.length / 60)));
    }
    
    return 1;
  };
  
  return Object.entries(attrsObj).map(([attrName, value]) => {
    // Get the snake_case key from attributes mapping
    const snakeKey = attributes && attributes[attrName] ? attributes[attrName] : attrName;
    const lower = attrName.toLowerCase();
    const currentValue = formData[snakeKey] || '';
    const shouldSpan = shouldSpanTwoColumns(currentValue, attrName);
    const rows = calculateRows(currentValue, attrName);
    
    if (["title"].some((key) => lower.includes(key))) {
      // Title fields - always span 2 columns
      return (
        <div key={attrName} className="col-span-2">
          <label className="block text-sm font-semibold capitalize mb-1">
            {attrName}
          </label>
          <textarea
            name={snakeKey}
            value={currentValue}
            onChange={handleChange}
            rows={rows}
            className="w-full rounded text-sm px-3 py-2 border border-gray-300 resize-none"
            style={{ minHeight: '40px' }}
          />
        </div>
      );
    }
    
    if (["details", "note"].some(key => lower.includes(key))) {
      // Details/Note fields - always span 2 columns with rich text editor
      return (
        <div key={attrName} className="col-span-2 mt-1">
          <label className="block text-sm font-semibold capitalize mb-1">
            {attrName}
          </label>
          <RichTextEditor
            ref={(ref) => {
              // Store reference to get value on save
              if (ref) {
                window.richTextEditorRefs = window.richTextEditorRefs || {};
                window.richTextEditorRefs[snakeKey] = ref;
              }
            }}
            value={currentValue}
            onChange={handleChange}
            rows={rows}
            name={snakeKey}
          />
        </div>
      );
    }
  
    
    // Dynamic fields - span 1 or 2 columns based on content
    if (shouldSpan) {
      return (
        <div key={attrName} className="col-span-2">
          <label className="block text-sm capitalize mb-1 font-semibold">{attrName}</label>
          <textarea
            name={snakeKey}
            value={currentValue}
            onChange={handleChange}
            rows={rows}
            className="w-full rounded text-sm px-3 py-2 border border-gray-300 resize-none"
          />
        </div>
      );
    }
    
    // Default: single column text input
    return (
      <div key={attrName} className="">
        <label className="block text-sm capitalize mb-1 font-semibold">{attrName}</label>
        <input
          type="text"
          name={snakeKey}
          value={currentValue}
          onChange={handleChange}
          maxLength={500}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
        />
      </div>
    );
  });
};

export default TextEntry;