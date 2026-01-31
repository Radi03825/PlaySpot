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
	
	// Validate times
	if createDTO.EndTime.Before(createDTO.StartTime) {
		return nil, errors.New("end time must be after start time")
	}
	
	if createDTO.StartTime.Before(time.Now()) {
		return nil, errors.New("cannot create event in the past")
	}
	
	// Validate location
	if createDTO.FacilityID == nil && createDTO.Address == nil {
		return nil, errors.New("either facility_id or address must be provided")
	}
	
	event := &model.Event{
		Title:            createDTO.Title,
		Description:      createDTO.Description,
		SportID:          createDTO.SportID,
		StartTime:        createDTO.StartTime,
		EndTime:          createDTO.EndTime,
		MaxParticipants:  createDTO.MaxParticipants,
		Status:           "UPCOMING",
		OrganizerID:      organizerID,
		FacilityID:       createDTO.FacilityID,
		Address:          createDTO.Address,
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
