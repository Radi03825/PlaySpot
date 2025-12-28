package dto

type CreateSportComplexDTO struct {
	Name        string                       `json:"name"`
	Address     string                       `json:"address"`
	City        string                       `json:"city"`
	Description string                       `json:"description"`
	Facilities  []CreateFacilityInComplexDTO `json:"facilities,omitempty"`
}

type CreateFacilityInComplexDTO struct {
	Name          string `json:"name"`
	CategoryID    int64  `json:"category_id"`
	SurfaceID     int64  `json:"surface_id"`
	EnvironmentID int64  `json:"environment_id"`
	Description   string `json:"description"`
	Capacity      int    `json:"capacity"`
}
