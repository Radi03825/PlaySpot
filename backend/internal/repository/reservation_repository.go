package repository

import (
	"database/sql"
	"time"

	"github.com/Radi03825/PlaySpot/internal/model"
)

type ReservationRepository struct {
	db *sql.DB
}

func NewReservationRepository(db *sql.DB) *ReservationRepository {
	return &ReservationRepository{db: db}
}

// GetFacilitySchedules retrieves all schedules for a facility
func (r *ReservationRepository) GetFacilitySchedules(facilityID int64) ([]model.FacilitySchedule, error) {
	query := `
		SELECT id, facility_id, open_time::text, close_time::text, day_type
		FROM facility_schedules
		WHERE facility_id = $1
		ORDER BY day_type
	`
	rows, err := r.db.Query(query, facilityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schedules []model.FacilitySchedule
	for rows.Next() {
		var schedule model.FacilitySchedule
		err := rows.Scan(&schedule.ID, &schedule.FacilityID, &schedule.OpenTime, &schedule.CloseTime, &schedule.DayType)
		if err != nil {
			return nil, err
		}
		schedules = append(schedules, schedule)
	}

	return schedules, nil
}

// GetFacilityPricing retrieves all pricing for a facility
func (r *ReservationRepository) GetFacilityPricing(facilityID int64) ([]model.FacilityPricing, error) {
	query := `
		SELECT id, facility_id, day_type, start_hour::text, end_hour::text, price_per_hour
		FROM facility_pricings
		WHERE facility_id = $1
		ORDER BY day_type, start_hour
	`
	rows, err := r.db.Query(query, facilityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pricings []model.FacilityPricing
	for rows.Next() {
		var pricing model.FacilityPricing
		err := rows.Scan(&pricing.ID, &pricing.FacilityID, &pricing.DayType, &pricing.StartHour, &pricing.EndHour, &pricing.PricePerHour)
		if err != nil {
			return nil, err
		}
		pricings = append(pricings, pricing)
	}

	return pricings, nil
}

// GetReservationsByFacilityAndDateRange retrieves reservations for a facility in a date range
func (r *ReservationRepository) GetReservationsByFacilityAndDateRange(facilityID int64, startDate, endDate time.Time) ([]model.FacilityReservation, error) {
	query := `
		SELECT id, user_id, facility_id, start_time, end_time, status, total_price, created_at
		FROM facility_reservations
		WHERE facility_id = $1 
		AND start_time >= $2 
		AND end_time <= $3
		AND status != 'cancelled'
		ORDER BY start_time
	`
	rows, err := r.db.Query(query, facilityID, startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reservations []model.FacilityReservation
	for rows.Next() {
		var reservation model.FacilityReservation
		err := rows.Scan(&reservation.ID, &reservation.UserID, &reservation.FacilityID,
			&reservation.StartTime, &reservation.EndTime, &reservation.Status,
			&reservation.TotalPrice, &reservation.CreatedAt)
		if err != nil {
			return nil, err
		}
		reservations = append(reservations, reservation)
	}

	return reservations, nil
}

// CreateReservation creates a new reservation
func (r *ReservationRepository) CreateReservation(userID, facilityID int64, startTime, endTime time.Time, totalPrice float64) (*model.FacilityReservation, error) {
	query := `
		INSERT INTO facility_reservations (user_id, facility_id, start_time, end_time, status, total_price, created_at)
		VALUES ($1, $2, $3, $4, 'confirmed', $5, NOW())
		RETURNING id, user_id, facility_id, start_time, end_time, status, total_price, created_at
	`
	var reservation model.FacilityReservation
	err := r.db.QueryRow(query, userID, facilityID, startTime, endTime, totalPrice).Scan(
		&reservation.ID, &reservation.UserID, &reservation.FacilityID,
		&reservation.StartTime, &reservation.EndTime, &reservation.Status,
		&reservation.TotalPrice, &reservation.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &reservation, nil
}

// CheckReservationConflict checks if there's a conflicting reservation
func (r *ReservationRepository) CheckReservationConflict(facilityID int64, startTime, endTime time.Time) (bool, error) {
	query := `
		SELECT COUNT(*) 
		FROM facility_reservations
		WHERE facility_id = $1 
		AND status != 'cancelled'
		AND (
			(start_time <= $2 AND end_time > $2) OR
			(start_time < $3 AND end_time >= $3) OR
			(start_time >= $2 AND end_time <= $3)
		)
	`
	var count int
	err := r.db.QueryRow(query, facilityID, startTime, endTime).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// GetUserReservations retrieves all reservations for a user
func (r *ReservationRepository) GetUserReservations(userID int64) ([]model.FacilityReservation, error) {
	query := `
		SELECT id, user_id, facility_id, start_time, end_time, status, total_price, created_at, google_calendar_event_id
		FROM facility_reservations
		WHERE user_id = $1
		ORDER BY start_time DESC
	`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reservations []model.FacilityReservation
	for rows.Next() {
		var reservation model.FacilityReservation
		var eventID sql.NullString
		err := rows.Scan(&reservation.ID, &reservation.UserID, &reservation.FacilityID,
			&reservation.StartTime, &reservation.EndTime, &reservation.Status,
			&reservation.TotalPrice, &reservation.CreatedAt, &eventID)
		if err != nil {
			return nil, err
		}
		if eventID.Valid {
			reservation.GoogleCalendarEventID = &eventID.String
		}
		reservations = append(reservations, reservation)
	}

	return reservations, nil
}

// CancelReservation cancels a reservation and returns it
func (r *ReservationRepository) CancelReservation(reservationID, userID int64) (*model.FacilityReservation, error) {
	query := `
		UPDATE facility_reservations
		SET status = 'cancelled'
		WHERE id = $1 AND user_id = $2 AND status != 'cancelled'
		RETURNING id, user_id, facility_id, start_time, end_time, status, total_price, created_at, google_calendar_event_id
	`
	var reservation model.FacilityReservation
	var eventID sql.NullString
	err := r.db.QueryRow(query, reservationID, userID).Scan(
		&reservation.ID, &reservation.UserID, &reservation.FacilityID,
		&reservation.StartTime, &reservation.EndTime, &reservation.Status,
		&reservation.TotalPrice, &reservation.CreatedAt, &eventID,
	)
	if err != nil {
		return nil, err
	}
	if eventID.Valid {
		reservation.GoogleCalendarEventID = &eventID.String
	}

	return &reservation, nil
}

// UpdateReservationCalendarEventID updates the Google Calendar event ID for a reservation
func (r *ReservationRepository) UpdateReservationCalendarEventID(reservationID int64, eventID string) error {
	query := `
		UPDATE facility_reservations
		SET google_calendar_event_id = $1
		WHERE id = $2
	`
	_, err := r.db.Exec(query, eventID, reservationID)
	return err
}

// GetReservationByID retrieves a reservation by its ID
func (r *ReservationRepository) GetReservationByID(reservationID int64) (*model.FacilityReservation, error) {
	query := `
		SELECT id, user_id, facility_id, start_time, end_time, status, total_price, created_at, google_calendar_event_id
		FROM facility_reservations
		WHERE id = $1
	`
	var reservation model.FacilityReservation
	var eventID sql.NullString
	err := r.db.QueryRow(query, reservationID).Scan(
		&reservation.ID, &reservation.UserID, &reservation.FacilityID,
		&reservation.StartTime, &reservation.EndTime, &reservation.Status,
		&reservation.TotalPrice, &reservation.CreatedAt, &eventID,
	)
	if err != nil {
		return nil, err
	}
	if eventID.Valid {
		reservation.GoogleCalendarEventID = &eventID.String
	}

	return &reservation, nil
}
