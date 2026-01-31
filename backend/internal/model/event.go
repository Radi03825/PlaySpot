package model

import "time"

type Event struct {
	ID               int64     `json:"id"`
	Title            string    `json:"title"`
	Description      *string   `json:"description"`
	SportID          int64     `json:"sport_id"`
	StartTime        time.Time `json:"start_time"`
	EndTime          time.Time `json:"end_time"`
	MaxParticipants  int       `json:"max_participants"`
	Status           string    `json:"status"` // UPCOMING, FULL, CANCELED, COMPLETED
	OrganizerID      int64     `json:"organizer_id"`
	FacilityID       *int64    `json:"facility_id"`
	Address          *string   `json:"address"`
	RelatedBookingID *int64    `json:"related_booking_id"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	
	// Joined data
	Organizer        *User     `json:"organizer,omitempty"`
	Sport            *Sport    `json:"sport,omitempty"`
	Facility         *Facility `json:"facility,omitempty"`
	CurrentParticipants int    `json:"current_participants"`
	IsUserJoined     bool      `json:"is_user_joined,omitempty"`
}

type EventParticipant struct {
	ID       int64     `json:"id"`
	EventID  int64     `json:"event_id"`
	UserID   int64     `json:"user_id"`
	JoinedAt time.Time `json:"joined_at"`
	Status   string    `json:"status"` // JOINED, LEFT, REMOVED
	
	// Joined data
	User     *User     `json:"user,omitempty"`
}
