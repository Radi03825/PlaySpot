package model

type Facility struct {
	ID             int64  `json:"id"`
	Name           string `json:"name"`
	SportComplexID *int64 `json:"sport_complex_id"`
	CategoryID     int64  `json:"category_id"`
	SurfaceID      int64  `json:"surface_id"`
	EnvironmentID  int64  `json:"environment_id"`
	Description    string `json:"description"`
	Capacity       int    `json:"capacity"`
	IsVerified     bool   `json:"is_verified"`
	IsActive       bool   `json:"is_active"`
}

type FacilityDetails struct {
	Facility
	CategoryName     string  `json:"category_name"`
	SurfaceName      string  `json:"surface_name"`
	EnvironmentName  string  `json:"environment_name"`
	SportName        string  `json:"sport_name"`
	SportComplexName string  `json:"sport_complex_name,omitempty"`
	City             *string `json:"city,omitempty"`
	Address          *string `json:"address,omitempty"`
}

type FacilitySearchParams struct {
	City        string
	Sport       string
	Surface     string
	Environment string
	MinCapacity int
	MaxCapacity int
	SortBy      string // name, capacity, city
	SortOrder   string // asc, desc
}
