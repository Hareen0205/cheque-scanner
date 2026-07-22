import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface Props {
  onImageSelect: (imageSrc: string, file: File) => void;
  onBatchSelect?: (files: File[]) => void;
  multiple?: boolean;
}

export const ImageUploader: React.FC<Props> = ({ onImageSelect, onBatchSelect, multiple = false }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (multiple && onBatchSelect) {
      // Batch mode: send all files
      onBatchSelect(acceptedFiles);
    } else {
      // Single mode: just first file
      const file = acceptedFiles[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        alert('Image is large. Processing may take longer.');
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) onImageSelect(result, file);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelect, onBatchSelect, multiple]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.tiff', '.bmp', '.webp'] },
    multiple: true, // Always allow multiple
    maxSize: 10 * 1024 * 1024
  });

  return (
    <div {...getRootProps()} style={{
      border: `2px dashed ${isDragActive ? '#667eea' : '#e0e0e0'}`,
      borderRadius: 16, padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
      background: isDragActive ? 'rgba(102,126,234,0.05)' : '#f8f9fa',
      transition: 'all 0.3s', touchAction: 'manipulation'
    }}>
      <input {...getInputProps()} />
      <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
        {multiple ? 'Upload Cheque Book' : 'Upload Image'}
      </div>
      <div style={{ fontSize: 13, color: '#666' }}>
        {isDragActive 
          ? 'Drop the images here' 
          : multiple 
            ? 'Select ALL cheque images at once' 
            : 'Tap to select from gallery'
        }
      </div>
      <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
        JPG, PNG, TIFF • Max 10MB each
      </div>
      {multiple && (
        <div style={{ marginTop: 8, padding: '6px 12px', background: '#e8f5e9', color: '#2e7d32', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
          💡 Tip: Select multiple files by holding Ctrl/Cmd
        </div>
      )}
    </div>
  );
};
