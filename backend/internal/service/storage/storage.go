package storage

import (
	"io"
	"mime/multipart"
)

// PhotoStorage defines the interface for image storage providers
type PhotoStorage interface {
	// Upload uploads a file and returns the upload result
	Upload(file io.Reader, filename string, folder string) (*UploadResult, error)

	// UploadMultipart uploads a multipart file and returns the upload result
	UploadMultipart(file multipart.File, header *multipart.FileHeader, folder string) (*UploadResult, error)

	// Delete removes a file from storage using its storage ID
	Delete(storageID string) error

	// GetURL returns the public URL for a stored file
	GetURL(storageID string) string

	// GetProviderName returns the name of the storage provider
	GetProviderName() string
}

// UploadResult contains the result of an upload operation
type UploadResult struct {
	URL       string
	StorageID string
	Format    string
	Width     int
	Height    int
	FileSize  int64
	MimeType  string
}
