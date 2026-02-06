package service

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/Radi03825/PlaySpot/internal/dto"
	"github.com/Radi03825/PlaySpot/internal/model"
	"github.com/Radi03825/PlaySpot/internal/repository"
)

type ReservationService struct {
	repo                  *repository.ReservationRepository
	userService           *UserService
	facilityService       *FacilityService
	googleCalendarService *GoogleCalendarService
}

func NewReservationService(
	repo *repository.ReservationRepository,
	userService *UserService,
	facilityService *FacilityService,
	googleCalendarService *GoogleCalendarService,
) *ReservationService {
	return &ReservationService{
		repo:                  repo,
		userService:           userService,
		facilityService:       facilityService,
		googleCalendarService: googleCalendarService,
	}
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
	dayType := model.DayTypeWeekday
	weekday := date.Weekday()
	if weekday == time.Saturday || weekday == time.Sunday {
		dayType = model.DayTypeWeekend
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

	// Parse open and close times from "HH:MM:SS" format
	openTime, err := parseTimeOfDay(schedule.OpenTime)
	if err != nil {
		return dayAvailability
	}
	closeTime, err := parseTimeOfDay(schedule.CloseTime)
	if err != nil {
		return dayAvailability
	}

	// Create time slots (hourly)
	currentSlot := time.Date(date.Year(), date.Month(), date.Day(), openTime.Hour(), openTime.Minute(), 0, 0, date.Location())
	endOfDay := time.Date(date.Year(), date.Month(), date.Day(), closeTime.Hour(), closeTime.Minute(), 0, 0, date.Location())

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
func (s *ReservationService) findPricing(slotTime time.Time, dayType model.DayType, pricings []model.FacilityPricing) float64 {
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

// createCalendarEventForReservation creates a Google Calendar event for a reservation asynchronously
func (s *ReservationService) createCalendarEventForReservation(reservation *model.FacilityReservation) {
	// Run calendar event creation in a goroutine to avoid blocking
	go func() {
		// Get Google tokens (regardless of whether user has Google auth identity)
		accessToken, refreshToken, tokenExpiry, err := s.userService.GetGoogleTokens(reservation.UserID)
		if err != nil {
			// Error getting tokens, skip calendar event
			log.Printf("[CALENDAR] No Google tokens for user %d: %v", reservation.UserID, err)
			return
		}

		if accessToken == "" || refreshToken == "" {
			// No valid tokens, user hasn't connected calendar
			log.Printf("[CALENDAR] User %d has no calendar tokens", reservation.UserID)
			return
		}

		log.Printf("[CALENDAR] Creating calendar event for user %d, reservation %d", reservation.UserID, reservation.ID)

		// Get facility details
		facility, err := s.facilityService.GetFacilityDetailsByID(reservation.FacilityID)
		if err != nil {
			// Failed to get facility, skip calendar event
			log.Printf("[CALENDAR] Failed to get facility %d: %v", reservation.FacilityID, err)
			return
		}

		// Create calendar event
		description := fmt.Sprintf(
			"Facility: %s\nCategory: %s\nSport: %s\nPrice: €%.2f",
			facility.Name,
			facility.CategoryName,
			facility.SportName,
			reservation.TotalPrice,
		)

		// Combine address and city for location
		location := fmt.Sprintf("%s, %s", facility.Address, facility.City)

		eventID, err := s.googleCalendarService.CreateEvent(
			accessToken,
			refreshToken,
			tokenExpiry,
			facility.Name,
			description,
			location,
			reservation.StartTime,
			reservation.EndTime,
		)

		if err != nil {
			// Failed to create calendar event, but don't fail the reservation
			log.Printf("[CALENDAR] Failed to create calendar event for reservation %d: %v", reservation.ID, err)
			return
		}

		log.Printf("[CALENDAR] Calendar event created with ID: %s for reservation %d", eventID, reservation.ID)

		// Update reservation with calendar event ID
		updateErr := s.repo.UpdateReservationCalendarEventID(reservation.ID, eventID)
		if updateErr != nil {
			log.Printf("[CALENDAR] Failed to update reservation with calendar event ID: %v", updateErr)
		}
	}()
}

// calculatePrice calculates the total price for a reservation
func (s *ReservationService) calculatePrice(facilityID int64, startTime, endTime time.Time) (float64, error) {
	pricings, err := s.repo.GetFacilityPricing(facilityID)
	if err != nil {
		return 0, err
	}

	duration := endTime.Sub(startTime)
	hours := duration.Hours()

	dayType := model.DayTypeWeekday
	weekday := startTime.Weekday()
	if weekday == time.Saturday || weekday == time.Sunday {
		dayType = model.DayTypeWeekend
	}

	// Find the pricing for the start time
	price := s.findPricing(startTime, dayType, pricings)

	return price * hours, nil
}

// GetUserReservations retrieves all reservations for a user
func (s *ReservationService) GetUserReservations(userID int64) ([]model.FacilityReservation, error) {
	return s.repo.GetUserReservations(userID)
}

// GetUpcomingConfirmedReservations retrieves upcoming confirmed reservations for a user
func (s *ReservationService) GetUpcomingConfirmedReservations(userID int64) ([]dto.ReservationWithFacilityDTO, error) {
	return s.repo.GetUpcomingConfirmedReservationsWithDetails(userID)
}

// GetPendingReservationsCount retrieves the count of pending reservations for a user
func (s *ReservationService) GetPendingReservationsCount(userID int64) (int, error) {
	return s.repo.GetPendingReservationsCount(userID)
}

// CancelReservation cancels a reservation
func (s *ReservationService) CancelReservation(reservationID, userID int64) error {
	// Cancel reservation and get details
	reservation, err := s.repo.CancelReservation(reservationID, userID)
	if err != nil {
		return err
	}

	// Try to delete Google Calendar event if it exists
	if reservation.GoogleCalendarEventID != nil && *reservation.GoogleCalendarEventID != "" {
		s.deleteCalendarEventForReservation(reservation)
	}

	return nil
}

// deleteCalendarEventForReservation deletes a Google Calendar event for a reservation asynchronously
func (s *ReservationService) deleteCalendarEventForReservation(reservation *model.FacilityReservation) {
	// Run calendar event deletion in a goroutine to avoid blocking
	go func() {
		// Check if user has Google auth
		hasGoogle, err := s.userService.HasAuthIdentity(reservation.UserID, "google")
		if err != nil || !hasGoogle {
			log.Printf("[CALENDAR] User %d does not have Google auth", reservation.UserID)
			return
		}

		// Get Google tokens
		accessToken, refreshToken, tokenExpiry, err := s.userService.GetGoogleTokens(reservation.UserID)
		if err != nil || accessToken == "" {
			log.Printf("[CALENDAR] Failed to get Google tokens for user %d: %v", reservation.UserID, err)
			return
		}

		// Delete calendar event
		err = s.googleCalendarService.DeleteEvent(
			accessToken,
			refreshToken,
			tokenExpiry,
			*reservation.GoogleCalendarEventID,
		)
		if err != nil {
			log.Printf("[CALENDAR] Failed to delete calendar event %s: %v", *reservation.GoogleCalendarEventID, err)
		} else {
			log.Printf("[CALENDAR] Successfully deleted calendar event %s", *reservation.GoogleCalendarEventID)
		}
	}()
}

// parseTimeOfDay parses a time string in "HH:MM:SS" or "HH:MM" format to time.Time
func parseTimeOfDay(timeStr string) (time.Time, error) {
	// Try parsing as "HH:MM:SS"
	t, err := time.Parse("15:04:05", timeStr)
	if err != nil {
		// Try parsing as "HH:MM"
		t, err = time.Parse("15:04", timeStr)
		if err != nil {
			return time.Time{}, fmt.Errorf("invalid time format: %s", timeStr)
		}
	}
	return t, nil
}

// GetFacilityBookings retrieves all bookings for a facility within a date range
func (s *ReservationService) GetFacilityBookings(facilityID int64, startDate, endDate time.Time) ([]dto.ReservationWithFacilityDTO, error) {
	return s.repo.GetFacilityBookingsWithUserDetails(facilityID, startDate, endDate)
}
