package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Radi03825/PlaySpot/internal/service"
	"github.com/gorilla/mux"
)

type ImageHandler struct {
	imageService *service.ImageService
}

func NewImageHandler(imageService *service.ImageService) *ImageHandler {
	return &ImageHandler{
		imageService: imageService,
	}
}

// UploadImage handles image upload to Cloudinary
func (h *ImageHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form with 10MB max memory
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to parse form"})
		return
	}

	// Get the file from the request
	file, header, err := r.FormFile("image")
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "No image file provided"})
		return
	}
	defer file.Close()

	// Get the folder from form data (optional)
	folder := r.FormValue("folder")
	if folder == "" {
		folder = "playspot" // Default folder
	}
	// Upload to Cloudinary
	imageURL, err := h.imageService.UploadMultipartImage(file, header, folder)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to upload image: " + err.Error()})
		return
	}

	// Return the image URL
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"url": imageURL})
}

// UploadMultipleImages handles multiple image uploads
func (h *ImageHandler) UploadMultipleImages(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form with 50MB max memory for multiple images
	err := r.ParseMultipartForm(50 << 20)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to parse form"})
		return
	}

	// Get the folder from form data (optional)
	folder := r.FormValue("folder")
	if folder == "" {
		folder = "playspot"
	}
	// Get all files from the request
	files := r.MultipartForm.File["images"]
	if len(files) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "No image files provided"})
		return
	}

	// Upload all images using the image service
	urls, uploadErrors := h.imageService.UploadMultipleImages(files, folder)

	// Return the image URLs and any errors
	response := map[string]interface{}{
		"urls":    urls,
		"success": len(urls),
		"total":   len(files),
	}

	if len(uploadErrors) > 0 {
		response["errors"] = uploadErrors
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetEntityImages retrieves all images for a specific entity (facility or sport_complex)
func (h *ImageHandler) GetEntityImages(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	entityType := vars["entityType"]
	entityIDStr := vars["entityId"]

	// Validate entity type
	if entityType != "facility" && entityType != "sport_complex" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid entity type. Must be 'facility' or 'sport_complex'"})
		return
	}

	// Parse entity ID
	entityID, err := strconv.ParseInt(entityIDStr, 10, 64)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid entity ID"})
		return
	}

	// Get images from service
	images, err := h.imageService.GetImagesByReference(entityType, entityID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch images: " + err.Error()})
		return
	}

	// Return the images
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(images)
}
