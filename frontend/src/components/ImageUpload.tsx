import React, { useState, useImperativeHandle, forwardRef } from 'react';
import axios from 'axios';
import '../styles/ImageUpload.css';

interface ImageUploadProps {
  onImagesUploaded: (urls: string[]) => void;
  maxImages?: number;
  folder?: string;
  title?: string;
}

export interface ImageUploadRef {
  uploadImages: () => Promise<string[]>;
  hasSelectedFiles: () => boolean;
  hasUploadedImages: () => boolean;
}

export const ImageUpload = forwardRef<ImageUploadRef, ImageUploadProps>(({
  onImagesUploaded,
  maxImages = 5,
  folder = 'playspot',
  title,
}, ref) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    uploadImages: async () => {
      if (uploadedUrls.length > 0) {
        return uploadedUrls; // Already uploaded
      }
      if (selectedFiles.length === 0) {
        throw new Error('No images selected');
      }
      return await uploadImages();
    },
    hasSelectedFiles: () => selectedFiles.length > 0,
    hasUploadedImages: () => uploadedUrls.length > 0,
  }));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + selectedFiles.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images`);
      return;
    }

    // Validate file types
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Create preview URLs
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...previews]);
    setError('');
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };  const uploadImages = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) {
      throw new Error('Please select at least one image');
    }

    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      selectedFiles.forEach(file => {
        formData.append('images', file);
      });
      formData.append('folder', folder);

      const response = await axios.post(
        'http://localhost:8081/api/upload/images',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const { urls, errors } = response.data;
      
      if (errors && errors.length > 0) {
        setError(`Some images failed to upload: ${errors.join(', ')}`);
      }

      setUploadedUrls(urls);
      onImagesUploaded(urls);
      
      // Clear selected files and previews
      setSelectedFiles([]);
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      
      return urls;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to upload images';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="image-upload">
      {title && <div className="image-upload-title">{title}</div>}
      
      <div className={title ? "image-upload-container" : ""}>
        <div className="upload-section">
          <label htmlFor="image-input" className="upload-label">
            <input
              id="image-input"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading || selectedFiles.length >= maxImages}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => document.getElementById('image-input')?.click()}
              disabled={uploading || selectedFiles.length >= maxImages}
              className="select-images-btn"
            >
              Select Images ({selectedFiles.length}/{maxImages})
            </button>
          </label>
        </div>

        {error && <div className="error-message">{error}</div>}

        {uploading && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#d1ecf1', 
            border: '1px solid #bee5eb', 
            borderRadius: '4px',
            marginTop: '10px',
            textAlign: 'center'
          }}>
            Uploading images...
          </div>
        )}        {/* Preview selected images */}
        {previewUrls.length > 0 && (
          <div className="preview-grid">
            <h4>Selected Images:</h4>
            <div className="image-grid">
              {previewUrls.map((url, index) => (
                <div key={index} className="image-preview">
                  <img src={url} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="remove-btn"
                    disabled={uploading}
                  >
                    ×
                  </button>
                  {index === 0 && <span className="primary-badge">Primary</span>}
                </div>
              ))}
            </div>
          </div>
        )}        {/* Display uploaded images */}
        {uploadedUrls.length > 0 && (
          <div className="uploaded-section">
            <h4>✓ Uploaded Images (Ready to Submit):</h4>
            <p style={{ color: '#155724', backgroundColor: '#d4edda', padding: '8px', borderRadius: '4px', fontSize: '14px' }}>
              These images have been uploaded successfully and will be included when you submit the form
            </p>
            <div className="image-grid">
              {uploadedUrls.map((url, index) => (
                <div key={index} className="image-preview">
                  <img src={url} alt={`Uploaded ${index + 1}`} />
                  {index === 0 && <span className="primary-badge">Primary</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
