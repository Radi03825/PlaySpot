package dto

type CreateReservationDTO struct {
	FacilityID int64  `json:"facility_id"`
	StartTime  string `json:"start_time"`
	EndTime    string `json:"end_time"`
}
