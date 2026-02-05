package repository

import (
	"database/sql"
	"fmt"

	"github.com/Radi03825/PlaySpot/internal/model"
)

type ReviewRepository struct {
	db *sql.DB
}

func NewReviewRepository(db *sql.DB) *ReviewRepository {
	return &ReviewRepository{db: db}
}

// CreateReview creates a new review for a facility
func (r *ReviewRepository) CreateReview(review *model.Review) error {
	query := `
		INSERT INTO reviews (user_id, facility_id, rating, title, comment, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query, review.UserID, review.FacilityID, review.Rating, review.Title, review.Comment).
		Scan(&review.ID, &review.CreatedAt, &review.UpdatedAt)
}

// UpdateReview updates an existing review
func (r *ReviewRepository) UpdateReview(review *model.Review) error {
	query := `
		UPDATE reviews
		SET rating = $1, title = $2, comment = $3, updated_at = NOW()
		WHERE id = $4
		RETURNING updated_at
	`
	return r.db.QueryRow(query, review.Rating, review.Title, review.Comment, review.ID).
		Scan(&review.UpdatedAt)
}

// GetReviewByID retrieves a review by ID
func (r *ReviewRepository) GetReviewByID(id int64) (*model.Review, error) {
	query := `
		SELECT id, user_id, facility_id, rating, title, comment, created_at, updated_at
		FROM reviews
		WHERE id = $1
	`
	review := &model.Review{}
	err := r.db.QueryRow(query, id).Scan(
		&review.ID, &review.UserID, &review.FacilityID, &review.Rating,
		&review.Title, &review.Comment, &review.CreatedAt, &review.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return review, err
}

// GetReviewByUserAndFacility retrieves a review for a specific user and facility
func (r *ReviewRepository) GetReviewByUserAndFacility(userID, facilityID int64) (*model.Review, error) {
	query := `
		SELECT id, user_id, facility_id, rating, title, comment, created_at, updated_at
		FROM reviews
		WHERE user_id = $1 AND facility_id = $2
	`
	review := &model.Review{}
	err := r.db.QueryRow(query, userID, facilityID).Scan(
		&review.ID, &review.UserID, &review.FacilityID, &review.Rating,
		&review.Title, &review.Comment, &review.CreatedAt, &review.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return review, err
}

// GetReviewsByFacility retrieves all reviews for a facility with user information
func (r *ReviewRepository) GetReviewsByFacility(facilityID int64) ([]model.ReviewWithUser, error) {
	query := `
		SELECT r.id, r.user_id, r.facility_id, r.rating, r.title, r.comment, 
		       r.created_at, r.updated_at, u.name
		FROM reviews r
		JOIN users u ON r.user_id = u.id
		WHERE r.facility_id = $1
		ORDER BY r.created_at DESC
	`
	rows, err := r.db.Query(query, facilityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	reviews := []model.ReviewWithUser{}
	for rows.Next() {
		var review model.ReviewWithUser
		err := rows.Scan(
			&review.ID, &review.UserID, &review.FacilityID, &review.Rating,
			&review.Title, &review.Comment, &review.CreatedAt, &review.UpdatedAt,
			&review.UserName,
		)
		if err != nil {
			return nil, err
		}
		reviews = append(reviews, review)
	}
	return reviews, nil
}

// GetFacilityReviewStats retrieves average rating and total review count for a facility
func (r *ReviewRepository) GetFacilityReviewStats(facilityID int64) (*model.FacilityReviewStats, error) {
	query := `
		SELECT COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as total_reviews
		FROM reviews
		WHERE facility_id = $1
	`
	stats := &model.FacilityReviewStats{}
	err := r.db.QueryRow(query, facilityID).Scan(&stats.AverageRating, &stats.TotalReviews)
	if err != nil {
		return nil, err
	}
	return stats, nil
}

// DeleteReview deletes a review by ID
func (r *ReviewRepository) DeleteReview(id int64) error {
	query := `DELETE FROM reviews WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("review not found")
	}
	return nil
}

// HasCompletedReservation checks if user has completed a reservation for a facility
func (r *ReviewRepository) HasCompletedReservation(userID, facilityID int64) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM facility_reservations
			WHERE user_id = $1 AND facility_id = $2 AND status = 'completed'
		)
	`
	var exists bool
	err := r.db.QueryRow(query, userID, facilityID).Scan(&exists)
	return exists, err
}
