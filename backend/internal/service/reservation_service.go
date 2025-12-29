package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/Radi03825/PlaySpot/internal/dto"
	"github.com/Radi03825/PlaySpot/internal/model"
	"github.com/Radi03825/PlaySpot/internal/repository"
)

type ReservationService struct {
	repo *repository.ReservationRepository
}

func NewReservationService(repo *repository.ReservationRepository) *ReservationService {
	return &ReservationService{repo: repo}
}

// GetFacilityAvailability returns availability for a facility for a date range
func (s *ReservationService) GetFacilityAvailability(facilityID int64, startDate, endDate time.Time) ([]model.DayAvailability, error) {
	// Get facility schedules
	schedules, err := s.repo.GetFacilitySchedules(facilityID)
	if err != nil {
		return nil, fmt.Errorf("failed to get facility schedules: %w", err)
	}

	if len(schedules) == 0 {
		return nil, errors.New("no schedules found for this facility")
	}

	// Get facility pricing
	pricings, err := s.repo.GetFacilityPricing(facilityID)
	if err != nil {
		return nil, fmt.Errorf("failed to get facility pricing: %w", err)
	}

	if len(pricings) == 0 {
		return nil, errors.New("no pricing found for this facility")
	}

	// Get existing reservations
	reservations, err := s.repo.GetReservationsByFacilityAndDateRange(facilityID, startDate, endDate.Add(24*time.Hour))
	if err != nil {
		return nil, fmt.Errorf("failed to get reservations: %w", err)
	}

	// Build availability map
	var availability []model.DayAvailability

	// Iterate through each day in the range
	for date := startDate; !date.After(endDate); date = date.Add(24 * time.Hour) {
		dayAvailability := s.buildDayAvailability(date, schedules, pricings, reservations)
		availability = append(availability, dayAvailability)
	}

	return availability, nil
}

// buildDayAvailability builds availability for a single day
func (s *ReservationService) buildDayAvailability(date time.Time, schedules []model.FacilitySchedule, pricings []model.FacilityPricing, reservations []model.FacilityReservation) model.DayAvailability {
	dayType := "weekday"
	weekday := date.Weekday()
	if weekday == time.Saturday || weekday == time.Sunday {
		dayType = "weekend"
	}

	// Find schedule for this day type
	var schedule *model.FacilitySchedule
	for _, s := range schedules {
		if s.DayType == dayType {
			schedule = &s
			break
		}
	}

	dayAvailability := model.DayAvailability{
		Date:   date.Format("2006-01-02"),
		IsOpen: schedule != nil,
		Slots:  []model.AvailableSlot{},
	}

	if schedule == nil {
		return dayAvailability
	}

	// Parse open and close times
	openTime, err := time.Parse("15:04:05", schedule.OpenTime)
	if err != nil {
		return dayAvailability
	}

	closeTime, err := time.Parse("15:04:05", schedule.CloseTime)
	if err != nil {
		return dayAvailability
	}

	// Create time slots (hourly)
	currentSlot := time.Date(date.Year(), date.Month(), date.Day(), openTime.Hour(), 0, 0, 0, date.Location())
	endOfDay := time.Date(date.Year(), date.Month(), date.Day(), closeTime.Hour(), 0, 0, 0, date.Location())

	for currentSlot.Before(endOfDay) {
		slotEnd := currentSlot.Add(1 * time.Hour)

		// Find pricing for this slot
		price := s.findPricing(currentSlot, dayType, pricings)

		// Check if slot is available
		available := !s.isSlotReserved(currentSlot, slotEnd, reservations)

		slot := model.AvailableSlot{
			StartTime:    currentSlot.Format("15:04"),
			EndTime:      slotEnd.Format("15:04"),
			PricePerHour: price,
			Available:    available,
		}

		dayAvailability.Slots = append(dayAvailability.Slots, slot)
		currentSlot = slotEnd
	}

	return dayAvailability
}

// findPricing finds the price for a given time slot
func (s *ReservationService) findPricing(slotTime time.Time, dayType string, pricings []model.FacilityPricing) float64 {
	slotHour := slotTime.Format("15:04:05")

	for _, p := range pricings {
		if p.DayType == dayType && slotHour >= p.StartHour && slotHour < p.EndHour {
			return p.PricePerHour
		}
	}

	// Default price if not found
	return 0.0
}

// isSlotReserved checks if a time slot is already reserved
func (s *ReservationService) isSlotReserved(startTime, endTime time.Time, reservations []model.FacilityReservation) bool {
	for _, r := range reservations {
		// Check for overlap
		if startTime.Before(r.EndTime) && endTime.After(r.StartTime) {
			return true
		}
	}
	return false
}

// CreateReservation creates a new reservation
func (s *ReservationService) CreateReservation(userID int64, req dto.CreateReservationDTO) (*model.FacilityReservation, error) {
	// Parse times
	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		return nil, fmt.Errorf("invalid start time format: %w", err)
	}

	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		return nil, fmt.Errorf("invalid end time format: %w", err)
	}

	// Validate times
	if endTime.Before(startTime) || endTime.Equal(startTime) {
		return nil, errors.New("end time must be after start time")
	}

	if startTime.Before(time.Now()) {
		return nil, errors.New("cannot book in the past")
	}

	// Check for conflicts
	hasConflict, err := s.repo.CheckReservationConflict(req.FacilityID, startTime, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to check for conflicts: %w", err)
	}

	if hasConflict {
		return nil, errors.New("this time slot is already reserved")
	}

	// Calculate total price
	totalPrice, err := s.calculatePrice(req.FacilityID, startTime, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate price: %w", err)
	}

	// Create reservation
	reservation, err := s.repo.CreateReservation(userID, req.FacilityID, startTime, endTime, totalPrice)
	if err != nil {
		return nil, fmt.Errorf("failed to create reservation: %w", err)
	}

	return reservation, nil
}

// calculatePrice calculates the total price for a reservation
func (s *ReservationService) calculatePrice(facilityID int64, startTime, endTime time.Time) (float64, error) {
	pricings, err := s.repo.GetFacilityPricing(facilityID)
	if err != nil {
		return 0, err
	}

	duration := endTime.Sub(startTime)
	hours := duration.Hours()

	dayType := "weekday"
	weekday := startTime.Weekday()
	if weekday == time.Saturday || weekday == time.Sunday {
		dayType = "weekend"
	}

	// Find the pricing for the start time
	price := s.findPricing(startTime, dayType, pricings)

	return price * hours, nil
}

// GetUserReservations retrieves all reservations for a user
func (s *ReservationService) GetUserReservations(userID int64) ([]model.FacilityReservation, error) {
	return s.repo.GetUserReservations(userID)
}

// CancelReservation cancels a reservation
func (s *ReservationService) CancelReservation(reservationID, userID int64) error {
	return s.repo.CancelReservation(reservationID, userID)
}
