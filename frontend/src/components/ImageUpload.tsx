import React, { useState } from 'react';
import axios from 'axios';

interface ImageUploadProps {
  onImagesUploaded: (urls: string[]) => void;
  maxImages?: number;
  folder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesUploaded,
  maxImages = 5,
  folder = 'playspot',
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

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
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image');
      return;
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload">
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

        {selectedFiles.length > 0 && (
          <button
            type="button"
            onClick={uploadImages}
            disabled={uploading}
            className="upload-btn"
          >
            {uploading ? 'Uploading...' : 'Upload Images'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Preview selected images */}
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
      )}

      {/* Display uploaded images */}
      {uploadedUrls.length > 0 && (
        <div className="uploaded-section">
          <h4>Uploaded Images:</h4>
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

      <style>{`
        .image-upload {
          width: 100%;
          margin: 20px 0;
        }

        .upload-section {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .select-images-btn,
        .upload-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
        }

        .select-images-btn {
          background-color: #007bff;
          color: white;
        }

        .select-images-btn:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .upload-btn {
          background-color: #28a745;
          color: white;
        }

        .upload-btn:hover:not(:disabled) {
          background-color: #218838;
        }

        .select-images-btn:disabled,
        .upload-btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .error-message {
          color: #dc3545;
          padding: 10px;
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .preview-grid,
        .uploaded-section {
          margin-top: 20px;
        }

        .preview-grid h4,
        .uploaded-section h4 {
          margin-bottom: 10px;
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 15px;
        }

        .image-preview {
          position: relative;
          width: 100%;
          padding-top: 100%;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .image-preview img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 50%;
          background-color: rgba(220, 53, 69, 0.9);
          color: white;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.3s;
        }

        .remove-btn:hover:not(:disabled) {
          background-color: rgba(200, 35, 51, 1);
        }

        .primary-badge {
          position: absolute;
          bottom: 5px;
          left: 5px;
          background-color: rgba(40, 167, 69, 0.9);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};
