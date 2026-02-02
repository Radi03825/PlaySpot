package dto

// WorkingHoursDTO represents the working hours for a day type
type WorkingHoursDTO struct {
	DayType   string `json:"day_type" binding:"required,oneof=weekday weekend"`
	OpenTime  string `json:"open_time" binding:"required"`  // HH:MM format
	CloseTime string `json:"close_time" binding:"required"` // HH:MM format
}

// PricingSlotDTO represents a pricing interval
type PricingSlotDTO struct {
	DayType      string  `json:"day_type" binding:"required,oneof=weekday weekend"`
	StartHour    string  `json:"start_hour" binding:"required"` // HH:MM format
	EndHour      string  `json:"end_hour" binding:"required"`   // HH:MM format
	PricePerHour float64 `json:"price_per_hour" binding:"required,gt=0"`
}

type CreateFacilityDTO struct {
	Name           string            `json:"name"`
	SportComplexID *int64            `json:"sport_complex_id"`
	CategoryID     int64             `json:"category_id"`
	SurfaceID      int64             `json:"surface_id"`
	EnvironmentID  int64             `json:"environment_id"`
	City           string            `json:"city"`
	Address        string            `json:"address"`
	Description    string            `json:"description"`
	Capacity       int               `json:"capacity"`
	ImageURLs      []string          `json:"image_urls,omitempty"`
	WorkingHours   []WorkingHoursDTO `json:"working_hours,omitempty"`
	Pricing        []PricingSlotDTO  `json:"pricing,omitempty"`
}
