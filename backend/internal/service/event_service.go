package service

import (
	"errors"
	"time"

	"github.com/Radi03825/PlaySpot/internal/dto"
	"github.com/Radi03825/PlaySpot/internal/model"
	"github.com/Radi03825/PlaySpot/internal/repository"
)

type EventService struct {
	eventRepo *repository.EventRepository
}

func NewEventService(eventRepo *repository.EventRepository) *EventService {
	return &EventService{
		eventRepo: eventRepo,
	}
}

// CreateEvent creates a new event
func (s *EventService) CreateEvent(createDTO *dto.CreateEventDTO, organizerID int64) (*model.Event, error) {
	// Validate required fields
	if createDTO.Title == "" {
		return nil, errors.New("title is required")
	}

	if createDTO.SportID == 0 {
		return nil, errors.New("sport_id is required")
	}

	if createDTO.MaxParticipants < 2 {
		return nil, errors.New("max_participants must be at least 2")
	}

	// Validate location type
	if createDTO.LocationType != "booking" && createDTO.LocationType != "external" {
		return nil, errors.New("location_type must be either 'booking' or 'external'")
	}

	var startTime, endTime time.Time
	var facilityID *int64
	var address *string

	if createDTO.LocationType == "booking" {
		// For booking-based events
		if createDTO.RelatedBookingID == nil {
			return nil, errors.New("related_booking_id is required when location_type is 'booking'")
		}
		if createDTO.StartTime == nil || createDTO.EndTime == nil {
			return nil, errors.New("start_time and end_time are required")
		}
		startTime = *createDTO.StartTime
		endTime = *createDTO.EndTime
	} else {
		// For external location events
		if createDTO.Address == nil || *createDTO.Address == "" {
			return nil, errors.New("address is required when location_type is 'external'")
		}
		if createDTO.StartTime == nil || createDTO.EndTime == nil {
			return nil, errors.New("start_time and end_time are required when location_type is 'external'")
		}
		startTime = *createDTO.StartTime
		endTime = *createDTO.EndTime
		address = createDTO.Address
	}

	// Validate times
	if endTime.Before(startTime) {
		return nil, errors.New("end time must be after start time")
	}

	if startTime.Before(time.Now()) {
		return nil, errors.New("cannot create event in the past")
	}

	event := &model.Event{
		Title:            createDTO.Title,
		Description:      createDTO.Description,
		SportID:          createDTO.SportID,
		StartTime:        startTime,
		EndTime:          endTime,
		MaxParticipants:  createDTO.MaxParticipants,
		Status:           "UPCOMING",
		OrganizerID:      organizerID,
		FacilityID:       facilityID,
		Address:          address,
		RelatedBookingID: createDTO.RelatedBookingID,
	}

	err := s.eventRepo.CreateEvent(event)
	if err != nil {
		return nil, err
	}

	return event, nil
}

// GetEventByID retrieves an event by ID
func (s *EventService) GetEventByID(eventID int64, userID *int64) (*model.Event, error) {
	event, err := s.eventRepo.GetEventByID(eventID, userID)
	if err != nil {
		return nil, err
	}

	return event, nil
}

// GetAllEvents retrieves all events with optional filters
func (s *EventService) GetAllEvents(status *string, sportID *int64, userID *int64) ([]model.Event, error) {
	return s.eventRepo.GetAllEvents(status, sportID, userID)
}

// UpdateEvent updates an event
func (s *EventService) UpdateEvent(eventID int64, updateDTO *dto.UpdateEventDTO, userID int64) error {
	// Get existing event to verify ownership
	event, err := s.eventRepo.GetEventByID(eventID, nil)
	if err != nil {
		return err
	}

	if event.OrganizerID != userID {
		return errors.New("only the organizer can update the event")
	}

	updates := make(map[string]interface{})

	if updateDTO.Title != nil {
		if *updateDTO.Title == "" {
			return errors.New("title cannot be empty")
		}
		updates["title"] = *updateDTO.Title
	}
	if updateDTO.Description != nil {
		updates["description"] = *updateDTO.Description
	}
	if updateDTO.SportID != nil {
		if *updateDTO.SportID == 0 {
			return errors.New("sport_id cannot be zero")
		}
		updates["sport_id"] = *updateDTO.SportID
	}
	if updateDTO.StartTime != nil {
		if updateDTO.StartTime.Before(time.Now()) {
			return errors.New("cannot set start time in the past")
		}
		updates["start_time"] = *updateDTO.StartTime
	}
	if updateDTO.EndTime != nil {
		updates["end_time"] = *updateDTO.EndTime
	}
	if updateDTO.MaxParticipants != nil {
		if *updateDTO.MaxParticipants < 2 {
			return errors.New("max_participants must be at least 2")
		}
		// Check if reducing max participants below current count
		count, err := s.eventRepo.GetParticipantCount(eventID)
		if err != nil {
			return err
		}
		if *updateDTO.MaxParticipants < count {
			return errors.New("cannot reduce max participants below current participant count")
		}
		updates["max_participants"] = *updateDTO.MaxParticipants
	}
	if updateDTO.Status != nil {
		// Validate status values
		validStatuses := map[string]bool{"UPCOMING": true, "FULL": true, "CANCELED": true, "COMPLETED": true}
		if !validStatuses[*updateDTO.Status] {
			return errors.New("invalid status value")
		}
		updates["status"] = *updateDTO.Status
	}
	if updateDTO.FacilityID != nil {
		updates["facility_id"] = *updateDTO.FacilityID
	}
	if updateDTO.Address != nil {
		updates["address"] = *updateDTO.Address
	}

	if len(updates) == 0 {
		return errors.New("no fields to update")
	}

	return s.eventRepo.UpdateEvent(eventID, updates)
}

// DeleteEvent deletes an event
func (s *EventService) DeleteEvent(eventID int64, userID int64) error {
	// Get existing event to verify ownership
	event, err := s.eventRepo.GetEventByID(eventID, nil)
	if err != nil {
		return err
	}

	if event.OrganizerID != userID {
		return errors.New("only the organizer can delete the event")
	}

	return s.eventRepo.DeleteEvent(eventID)
}

// JoinEvent adds a user to an event
func (s *EventService) JoinEvent(eventID int64, userID int64) error {
	event, err := s.eventRepo.GetEventByID(eventID, &userID)
	if err != nil {
		return err
	}

	// Check if event is full or not available
	if event.Status != "UPCOMING" {
		return errors.New("cannot join event with status: " + event.Status)
	}

	// Check if already joined
	if event.IsUserJoined {
		return errors.New("already joined this event")
	}

	// Check if event is full
	count, err := s.eventRepo.GetParticipantCount(eventID)
	if err != nil {
		return err
	}

	if count >= event.MaxParticipants {
		// Update event status to FULL
		s.eventRepo.UpdateEvent(eventID, map[string]interface{}{"status": "FULL"})
		return errors.New("event is full")
	}

	// Join the event
	err = s.eventRepo.JoinEvent(eventID, userID)
	if err != nil {
		return err
	}

	// Check if event is now full and update status
	newCount := count + 1
	if newCount >= event.MaxParticipants {
		s.eventRepo.UpdateEvent(eventID, map[string]interface{}{"status": "FULL"})
	}

	return nil
}

// LeaveEvent removes a user from an event
func (s *EventService) LeaveEvent(eventID int64, userID int64) error {
	event, err := s.eventRepo.GetEventByID(eventID, &userID)
	if err != nil {
		return err
	}

	// Check if user has joined
	if !event.IsUserJoined {
		return errors.New("you have not joined this event")
	}

	// Leave the event
	err = s.eventRepo.LeaveEvent(eventID, userID)
	if err != nil {
		return err
	}

	// If event was FULL, update status back to UPCOMING
	if event.Status == "FULL" {
		s.eventRepo.UpdateEvent(eventID, map[string]interface{}{"status": "UPCOMING"})
	}

	return nil
}

// GetEventParticipants retrieves all participants of an event
func (s *EventService) GetEventParticipants(eventID int64) ([]model.EventParticipant, error) {
	return s.eventRepo.GetEventParticipants(eventID)
}

// GetUserEvents retrieves all events created by a user
func (s *EventService) GetUserEvents(userID int64) ([]model.Event, error) {
	return s.eventRepo.GetUserEvents(userID)
}

// GetUserJoinedEvents retrieves all events a user has joined
func (s *EventService) GetUserJoinedEvents(userID int64) ([]model.Event, error) {
	return s.eventRepo.GetUserJoinedEvents(userID)
}
