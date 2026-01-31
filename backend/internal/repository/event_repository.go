package repository

import (
	"database/sql"
	"fmt"

	"github.com/Radi03825/PlaySpot/internal/model"
)

type EventRepository struct {
	db *sql.DB
}

func NewEventRepository(db *sql.DB) *EventRepository {
	return &EventRepository{db: db}
}

// CreateEvent creates a new event
func (r *EventRepository) CreateEvent(event *model.Event) error {
	query := `
		INSERT INTO events (title, description, sport_id, start_time, end_time, max_participants, 
							status, organizer_id, facility_id, address, related_booking_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query,
		event.Title,
		event.Description,
		event.SportID,
		event.StartTime,
		event.EndTime,
		event.MaxParticipants,
		event.Status,
		event.OrganizerID,
		event.FacilityID,
		event.Address,
		event.RelatedBookingID,
	).Scan(&event.ID, &event.CreatedAt, &event.UpdatedAt)
}

// GetEventByID retrieves an event by ID with optional user context
func (r *EventRepository) GetEventByID(eventID int64, userID *int64) (*model.Event, error) {
	query := `
		SELECT e.id, e.title, e.description, e.sport_id, e.start_time, e.end_time, 
			   e.max_participants, e.status, e.organizer_id, e.facility_id, e.address, 
			   e.related_booking_id, e.created_at, e.updated_at,
			   u.id, u.name, u.email,
			   s.id, s.name,
			   COALESCE((SELECT COUNT(*) FROM event_participants 
						WHERE event_id = e.id AND status = 'JOINED'), 0) as current_participants
		FROM events e
		LEFT JOIN users u ON e.organizer_id = u.id
		LEFT JOIN sports s ON e.sport_id = s.id
		WHERE e.id = $1
	`
	
	event := &model.Event{
		Organizer: &model.User{},
		Sport:     &model.Sport{},
	}
	
	err := r.db.QueryRow(query, eventID).Scan(
		&event.ID,
		&event.Title,
		&event.Description,
		&event.SportID,
		&event.StartTime,
		&event.EndTime,
		&event.MaxParticipants,
		&event.Status,
		&event.OrganizerID,
		&event.FacilityID,
		&event.Address,
		&event.RelatedBookingID,
		&event.CreatedAt,
		&event.UpdatedAt,
		&event.Organizer.ID,
		&event.Organizer.Name,
		&event.Organizer.Email,
		&event.Sport.ID,
		&event.Sport.Name,
		&event.CurrentParticipants,
	)
	
	if err != nil {
		return nil, err
	}
	
	// Check if user has joined
	if userID != nil {
		event.IsUserJoined = r.IsUserJoined(eventID, *userID)
	}
	
	// Get facility if exists
	if event.FacilityID != nil {
		facility, err := r.getFacilityBasicInfo(*event.FacilityID)
		if err == nil {
			event.Facility = facility
		}
	}
	
	return event, nil
}

// GetAllEvents retrieves all events with filters
func (r *EventRepository) GetAllEvents(status *string, sportID *int64, userID *int64) ([]model.Event, error) {
	query := `
		SELECT e.id, e.title, e.description, e.sport_id, e.start_time, e.end_time, 
			   e.max_participants, e.status, e.organizer_id, e.facility_id, e.address, 
			   e.related_booking_id, e.created_at, e.updated_at,
			   u.id, u.name, u.email,
			   s.id, s.name,
			   COALESCE((SELECT COUNT(*) FROM event_participants 
						WHERE event_id = e.id AND status = 'JOINED'), 0) as current_participants
		FROM events e
		LEFT JOIN users u ON e.organizer_id = u.id
		LEFT JOIN sports s ON e.sport_id = s.id
		WHERE 1=1
	`
	
	args := []interface{}{}
	argIndex := 1
	
	if status != nil {
		query += fmt.Sprintf(" AND e.status = $%d", argIndex)
		args = append(args, *status)
		argIndex++
	}
	
	if sportID != nil {
		query += fmt.Sprintf(" AND e.sport_id = $%d", argIndex)
		args = append(args, *sportID)
		argIndex++
	}
	
	query += " ORDER BY e.start_time ASC"
	
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var events []model.Event
	for rows.Next() {
		event := model.Event{
			Organizer: &model.User{},
			Sport:     &model.Sport{},
		}
		
		err := rows.Scan(
			&event.ID,
			&event.Title,
			&event.Description,
			&event.SportID,
			&event.StartTime,
			&event.EndTime,
			&event.MaxParticipants,
			&event.Status,
			&event.OrganizerID,
			&event.FacilityID,
			&event.Address,
			&event.RelatedBookingID,
			&event.CreatedAt,
			&event.UpdatedAt,
			&event.Organizer.ID,
			&event.Organizer.Name,
			&event.Organizer.Email,
			&event.Sport.ID,
			&event.Sport.Name,
			&event.CurrentParticipants,
		)
		
		if err != nil {
			return nil, err
		}
		
		// Check if user has joined
		if userID != nil {
			event.IsUserJoined = r.IsUserJoined(event.ID, *userID)
		}
		
		events = append(events, event)
	}
	
	return events, nil
}

// UpdateEvent updates an event
func (r *EventRepository) UpdateEvent(eventID int64, updates map[string]interface{}) error {
	query := "UPDATE events SET updated_at = NOW()"
	args := []interface{}{}
	argIndex := 1
	
	for key, value := range updates {
		query += fmt.Sprintf(", %s = $%d", key, argIndex)
		args = append(args, value)
		argIndex++
	}
	
	query += fmt.Sprintf(" WHERE id = $%d", argIndex)
	args = append(args, eventID)
	
	_, err := r.db.Exec(query, args...)
	return err
}

// DeleteEvent deletes an event
func (r *EventRepository) DeleteEvent(eventID int64) error {
	query := "DELETE FROM events WHERE id = $1"
	_, err := r.db.Exec(query, eventID)
	return err
}

// JoinEvent adds a user to an event
func (r *EventRepository) JoinEvent(eventID, userID int64) error {
	query := `
		INSERT INTO event_participants (event_id, user_id, status)
		VALUES ($1, $2, 'JOINED')
		ON CONFLICT (event_id, user_id) 
		DO UPDATE SET status = 'JOINED', joined_at = NOW()
	`
	_, err := r.db.Exec(query, eventID, userID)
	return err
}

// LeaveEvent removes a user from an event
func (r *EventRepository) LeaveEvent(eventID, userID int64) error {
	query := `
		UPDATE event_participants 
		SET status = 'LEFT' 
		WHERE event_id = $1 AND user_id = $2
	`
	_, err := r.db.Exec(query, eventID, userID)
	return err
}

// IsUserJoined checks if a user has joined an event
func (r *EventRepository) IsUserJoined(eventID, userID int64) bool {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM event_participants 
			WHERE event_id = $1 AND user_id = $2 AND status = 'JOINED'
		)
	`
	var exists bool
	r.db.QueryRow(query, eventID, userID).Scan(&exists)
	return exists
}

// GetEventParticipants retrieves all participants of an event
func (r *EventRepository) GetEventParticipants(eventID int64) ([]model.EventParticipant, error) {
	query := `
		SELECT ep.id, ep.event_id, ep.user_id, ep.joined_at, ep.status,
			   u.id, u.name, u.email
		FROM event_participants ep
		LEFT JOIN users u ON ep.user_id = u.id
		WHERE ep.event_id = $1 AND ep.status = 'JOINED'
		ORDER BY ep.joined_at ASC
	`
	
	rows, err := r.db.Query(query, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var participants []model.EventParticipant
	for rows.Next() {
		participant := model.EventParticipant{
			User: &model.User{},
		}
		
		err := rows.Scan(
			&participant.ID,
			&participant.EventID,
			&participant.UserID,
			&participant.JoinedAt,
			&participant.Status,
			&participant.User.ID,
			&participant.User.Name,
			&participant.User.Email,
		)
		
		if err != nil {
			return nil, err
		}
		
		participants = append(participants, participant)
	}
	
	return participants, nil
}

// GetParticipantCount returns the number of joined participants
func (r *EventRepository) GetParticipantCount(eventID int64) (int, error) {
	query := `
		SELECT COUNT(*) FROM event_participants 
		WHERE event_id = $1 AND status = 'JOINED'
	`
	var count int
	err := r.db.QueryRow(query, eventID).Scan(&count)
	return count, err
}

// GetUserEvents retrieves all events created by a user
func (r *EventRepository) GetUserEvents(userID int64) ([]model.Event, error) {
	query := `
		SELECT e.id, e.title, e.description, e.sport_id, e.start_time, e.end_time, 
			   e.max_participants, e.status, e.organizer_id, e.facility_id, e.address, 
			   e.related_booking_id, e.created_at, e.updated_at,
			   s.id, s.name,
			   COALESCE((SELECT COUNT(*) FROM event_participants 
						WHERE event_id = e.id AND status = 'JOINED'), 0) as current_participants
		FROM events e
		LEFT JOIN sports s ON e.sport_id = s.id
		WHERE e.organizer_id = $1
		ORDER BY e.start_time DESC
	`
	
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var events []model.Event
	for rows.Next() {
		event := model.Event{
			Sport: &model.Sport{},
		}
		
		err := rows.Scan(
			&event.ID,
			&event.Title,
			&event.Description,
			&event.SportID,
			&event.StartTime,
			&event.EndTime,
			&event.MaxParticipants,
			&event.Status,
			&event.OrganizerID,
			&event.FacilityID,
			&event.Address,
			&event.RelatedBookingID,
			&event.CreatedAt,
			&event.UpdatedAt,
			&event.Sport.ID,
			&event.Sport.Name,
			&event.CurrentParticipants,
		)
		
		if err != nil {
			return nil, err
		}
		
		events = append(events, event)
	}
	
	return events, nil
}

// GetUserJoinedEvents retrieves all events a user has joined
func (r *EventRepository) GetUserJoinedEvents(userID int64) ([]model.Event, error) {
	query := `
		SELECT e.id, e.title, e.description, e.sport_id, e.start_time, e.end_time, 
			   e.max_participants, e.status, e.organizer_id, e.facility_id, e.address, 
			   e.related_booking_id, e.created_at, e.updated_at,
			   u.id, u.name, u.email,
			   s.id, s.name,
			   COALESCE((SELECT COUNT(*) FROM event_participants 
						WHERE event_id = e.id AND status = 'JOINED'), 0) as current_participants
		FROM events e
		INNER JOIN event_participants ep ON e.id = ep.event_id
		LEFT JOIN users u ON e.organizer_id = u.id
		LEFT JOIN sports s ON e.sport_id = s.id
		WHERE ep.user_id = $1 AND ep.status = 'JOINED'
		ORDER BY e.start_time ASC
	`
	
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var events []model.Event
	for rows.Next() {
		event := model.Event{
			Organizer: &model.User{},
			Sport:     &model.Sport{},
		}
		
		err := rows.Scan(
			&event.ID,
			&event.Title,
			&event.Description,
			&event.SportID,
			&event.StartTime,
			&event.EndTime,
			&event.MaxParticipants,
			&event.Status,
			&event.OrganizerID,
			&event.FacilityID,
			&event.Address,
			&event.RelatedBookingID,
			&event.CreatedAt,
			&event.UpdatedAt,
			&event.Organizer.ID,
			&event.Organizer.Name,
			&event.Organizer.Email,
			&event.Sport.ID,
			&event.Sport.Name,
			&event.CurrentParticipants,
		)
		
		if err != nil {
			return nil, err
		}
		
		event.IsUserJoined = true
		events = append(events, event)
	}
	
	return events, nil
}

// Helper function to get basic facility info
func (r *EventRepository) getFacilityBasicInfo(facilityID int64) (*model.Facility, error) {
	query := `
		SELECT id, name, city, address
		FROM facilities
		WHERE id = $1
	`
	
	facility := &model.Facility{}
	err := r.db.QueryRow(query, facilityID).Scan(
		&facility.ID,
		&facility.Name,
		&facility.City,
		&facility.Address,
	)
	
	if err != nil {
		return nil, err
	}
	
	return facility, nil
}
