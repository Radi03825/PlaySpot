package dto

type CreateReservationDTO struct {
	FacilityID int64  `json:"facility_id"`
	StartTime  string `json:"start_time"` // ISO 8601 format
	EndTime    string `json:"end_time"`   // ISO 8601 format
}
