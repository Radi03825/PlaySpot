package dto

import "time"

type ReservationWithFacilityDTO struct {
	ID         int64     `json:"id"`
	UserID     int64     `json:"user_id"`
	FacilityID int64     `json:"facility_id"`
	StartTime  time.Time `json:"start_time"`
	EndTime    time.Time `json:"end_time"`
	Status     string    `json:"status"`
	TotalPrice float64   `json:"total_price"`
	CreatedAt  time.Time `json:"created_at"`

	// User details
	UserName  string `json:"user_name,omitempty"`
	UserEmail string `json:"user_email,omitempty"`

	// Facility details
	FacilityName    string  `json:"facility_name"`
	FacilitySport   string  `json:"facility_sport"`
	FacilitySportID int64   `json:"facility_sport_id"`
	FacilityCity    string  `json:"facility_city"`
	FacilityAddress string  `json:"facility_address"`
	ComplexName     *string `json:"complex_name,omitempty"`
}
