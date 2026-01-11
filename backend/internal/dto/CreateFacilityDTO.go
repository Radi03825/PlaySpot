package dto

type CreateFacilityDTO struct {
	Name           string   `json:"name"`
	SportComplexID *int64   `json:"sport_complex_id"`
	CategoryID     int64    `json:"category_id"`
	SurfaceID      int64    `json:"surface_id"`
	EnvironmentID  int64    `json:"environment_id"`
	City           string   `json:"city"`
	Address        string   `json:"address"`
	Description    string   `json:"description"`
	Capacity       int      `json:"capacity"`
	ImageURLs      []string `json:"image_urls,omitempty"`
}
