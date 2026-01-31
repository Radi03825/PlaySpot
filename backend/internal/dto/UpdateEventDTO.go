package dto

import "time"

type UpdateEventDTO struct {
	Title           *string    `json:"title"`
	Description     *string    `json:"description"`
	SportID         *int64     `json:"sport_id"`
	StartTime       *time.Time `json:"start_time"`
	EndTime         *time.Time `json:"end_time"`
	MaxParticipants *int       `json:"max_participants"`
	Status          *string    `json:"status"`
	FacilityID      *int64     `json:"facility_id"`
	Address         *string    `json:"address"`
}
