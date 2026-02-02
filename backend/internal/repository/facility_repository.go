package repository

import (
	"database/sql"
	"fmt"

	"github.com/Radi03825/PlaySpot/internal/model"
)

type FacilityRepository struct {
	db *sql.DB
}

func NewFacilityRepository(db *sql.DB) *FacilityRepository {
	return &FacilityRepository{db: db}
}

func (r *FacilityRepository) CreateFacility(name string, sportComplexID *int64, categoryID, surfaceID, environmentID int64, city, address, description string, capacity int, managerID int64) (*model.Facility, error) {
	query := `
		INSERT INTO facilities (name, sport_complex_id, category_id, surface_id, environment_id, city, address, description, capacity, manager_id, is_verified, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, false)
		RETURNING id
	`
	var id int64
	err := r.db.QueryRow(query, name, sportComplexID, categoryID, surfaceID, environmentID, city, address, description, capacity, managerID).Scan(&id)
	if err != nil {
		return nil, err
	}

	return &model.Facility{
		ID:             id,
		Name:           name,
		SportComplexID: sportComplexID,
		CategoryID:     categoryID,
		SurfaceID:      surfaceID,
		EnvironmentID:  environmentID,
		City:           city,
		Address:        address,
		Description:    description,
		Capacity:       capacity,
		IsVerified:     false,
		IsActive:       false,
	}, nil
}

func (r *FacilityRepository) GetAllFacilities() ([]model.FacilityDetails, error) {
	query := `
		SELECT 
			f.id, f.name, f.sport_complex_id, f.category_id, f.surface_id, f.environment_id, 
			f.city, f.address, f.description, f.capacity, f.is_verified, f.is_active,
			c.name as category_name, s.name as surface_name, e.name as environment_name,
			sp.name as sport_name,
			COALESCE(sc.name, '') as sport_complex_name,
			f.manager_id
		FROM facilities f
		JOIN categories c ON f.category_id = c.id
		JOIN surfaces s ON f.surface_id = s.id
		JOIN environments e ON f.environment_id = e.id
		JOIN sports sp ON c.sport_id = sp.id
		LEFT JOIN sport_complexes sc ON f.sport_complex_id = sc.id
		WHERE f.is_verified = true AND f.is_active = true
		ORDER BY f.id DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var facilities []model.FacilityDetails
	for rows.Next() {
		var facility model.FacilityDetails
		err := rows.Scan(
			&facility.ID, &facility.Name, &facility.SportComplexID, &facility.CategoryID,
			&facility.SurfaceID, &facility.EnvironmentID, &facility.City, &facility.Address,
			&facility.Description, &facility.Capacity, &facility.IsVerified, &facility.IsActive,
			&facility.CategoryName, &facility.SurfaceName, &facility.EnvironmentName,
			&facility.SportName, &facility.SportComplexName, &facility.ManagerID,
		)
		if err != nil {
			return nil, err
		}
		facilities = append(facilities, facility)
	}

	return facilities, nil
}

func (r *FacilityRepository) SearchFacilities(params model.FacilitySearchParams) ([]model.FacilityDetails, error) {
	query := `
		SELECT 
			f.id, f.name, f.sport_complex_id, f.category_id, f.surface_id, f.environment_id, 
			f.city, f.address, f.description, f.capacity, f.is_verified, f.is_active,
			c.name as category_name, s.name as surface_name, e.name as environment_name,
			sp.name as sport_name,
			COALESCE(sc.name, '') as sport_complex_name,
			f.manager_id
		FROM facilities f
		JOIN categories c ON f.category_id = c.id
		JOIN surfaces s ON f.surface_id = s.id
		JOIN environments e ON f.environment_id = e.id
		JOIN sports sp ON c.sport_id = sp.id
		LEFT JOIN sport_complexes sc ON f.sport_complex_id = sc.id
		WHERE f.is_verified = true AND f.is_active = true
	`

	args := []interface{}{}
	argCount := 0

	// Add filters
	if params.City != "" {
		argCount++
		query += ` AND LOWER(f.city) = LOWER($` + fmt.Sprintf("%d", argCount) + `)`
		args = append(args, params.City)
	}

	if params.Sport != "" {
		argCount++
		query += ` AND LOWER(sp.name) = LOWER($` + fmt.Sprintf("%d", argCount) + `)`
		args = append(args, params.Sport)
	}

	if params.Surface != "" {
		argCount++
		query += ` AND LOWER(s.name) = LOWER($` + fmt.Sprintf("%d", argCount) + `)`
		args = append(args, params.Surface)
	}

	if params.Environment != "" {
		argCount++
		query += ` AND LOWER(e.name) = LOWER($` + fmt.Sprintf("%d", argCount) + `)`
		args = append(args, params.Environment)
	}

	if params.MinCapacity > 0 {
		argCount++
		query += ` AND f.capacity >= $` + fmt.Sprintf("%d", argCount)
		args = append(args, params.MinCapacity)
	}

	if params.MaxCapacity > 0 {
		argCount++
		query += ` AND f.capacity <= $` + fmt.Sprintf("%d", argCount)
		args = append(args, params.MaxCapacity)
	}

	// Add sorting
	orderBy := "f.id DESC"
	if params.SortBy != "" {
		sortOrder := "ASC"
		if params.SortOrder == "desc" {
			sortOrder = "DESC"
		}

		switch params.SortBy {
		case "name":
			orderBy = "f.name " + sortOrder
		case "capacity":
			orderBy = "f.capacity " + sortOrder
		case "city":
			orderBy = "sc.city " + sortOrder + ", f.name ASC"
		case "sport":
			orderBy = "sp.name " + sortOrder + ", f.name ASC"
		default:
			orderBy = "f.id DESC"
		}
	}

	query += " ORDER BY " + orderBy

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var facilities []model.FacilityDetails
	for rows.Next() {
		var facility model.FacilityDetails
		err := rows.Scan(
			&facility.ID, &facility.Name, &facility.SportComplexID, &facility.CategoryID,
			&facility.SurfaceID, &facility.EnvironmentID, &facility.City, &facility.Address,
			&facility.Description, &facility.Capacity, &facility.IsVerified, &facility.IsActive,
			&facility.CategoryName, &facility.SurfaceName, &facility.EnvironmentName,
			&facility.SportName, &facility.SportComplexName, &facility.ManagerID,
		)
		if err != nil {
			return nil, err
		}
		facilities = append(facilities, facility)
	}

	return facilities, nil
}

func (r *FacilityRepository) GetFacilityByID(id int64) (*model.FacilityDetails, error) {
	query := `
		SELECT 
			f.id, f.name, f.sport_complex_id, f.category_id, f.surface_id, f.environment_id, 
			f.city, f.address, f.description, f.capacity, f.is_verified, f.is_active,
			c.name as category_name, s.name as surface_name, e.name as environment_name,
			sp.name as sport_name,
			COALESCE(sc.name, '') as sport_complex_name,
			f.manager_id
		FROM facilities f
		JOIN categories c ON f.category_id = c.id
		JOIN surfaces s ON f.surface_id = s.id
		JOIN environments e ON f.environment_id = e.id
		JOIN sports sp ON c.sport_id = sp.id
		LEFT JOIN sport_complexes sc ON f.sport_complex_id = sc.id
		WHERE f.id = $1
	`
	var facility model.FacilityDetails
	err := r.db.QueryRow(query, id).Scan(
		&facility.ID, &facility.Name, &facility.SportComplexID, &facility.CategoryID,
		&facility.SurfaceID, &facility.EnvironmentID, &facility.City, &facility.Address,
		&facility.Description, &facility.Capacity, &facility.IsVerified, &facility.IsActive,
		&facility.CategoryName, &facility.SurfaceName, &facility.EnvironmentName,
		&facility.SportName, &facility.SportComplexName, &facility.ManagerID,
	)
	if err != nil {
		return nil, err
	}

	return &facility, nil
}

func (r *FacilityRepository) GetFacilitiesByComplexID(complexID int64) ([]model.FacilityDetails, error) {
	query := `
		SELECT 
			f.id, f.name, f.sport_complex_id, f.category_id, f.surface_id, f.environment_id, 
			f.city, f.address, f.description, f.capacity, f.is_verified, f.is_active,
			c.name as category_name, s.name as surface_name, e.name as environment_name,
			sp.name as sport_name,
			COALESCE(sc.name, '') as sport_complex_name,
			f.manager_id
		FROM facilities f
		JOIN categories c ON f.category_id = c.id
		JOIN surfaces s ON f.surface_id = s.id
		JOIN environments e ON f.environment_id = e.id
		JOIN sports sp ON c.sport_id = sp.id
		LEFT JOIN sport_complexes sc ON f.sport_complex_id = sc.id
		WHERE f.sport_complex_id = $1 AND f.is_verified = true AND f.is_active = true
		ORDER BY f.id DESC
	`
	rows, err := r.db.Query(query, complexID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var facilities []model.FacilityDetails
	for rows.Next() {
		var facility model.FacilityDetails
		err := rows.Scan(
			&facility.ID, &facility.Name, &facility.SportComplexID, &facility.CategoryID,
			&facility.SurfaceID, &facility.EnvironmentID, &facility.City, &facility.Address,
			&facility.Description, &facility.Capacity, &facility.IsVerified, &facility.IsActive,
			&facility.CategoryName, &facility.SurfaceName, &facility.EnvironmentName,
			&facility.SportName, &facility.SportComplexName, &facility.ManagerID,
		)
		if err != nil {
			return nil, err
		}
		facilities = append(facilities, facility)
	}

	return facilities, nil
}

func (r *FacilityRepository) GetFacilitiesByManagerID(managerID int64) ([]model.FacilityDetails, error) {
	query := `
		SELECT 
			f.id, f.name, f.sport_complex_id, f.category_id, f.surface_id, f.environment_id, 
			f.city, f.address, f.description, f.capacity, f.is_verified, f.is_active,
			c.name as category_name, s.name as surface_name, e.name as environment_name,
			sp.name as sport_name,
			COALESCE(sc.name, '') as sport_complex_name,
			f.manager_id
		FROM facilities f
		JOIN categories c ON f.category_id = c.id
		JOIN surfaces s ON f.surface_id = s.id
		JOIN environments e ON f.environment_id = e.id
		JOIN sports sp ON c.sport_id = sp.id
		LEFT JOIN sport_complexes sc ON f.sport_complex_id = sc.id
		WHERE f.manager_id = $1
		ORDER BY f.id DESC
	`
	rows, err := r.db.Query(query, managerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var facilities []model.FacilityDetails
	for rows.Next() {
		var facility model.FacilityDetails
		err := rows.Scan(
			&facility.ID, &facility.Name, &facility.SportComplexID, &facility.CategoryID,
			&facility.SurfaceID, &facility.EnvironmentID, &facility.City, &facility.Address,
			&facility.Description, &facility.Capacity, &facility.IsVerified, &facility.IsActive,
			&facility.CategoryName, &facility.SurfaceName, &facility.EnvironmentName,
			&facility.SportName, &facility.SportComplexName, &facility.ManagerID,
		)
		if err != nil {
			return nil, err
		}
		facilities = append(facilities, facility)
	}

	return facilities, nil
}

func (r *FacilityRepository) GetPendingFacilities() ([]model.FacilityDetails, error) {
	query := `
		SELECT 
			f.id, f.name, f.sport_complex_id, f.category_id, f.surface_id, f.environment_id, 
			f.city, f.address, f.description, f.capacity, f.is_verified, f.is_active,
			c.name as category_name, s.name as surface_name, e.name as environment_name,
			sp.name as sport_name,
			COALESCE(sc.name, '') as sport_complex_name,
			u.name as manager_name,
			u.email as manager_email
		FROM facilities f
		JOIN categories c ON f.category_id = c.id
		JOIN surfaces s ON f.surface_id = s.id
		JOIN environments e ON f.environment_id = e.id
		JOIN sports sp ON c.sport_id = sp.id
		LEFT JOIN sport_complexes sc ON f.sport_complex_id = sc.id
		JOIN users u ON f.manager_id = u.id
		WHERE f.is_verified = false OR f.is_active = false
		ORDER BY f.id DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var facilities []model.FacilityDetails
	for rows.Next() {
		var facility model.FacilityDetails
		err := rows.Scan(
			&facility.ID, &facility.Name, &facility.SportComplexID, &facility.CategoryID,
			&facility.SurfaceID, &facility.EnvironmentID, &facility.City, &facility.Address,
			&facility.Description, &facility.Capacity, &facility.IsVerified, &facility.IsActive,
			&facility.CategoryName, &facility.SurfaceName, &facility.EnvironmentName,
			&facility.SportName, &facility.SportComplexName,
			&facility.ManagerName, &facility.ManagerEmail,
		)
		if err != nil {
			return nil, err
		}
		facilities = append(facilities, facility)
	}

	return facilities, nil
}

func (r *FacilityRepository) VerifyFacility(id int64) (*int64, error) {
	// Get manager_id first
	var managerID *int64
	queryGet := `SELECT manager_id FROM facilities WHERE id = $1`
	err := r.db.QueryRow(queryGet, id).Scan(&managerID)
	if err != nil {
		return nil, err
	}

	// Update the facility
	query := `UPDATE facilities SET is_verified = true, is_active = true WHERE id = $1`
	_, err = r.db.Exec(query, id)
	return managerID, err
}

func (r *FacilityRepository) ToggleFacilityStatus(id int64, isActive bool) error {
	query := `UPDATE facilities SET is_active = $1 WHERE id = $2`
	_, err := r.db.Exec(query, isActive, id)
	return err
}

func (r *FacilityRepository) UpdateFacility(id int64, name string, sportComplexID *int64, categoryID, surfaceID, environmentID int64, city, address, description string, capacity int) error {
	query := `
		UPDATE facilities 
		SET name = $1, sport_complex_id = $2, category_id = $3, surface_id = $4, 
		    environment_id = $5, city = $6, address = $7, description = $8, capacity = $9
		WHERE id = $10
	`
	_, err := r.db.Exec(query, name, sportComplexID, categoryID, surfaceID, environmentID, city, address, description, capacity, id)
	return err
}

func (r *FacilityRepository) GetFacilityManagerID(id int64) (*int64, error) {
	var managerID *int64
	query := `SELECT manager_id FROM facilities WHERE id = $1`
	err := r.db.QueryRow(query, id).Scan(&managerID)
	if err != nil {
		return nil, err
	}
	return managerID, nil
}

// CreateSchedule creates a new facility schedule
func (r *FacilityRepository) CreateSchedule(schedule *model.FacilitySchedule) error {
	query := `
		INSERT INTO facility_schedules (facility_id, day_type, open_time, close_time)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`
	return r.db.QueryRow(query, schedule.FacilityID, schedule.DayType, schedule.OpenTime, schedule.CloseTime).Scan(&schedule.ID)
}

// CreatePricing creates a new facility pricing entry
func (r *FacilityRepository) CreatePricing(pricing *model.FacilityPricing) error {
	query := `
		INSERT INTO facility_pricings (facility_id, day_type, start_hour, end_hour, price_per_hour)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`
	return r.db.QueryRow(query, pricing.FacilityID, pricing.DayType, pricing.StartHour, pricing.EndHour, pricing.PricePerHour).Scan(&pricing.ID)
}

// GetSchedulesByFacilityID retrieves all schedules for a facility
func (r *FacilityRepository) GetSchedulesByFacilityID(facilityID int64) ([]*model.FacilitySchedule, error) {
	query := `
		SELECT id, facility_id, day_type, open_time, close_time
		FROM facility_schedules
		WHERE facility_id = $1
		ORDER BY day_type
	`
	rows, err := r.db.Query(query, facilityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schedules []*model.FacilitySchedule
	for rows.Next() {
		var schedule model.FacilitySchedule
		err := rows.Scan(&schedule.ID, &schedule.FacilityID, &schedule.DayType, &schedule.OpenTime, &schedule.CloseTime)
		if err != nil {
			return nil, err
		}
		schedules = append(schedules, &schedule)
	}

	return schedules, nil
}

// GetPricingByFacilityID retrieves all pricing entries for a facility
func (r *FacilityRepository) GetPricingByFacilityID(facilityID int64) ([]*model.FacilityPricing, error) {
	query := `
		SELECT id, facility_id, day_type, start_hour, end_hour, price_per_hour
		FROM facility_pricings
		WHERE facility_id = $1
		ORDER BY day_type, start_hour
	`
	rows, err := r.db.Query(query, facilityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pricings []*model.FacilityPricing
	for rows.Next() {
		var pricing model.FacilityPricing
		err := rows.Scan(&pricing.ID, &pricing.FacilityID, &pricing.DayType, &pricing.StartHour, &pricing.EndHour, &pricing.PricePerHour)
		if err != nil {
			return nil, err
		}
		pricings = append(pricings, &pricing)
	}

	return pricings, nil
}
