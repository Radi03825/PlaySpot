package service

import (
	"fmt"

	"github.com/Radi03825/PlaySpot/internal/dto"
	"github.com/Radi03825/PlaySpot/internal/model"
	"github.com/Radi03825/PlaySpot/internal/repository"
)

type ReviewService struct {
	reviewRepo *repository.ReviewRepository
}

func NewReviewService(reviewRepo *repository.ReviewRepository) *ReviewService {
	return &ReviewService{
		reviewRepo: reviewRepo,
	}
}

// CreateReview creates a new review for a facility
func (s *ReviewService) CreateReview(userID int64, req *dto.CreateReviewDTO) (*model.Review, error) {
	// Validate rating
	if req.Rating < 1 || req.Rating > 5 {
		return nil, fmt.Errorf("rating must be between 1 and 5")
	}

	// Check if user has completed a reservation for this facility
	hasCompleted, err := s.reviewRepo.HasCompletedReservation(userID, req.FacilityID)
	if err != nil {
		return nil, fmt.Errorf("failed to check reservations: %w", err)
	}
	if !hasCompleted {
		return nil, fmt.Errorf("you can only review facilities you have completed reservations for")
	}

	// Check if user already has a review for this facility
	existingReview, err := s.reviewRepo.GetReviewByUserAndFacility(userID, req.FacilityID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing review: %w", err)
	}
	if existingReview != nil {
		return nil, fmt.Errorf("you have already reviewed this facility. Please update your existing review instead")
	}

	// Create the review
	review := &model.Review{
		UserID:     userID,
		FacilityID: req.FacilityID,
		Rating:     req.Rating,
		Title:      req.Title,
		Comment:    req.Comment,
	}

	if err := s.reviewRepo.CreateReview(review); err != nil {
		return nil, fmt.Errorf("failed to create review: %w", err)
	}

	return review, nil
}

// UpdateReview updates an existing review
func (s *ReviewService) UpdateReview(userID, reviewID int64, req *dto.UpdateReviewDTO) (*model.Review, error) {
	// Validate rating
	if req.Rating < 1 || req.Rating > 5 {
		return nil, fmt.Errorf("rating must be between 1 and 5")
	}

	// Get existing review
	review, err := s.reviewRepo.GetReviewByID(reviewID)
	if err != nil {
		return nil, fmt.Errorf("failed to get review: %w", err)
	}
	if review == nil {
		return nil, fmt.Errorf("review not found")
	}

	// Check if user owns this review
	if review.UserID != userID {
		return nil, fmt.Errorf("you can only update your own reviews")
	}

	// Update review fields
	review.Rating = req.Rating
	review.Title = req.Title
	review.Comment = req.Comment

	if err := s.reviewRepo.UpdateReview(review); err != nil {
		return nil, fmt.Errorf("failed to update review: %w", err)
	}

	return review, nil
}

// GetReviewByUserAndFacility retrieves a user's review for a specific facility
func (s *ReviewService) GetReviewByUserAndFacility(userID, facilityID int64) (*model.Review, error) {
	review, err := s.reviewRepo.GetReviewByUserAndFacility(userID, facilityID)
	if err != nil {
		return nil, fmt.Errorf("failed to get review: %w", err)
	}
	return review, nil
}

// GetReviewsByFacility retrieves all reviews for a facility
func (s *ReviewService) GetReviewsByFacility(facilityID int64) ([]model.ReviewWithUser, error) {
	reviews, err := s.reviewRepo.GetReviewsByFacility(facilityID)
	if err != nil {
		return nil, fmt.Errorf("failed to get reviews: %w", err)
	}
	return reviews, nil
}

// GetFacilityReviewStats retrieves review statistics for a facility
func (s *ReviewService) GetFacilityReviewStats(facilityID int64) (*model.FacilityReviewStats, error) {
	stats, err := s.reviewRepo.GetFacilityReviewStats(facilityID)
	if err != nil {
		return nil, fmt.Errorf("failed to get review stats: %w", err)
	}
	return stats, nil
}

// DeleteReview deletes a review
func (s *ReviewService) DeleteReview(userID, reviewID int64) error {
	// Get existing review
	review, err := s.reviewRepo.GetReviewByID(reviewID)
	if err != nil {
		return fmt.Errorf("failed to get review: %w", err)
	}
	if review == nil {
		return fmt.Errorf("review not found")
	}

	// Check if user owns this review
	if review.UserID != userID {
		return fmt.Errorf("you can only delete your own reviews")
	}

	if err := s.reviewRepo.DeleteReview(reviewID); err != nil {
		return fmt.Errorf("failed to delete review: %w", err)
	}

	return nil
}

// CanUserReview checks if a user can review a facility (has completed reservation but no existing review)
func (s *ReviewService) CanUserReview(userID, facilityID int64) (bool, error) {
	// Check if user has completed a reservation
	hasCompleted, err := s.reviewRepo.HasCompletedReservation(userID, facilityID)
	if err != nil {
		return false, fmt.Errorf("failed to check reservations: %w", err)
	}
	if !hasCompleted {
		return false, nil
	}

	// Check if user already has a review
	existingReview, err := s.reviewRepo.GetReviewByUserAndFacility(userID, facilityID)
	if err != nil {
		return false, fmt.Errorf("failed to check existing review: %w", err)
	}

	return existingReview == nil, nil
}
