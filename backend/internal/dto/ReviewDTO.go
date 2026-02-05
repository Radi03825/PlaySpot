package dto

type CreateReviewDTO struct {
	FacilityID int64  `json:"facility_id"`
	Rating     int    `json:"rating"`
	Title      string `json:"title"`
	Comment    string `json:"comment"`
}

type UpdateReviewDTO struct {
	Rating  int    `json:"rating"`
	Title   string `json:"title"`
	Comment string `json:"comment"`
}
