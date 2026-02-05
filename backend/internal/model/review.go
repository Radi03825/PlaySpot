package model

import "time"

type Review struct {
	ID         int64     `json:"id"`
	UserID     int64     `json:"user_id"`
	FacilityID int64     `json:"facility_id"`
	Rating     int       `json:"rating"`
	Title      string    `json:"title"`
	Comment    string    `json:"comment"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type ReviewWithUser struct {
	Review
	UserName string `json:"user_name"`
}

type FacilityReviewStats struct {
	AverageRating float64 `json:"average_rating"`
	TotalReviews  int     `json:"total_reviews"`
}
