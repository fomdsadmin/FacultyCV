import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

const RichTextEditor = forwardRef(({ value, onChange, rows = 10, name }, ref) => {
  const [editorValue, setEditorValue] = useState('');
  const [editorHeight, setEditorHeight] = useState(80);
  const quillRef = useRef(null);

  // Initialize editor value only once
  useEffect(() => {
    setEditorValue(value || '');
  }, [value]);

  // Update height when content changes
  useEffect(() => {
    const newHeight = calculateHeight();
    setEditorHeight(newHeight);
  }, [editorValue]);

  // Simple change handler - only update local state
  const handleChange = (content) => {
    setEditorValue(content);
  };

  // Calculate dynamic height based on content (max 10 rows)
  const calculateHeight = () => {
    // Count actual lines in the content including HTML breaks
    const htmlContent = editorValue || '';
    const textContent = htmlContent.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const lineCount = Math.max(
      textContent.split('\n').length,
      Math.ceil(textContent.length / 80), // Approximate lines based on character count
      2 // minimum 2 lines
    );
    
    const minHeight = 80;
    const maxHeight = 250;
    const calculatedHeight = Math.min(maxHeight, Math.max(minHeight, lineCount * 25));
    return calculatedHeight;
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'blockquote'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline',
    'list', 'bullet', 'link', 'blockquote'
  ];

  const dynamicHeight = calculateHeight();
  const editorStyle = {
    minHeight: `${editorHeight}px`,
    marginBottom: '42px'
  };

  // Expose methods for parent components to access on save
  useImperativeHandle(ref, () => ({
    getValue: () => editorValue,
    getHtmlValue: () => editorValue // Direct HTML access
  }), [editorValue]);

  return (
    <div className="rich-text-editor" style={{ minHeight: `${editorHeight + 50}px` }}>
      <ReactQuill
        ref={quillRef}
        value={editorValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        style={editorStyle}
        theme="snow"
        placeholder="Enter your content here..."
      />
    </div>
  );
});

export default RichTextEditor;