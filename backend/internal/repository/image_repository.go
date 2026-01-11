package repository

import (
	"database/sql"
	"time"

	"github.com/Radi03825/PlaySpot/internal/model"
)

type ImageRepository struct {
	db *sql.DB
}

func NewImageRepository(db *sql.DB) *ImageRepository {
	return &ImageRepository{db: db}
}

// CreateImage creates a new image record in the database
func (r *ImageRepository) CreateImage(url, storageID, storageProvider, imageType string, referenceID, ownerID int64, isPrimary bool) (*model.Image, error) {
	query := `
		INSERT INTO images (url, storage_id, storage_provider, image_type, reference_id, owner_id, is_primary, uploaded_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, url, storage_id, storage_provider, image_type, reference_id, owner_id, is_primary, uploaded_at
	`

	var image model.Image
	err := r.db.QueryRow(
		query,
		url,
		storageID,
		storageProvider,
		imageType,
		referenceID,
		ownerID,
		isPrimary,
		time.Now(),
	).Scan(
		&image.ID,
		&image.URL,
		&image.StorageID,
		&image.StorageProvider,
		&image.ImageType,
		&image.ReferenceID,
		&image.OwnerID,
		&image.IsPrimary,
		&image.UploadedAt,
	)

	if err != nil {
		return nil, err
	}

	return &image, nil
}

// GetImagesByReference gets all images for a specific reference (sport_complex or facility)
func (r *ImageRepository) GetImagesByReference(imageType string, referenceID int64) ([]model.Image, error) {
	query := `
		SELECT id, url, storage_id, storage_provider, image_type, reference_id, owner_id, is_primary, uploaded_at
		FROM images
		WHERE image_type = $1 AND reference_id = $2
		ORDER BY is_primary DESC, uploaded_at ASC
	`

	rows, err := r.db.Query(query, imageType, referenceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []model.Image
	for rows.Next() {
		var img model.Image
		err := rows.Scan(
			&img.ID,
			&img.URL,
			&img.StorageID,
			&img.StorageProvider,
			&img.ImageType,
			&img.ReferenceID,
			&img.OwnerID,
			&img.IsPrimary,
			&img.UploadedAt,
		)
		if err != nil {
			return nil, err
		}
		images = append(images, img)
	}

	return images, nil
}

// UnsetPrimaryImages removes the primary flag from all images of a specific type and reference
func (r *ImageRepository) UnsetPrimaryImages(imageType string, referenceID int64) error {
	query := `
		UPDATE images
		SET is_primary = FALSE
		WHERE image_type = $1 AND reference_id = $2
	`

	_, err := r.db.Exec(query, imageType, referenceID)
	return err
}

// DeleteImage deletes an image by ID
func (r *ImageRepository) DeleteImage(id int64) error {
	query := `DELETE FROM images WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

// DeleteByStorageID deletes an image by storage provider and storage ID
func (r *ImageRepository) DeleteByStorageID(storageProvider, storageID string) error {
	query := `DELETE FROM images WHERE storage_provider = $1 AND storage_id = $2`
	_, err := r.db.Exec(query, storageProvider, storageID)
	return err
}

// GetImageByStorageID gets a single image by storage provider and storage ID
func (r *ImageRepository) GetImageByStorageID(storageProvider, storageID string) (*model.Image, error) {
	query := `
		SELECT id, url, storage_id, storage_provider, image_type, reference_id, owner_id, is_primary, uploaded_at
		FROM images
		WHERE storage_provider = $1 AND storage_id = $2
	`

	var image model.Image
	err := r.db.QueryRow(query, storageProvider, storageID).Scan(
		&image.ID,
		&image.URL,
		&image.StorageID,
		&image.StorageProvider,
		&image.ImageType,
		&image.ReferenceID,
		&image.OwnerID,
		&image.IsPrimary,
		&image.UploadedAt,
	)

	if err != nil {
		return nil, err
	}

	return &image, nil
}

// GetImageByID gets a single image by ID
func (r *ImageRepository) GetImageByID(id int64) (*model.Image, error) {
	query := `
		SELECT id, url, storage_id, storage_provider, image_type, reference_id, owner_id, is_primary, uploaded_at
		FROM images
		WHERE id = $1
	`

	var image model.Image
	err := r.db.QueryRow(query, id).Scan(
		&image.ID,
		&image.URL,
		&image.StorageID,
		&image.StorageProvider,
		&image.ImageType,
		&image.ReferenceID,
		&image.OwnerID,
		&image.IsPrimary,
		&image.UploadedAt,
	)

	if err != nil {
		return nil, err
	}

	return &image, nil
}
