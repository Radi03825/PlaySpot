package service

import (
	"io"
	"mime/multipart"

	"github.com/Radi03825/PlaySpot/internal/model"
	"github.com/Radi03825/PlaySpot/internal/repository"
	"github.com/Radi03825/PlaySpot/internal/service/storage"
)

// ImageService handles image operations using a pluggable storage provider
type ImageService struct {
	storage   storage.PhotoStorage
	imageRepo *repository.ImageRepository
}

// NewImageService creates a new image service with the specified storage provider
func NewImageService(photoStorage storage.PhotoStorage, imageRepo *repository.ImageRepository) *ImageService {
	return &ImageService{
		storage:   photoStorage,
		imageRepo: imageRepo,
	}
}

// UploadImage uploads a single image from an io.Reader
func (s *ImageService) UploadImage(file io.Reader, filename string, folder string) (string, error) {
	result, err := s.storage.Upload(file, filename, folder)
	if err != nil {
		return "", err
	}
	return result.URL, nil
}

// UploadMultipartImage uploads a single multipart image
func (s *ImageService) UploadMultipartImage(file multipart.File, header *multipart.FileHeader, folder string) (string, error) {
	result, err := s.storage.UploadMultipart(file, header, folder)
	if err != nil {
		return "", err
	}
	return result.URL, nil
}

// UploadMultipleImages uploads multiple multipart images
func (s *ImageService) UploadMultipleImages(files []*multipart.FileHeader, folder string) (urls []string, errors []string) {
	urls = make([]string, 0, len(files))
	errors = make([]string, 0)

	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			errors = append(errors, "Failed to open file: "+fileHeader.Filename)
			continue
		}

		url, err := s.UploadMultipartImage(file, fileHeader, folder)
		file.Close()

		if err != nil {
			errors = append(errors, "Failed to upload "+fileHeader.Filename+": "+err.Error())
			continue
		}

		urls = append(urls, url)
	}

	return urls, errors
}

// DeleteImage deletes an image using its storage ID
func (s *ImageService) DeleteImage(storageID string) error {
	return s.storage.Delete(storageID)
}

// GetImageURL returns the public URL for an image
func (s *ImageService) GetImageURL(storageID string) string {
	return s.storage.GetURL(storageID)
}

// UploadAndSaveImage uploads an image and saves its metadata to the database
func (s *ImageService) UploadAndSaveImage(file multipart.File, header *multipart.FileHeader, folder, imageType string, referenceID, ownerID int64, isPrimary bool) (*model.Image, error) {
	// Upload to storage provider
	result, err := s.storage.UploadMultipart(file, header, folder)
	if err != nil {
		return nil, err
	}

	// Save to database
	storageID := result.StorageID
	if storageID == "" {
		storageID = ""
	}

	image, err := s.imageRepo.CreateImage(
		result.URL,
		storageID,
		s.storage.GetProviderName(),
		imageType,
		referenceID,
		ownerID,
		isPrimary,
	)
	if err != nil {
		// Try to delete the uploaded file if database save fails
		if result.StorageID != "" {
			_ = s.storage.Delete(result.StorageID)
		}
		return nil, err
	}

	return image, nil
}

// UploadAndSaveMultipleImages uploads multiple images and saves their metadata to the database
func (s *ImageService) UploadAndSaveMultipleImages(files []*multipart.FileHeader, folder, imageType string, referenceID, ownerID int64) ([]model.Image, []string) {
	images := make([]model.Image, 0, len(files))
	errors := make([]string, 0)

	for i, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			errors = append(errors, "Failed to open file: "+fileHeader.Filename)
			continue
		}

		isPrimary := i == 0 // First image is primary
		image, err := s.UploadAndSaveImage(file, fileHeader, folder, imageType, referenceID, ownerID, isPrimary)
		file.Close()

		if err != nil {
			errors = append(errors, "Failed to upload "+fileHeader.Filename+": "+err.Error())
			continue
		}

		images = append(images, *image)
	}

	return images, errors
}

// CreateImagesFromURLs creates image records from pre-existing URLs (for legacy or external images)
func (s *ImageService) CreateImagesFromURLs(imageURLs []string, imageType string, referenceID, ownerID int64) error {
	if len(imageURLs) == 0 {
		return nil
	}

	for i, imageURL := range imageURLs {
		isPrimary := i == 0 // First image is primary

		_, err := s.imageRepo.CreateImage(
			imageURL,                    // url
			"",                          // storageID (empty for external/legacy URLs)
			s.storage.GetProviderName(), // storageProvider
			imageType,                   // imageType
			referenceID,                 // referenceID
			ownerID,                     // ownerID
			isPrimary,                   // isPrimary
		)
		if err != nil {
			// Log error but continue with other images
			// In production, you might want to collect and return these errors
			continue
		}
	}

	return nil
}

// GetImagesByReference retrieves all images for a specific reference
func (s *ImageService) GetImagesByReference(imageType string, referenceID int64) ([]model.Image, error) {
	return s.imageRepo.GetImagesByReference(imageType, referenceID)
}

// DeleteImageWithStorage deletes an image from both storage and database
func (s *ImageService) DeleteImageWithStorage(imageID int64) error {
	// Get image details first
	image, err := s.imageRepo.GetImageByID(imageID)
	if err != nil {
		return err
	}

	// Delete from storage if it has a storage ID
	if image.StorageID != nil && *image.StorageID != "" {
		_ = s.storage.Delete(*image.StorageID) // Don't fail if storage deletion fails
	}

	// Delete from database
	return s.imageRepo.DeleteImage(imageID)
}
