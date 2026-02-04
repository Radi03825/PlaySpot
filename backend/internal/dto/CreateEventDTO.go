package dto

import "time"

type CreateEventDTO struct {
	Title            string     `json:"title"`
	Description      *string    `json:"description"`
	SportID          int64      `json:"sport_id"`
	StartTime        *time.Time `json:"start_time"`         
	EndTime          *time.Time `json:"end_time"`           
	MaxParticipants  int        `json:"max_participants"`   
	LocationType     string     `json:"location_type"`      // "booking" or "external"
	Address          *string    `json:"address"`            
	RelatedBookingID *int64     `json:"related_booking_id"` 
}
