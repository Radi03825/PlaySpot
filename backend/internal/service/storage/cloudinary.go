package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"time"
)

// CloudinaryStorage implements PhotoStorage interface for Cloudinary
type CloudinaryStorage struct {
	cloudName string
	apiKey    string
	apiSecret string
	preset    string
}

type cloudinaryUploadResponse struct {
	SecureURL string `json:"secure_url"`
	PublicID  string `json:"public_id"`
	Format    string `json:"format"`
	Width     int    `json:"width"`
	Height    int    `json:"height"`
	Bytes     int64  `json:"bytes"`
}

// NewCloudinaryStorage creates a new Cloudinary storage instance
func NewCloudinaryStorage() *CloudinaryStorage {
	return &CloudinaryStorage{
		cloudName: os.Getenv("CLOUDINARY_CLOUD_NAME"),
		apiKey:    os.Getenv("CLOUDINARY_API_KEY"),
		apiSecret: os.Getenv("CLOUDINARY_API_SECRET"),
		preset:    os.Getenv("CLOUDINARY_UPLOAD_PRESET"),
	}
}

// Upload uploads a file from an io.Reader
func (c *CloudinaryStorage) Upload(file io.Reader, filename string, folder string) (*UploadResult, error) {
	var buffer bytes.Buffer
	writer := multipart.NewWriter(&buffer)

	// Create form file
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return nil, err
	}

	// Copy the file data to the form
	_, err = io.Copy(part, file)
	if err != nil {
		return nil, err
	}

	return c.uploadToCloudinary(writer, &buffer, folder, filename)
}

// UploadMultipart uploads a multipart file
func (c *CloudinaryStorage) UploadMultipart(file multipart.File, header *multipart.FileHeader, folder string) (*UploadResult, error) {
	var buffer bytes.Buffer
	writer := multipart.NewWriter(&buffer)

	// Create form file
	part, err := writer.CreateFormFile("file", header.Filename)
	if err != nil {
		return nil, err
	}

	// Copy the file data to the form
	_, err = io.Copy(part, file)
	if err != nil {
		return nil, err
	}

	return c.uploadToCloudinary(writer, &buffer, folder, header.Filename)
}

// uploadToCloudinary performs the actual upload to Cloudinary
func (c *CloudinaryStorage) uploadToCloudinary(writer *multipart.Writer, buffer *bytes.Buffer, folder string, filename string) (*UploadResult, error) {
	// Add upload preset or unsigned upload parameters
	if c.preset != "" {
		writer.WriteField("upload_preset", c.preset)
	}
	writer.WriteField("folder", folder)

	// Close the writer
	err := writer.Close()
	if err != nil {
		return nil, err
	}

	// Create the request
	uploadURL := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", c.cloudName)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "POST", uploadURL, buffer)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())

	// If using signed upload (more secure)
	if c.apiKey != "" && c.apiSecret != "" {
		req.SetBasicAuth(c.apiKey, c.apiSecret)
	}

	// Send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("cloudinary upload failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Parse the response
	var uploadResp cloudinaryUploadResponse
	err = json.NewDecoder(resp.Body).Decode(&uploadResp)
	if err != nil {
		return nil, err
	}

	// Determine MIME type from format
	mimeType := "image/" + uploadResp.Format

	return &UploadResult{
		URL:       uploadResp.SecureURL,
		StorageID: uploadResp.PublicID,
		Format:    uploadResp.Format,
		Width:     uploadResp.Width,
		Height:    uploadResp.Height,
		FileSize:  uploadResp.Bytes,
		MimeType:  mimeType,
	}, nil
}

// Delete removes a file from Cloudinary
func (c *CloudinaryStorage) Delete(storageID string) error {
	// For signed deletion, you would need to implement the Admin API
	// This requires generating a signature with timestamp
	// For now, return nil as this is optional
	// You can implement this later when needed
	return nil
}

// GetURL returns the public URL for a stored file
func (c *CloudinaryStorage) GetURL(storageID string) string {
	// Cloudinary public URLs follow a pattern
	return fmt.Sprintf("https://res.cloudinary.com/%s/image/upload/%s", c.cloudName, storageID)
}

// GetProviderName returns the name of the storage provider
func (c *CloudinaryStorage) GetProviderName() string {
	return "cloudinary"
}
