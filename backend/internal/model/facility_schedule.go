package model

import "time"

// DayType represents the type of day for scheduling
type DayType string

const (
	DayTypeWeekday DayType = "weekday"
	DayTypeWeekend DayType = "weekend"
)

// FacilitySchedule represents the working hours for a facility
type FacilitySchedule struct {
	ID         int64     `json:"id"`
	FacilityID int64     `json:"facility_id"`
	OpenTime   time.Time `json:"open_time"`
	CloseTime  time.Time `json:"close_time"`
	DayType    DayType   `json:"day_type"`
}

// FacilityPricing represents pricing intervals for a facility
type FacilityPricing struct {
	ID           int64   `json:"id"`
	FacilityID   int64   `json:"facility_id"`
	DayType      DayType `json:"day_type"`
	StartHour    string  `json:"start_hour"` // HH:MM format
	EndHour      string  `json:"end_hour"`   // HH:MM format
	PricePerHour float64 `json:"price_per_hour"`
}
