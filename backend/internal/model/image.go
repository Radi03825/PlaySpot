package model

import "time"

type Image struct {
	ID              int64     `json:"id"`
	URL             string    `json:"url"`
	StorageID       *string   `json:"storage_id,omitempty"`
	StorageProvider string    `json:"storage_provider"`
	ImageType       string    `json:"image_type"`
	ReferenceID     int64     `json:"reference_id"`
	OwnerID         *int64    `json:"owner_id"`
	IsPrimary       bool      `json:"is_primary"`
	UploadedAt      time.Time `json:"uploaded_at"`
}
