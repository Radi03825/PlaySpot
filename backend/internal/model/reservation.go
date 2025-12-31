package model

import "time"

type FacilitySchedule struct {
	ID         int64  `json:"id"`
	FacilityID int64  `json:"facility_id"`
	OpenTime   string `json:"open_time"`
	CloseTime  string `json:"close_time"`
	DayType    string `json:"day_type"` // 'weekday' or 'weekend'
}

type FacilityPricing struct {
	ID           int64   `json:"id"`
	FacilityID   int64   `json:"facility_id"`
	DayType      string  `json:"day_type"` // 'weekday' or 'weekend'
	StartHour    string  `json:"start_hour"`
	EndHour      string  `json:"end_hour"`
	PricePerHour float64 `json:"price_per_hour"`
}

type FacilityReservation struct {
	ID                    int64     `json:"id"`
	UserID                int64     `json:"user_id"`
	FacilityID            int64     `json:"facility_id"`
	StartTime             time.Time `json:"start_time"`
	EndTime               time.Time `json:"end_time"`
	Status                string    `json:"status"` // 'pending', 'confirmed', 'cancelled', 'completed'
	TotalPrice            float64   `json:"total_price"`
	CreatedAt             time.Time `json:"created_at"`
	GoogleCalendarEventID *string   `json:"google_calendar_event_id,omitempty"`
}

type AvailableSlot struct {
	StartTime    string  `json:"start_time"`
	EndTime      string  `json:"end_time"`
	PricePerHour float64 `json:"price_per_hour"`
	Available    bool    `json:"available"`
}

type DayAvailability struct {
	Date   string          `json:"date"`
	IsOpen bool            `json:"is_open"`
	Slots  []AvailableSlot `json:"slots"`
}
