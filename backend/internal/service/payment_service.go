package service

import (
	"fmt"

	"github.com/Radi03825/PlaySpot/internal/dto"
	"github.com/Radi03825/PlaySpot/internal/model"
	"github.com/Radi03825/PlaySpot/internal/repository"
)

type PaymentService struct {
	paymentRepo           *repository.PaymentRepository
	reservationRepo       *repository.ReservationRepository
	facilityService       *FacilityService
	emailService          *EmailService
	googleCalendarService *GoogleCalendarService
	userService           *UserService
}

func NewPaymentService(
	paymentRepo *repository.PaymentRepository,
	reservationRepo *repository.ReservationRepository,
	facilityService *FacilityService,
	emailService *EmailService,
	googleCalendarService *GoogleCalendarService,
	userService *UserService,
) *PaymentService {
	return &PaymentService{
		paymentRepo:           paymentRepo,
		reservationRepo:       reservationRepo,
		facilityService:       facilityService,
		emailService:          emailService,
		googleCalendarService: googleCalendarService,
		userService:           userService,
	}
}

// GetPaymentByReservationID retrieves a payment by reservation ID
func (s *PaymentService) GetPaymentByReservationID(reservationID int64) (*model.Payment, error) {
	return s.paymentRepo.GetPaymentByReservationID(reservationID)
}

// ProcessPayment processes a payment and creates calendar event & sends email
func (s *PaymentService) ProcessPayment(reservationID, userID int64, req dto.ProcessPaymentDTO) (*model.Payment, error) {
	// Validate payment method
	if req.PaymentMethod != "on_place" && req.PaymentMethod != "card" {
		return nil, fmt.Errorf("invalid payment method. Must be 'on_place' or 'card'")
	}

	// Get or create payment
	payment, err := s.paymentRepo.GetPaymentByReservationID(reservationID)
	if err != nil {
		return nil, fmt.Errorf("failed to get payment: %w", err)
	}

	// Get reservation details
	reservation, err := s.reservationRepo.GetReservationByID(reservationID)
	if err != nil {
		return nil, fmt.Errorf("failed to get reservation: %w", err)
	}

	// Verify reservation belongs to user
	if reservation.UserID != userID {
		return nil, fmt.Errorf("unauthorized: reservation does not belong to user")
	}

	// Check if reservation is already cancelled
	if reservation.Status == "cancelled" {
		return nil, fmt.Errorf("cannot pay for cancelled reservation")
	}

	// If no payment exists, create one
	if payment == nil {
		payment, err = s.paymentRepo.CreatePayment(userID, reservationID, reservation.TotalPrice, "EUR")
		if err != nil {
			return nil, fmt.Errorf("failed to create payment: %w", err)
		}
	}

	// Check if already paid
	if payment.PaymentStatus == "completed" {
		return payment, nil // Already paid, return existing payment
	}

	// Process the payment
	err = s.paymentRepo.ProcessPayment(payment.ID, req.PaymentMethod)
	if err != nil {
		return nil, fmt.Errorf("failed to process payment: %w", err)
	}

	// Update reservation status to confirmed
	err = s.reservationRepo.UpdateReservationStatus(reservationID, "confirmed")
	if err != nil {
		fmt.Printf("Warning: Failed to update reservation status: %v\n", err)
	}

	// Get updated payment
	payment, err = s.paymentRepo.GetPaymentByID(payment.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get updated payment: %w", err)
	}

	// Create Google Calendar event
	s.createCalendarEventForReservation(reservation)

	// Send confirmation email
	s.sendPaymentConfirmationEmail(reservation, payment)

	return payment, nil
}

// createCalendarEventForReservation creates a Google Calendar event for a reservation
func (s *PaymentService) createCalendarEventForReservation(reservation *model.FacilityReservation) {
	// Get Google tokens
	accessToken, refreshToken, tokenExpiry, err := s.userService.GetGoogleTokens(reservation.UserID)
	if err != nil {
		fmt.Printf("No Google tokens for user %d: %v\n", reservation.UserID, err)
		return
	}

	if accessToken == "" || refreshToken == "" {
		fmt.Printf("User %d has no calendar tokens\n", reservation.UserID)
		return
	}

	fmt.Printf("Creating calendar event for user %d, reservation %d\n", reservation.UserID, reservation.ID)

	// Get facility details
	facility, err := s.facilityService.GetFacilityDetailsByID(reservation.FacilityID)
	if err != nil {
		fmt.Printf("Failed to get facility %d: %v\n", reservation.FacilityID, err)
		return
	}
	// Create calendar event
	description := fmt.Sprintf(
		"Facility: %s\nCategory: %s\nSport: %s\nAddress: %s, %s\nPrice: €%.2f\n\nBooking confirmed via PlaySpot",
		facility.Name,
		facility.CategoryName,
		facility.SportName,
		facility.Address,
		facility.City,
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
		fmt.Printf("Failed to create calendar event for reservation %d: %v\n", reservation.ID, err)
		return
	}

	fmt.Printf("Calendar event created with ID: %s for reservation %d\n", eventID, reservation.ID)

	// Update reservation with calendar event ID
	updateErr := s.reservationRepo.UpdateReservationCalendarEventID(reservation.ID, eventID)
	if updateErr != nil {
		fmt.Printf("Failed to update reservation with calendar event ID: %v\n", updateErr)
	}
}

// sendPaymentConfirmationEmail sends a confirmation email after successful payment
func (s *PaymentService) sendPaymentConfirmationEmail(reservation *model.FacilityReservation, payment *model.Payment) {
	// Get user details
	user, err := s.userService.GetUserByID(reservation.UserID)
	if err != nil {
		fmt.Printf("Failed to get user %d: %v\n", reservation.UserID, err)
		return
	}

	// Get facility details
	facility, err := s.facilityService.GetFacilityDetailsByID(reservation.FacilityID)
	if err != nil {
		fmt.Printf("Failed to get facility %d: %v\n", reservation.FacilityID, err)
		return
	}

	// Send email
	err = s.emailService.SendPaymentConfirmationEmail(
		user.Email,
		user.Name,
		facility.Name,
		facility.Address,
		facility.City,
		facility.CategoryName,
		facility.SportName,
		reservation.StartTime,
		reservation.EndTime,
		payment.Amount,
		payment.PaymentMethod,
	)

	if err != nil {
		fmt.Printf("Failed to send confirmation email: %v\n", err)
	}
}
