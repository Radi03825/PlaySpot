package repository

import (
	"database/sql"

	"github.com/Radi03825/PlaySpot/internal/model"
)

type FacilityRepository struct {
	db *sql.DB
}

func NewFacilityRepository(db *sql.DB) *FacilityRepository {
	return &FacilityRepository{db: db}
}

func (r *FacilityRepository) CreateFacility(name string, sportComplexID *int64, categoryID, surfaceID, environmentID int64, description string, capacity int, managerID int64) (*model.Facility, error) {
	query := `
		INSERT INTO facilities (name, sport_complex_id, category_id, surface_id, environment_id, description, capacity, manager_id, is_verified, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, false)
		RETURNING id
	`
	var id int64
	err := r.db.QueryRow(query, name, sportComplexID, categoryID, surfaceID, environmentID, description, capacity, managerID).Scan(&id)
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
			f.description, f.capacity, f.is_verified, f.is_active,
			c.name as category_name, s.name as surface_name, e.name as environment_name,
			sp.name as sport_name,
			COALESCE(sc.name, '') as sport_complex_name
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
			&facility.SurfaceID, &facility.EnvironmentID, &facility.Description, &facility.Capacity,
			&facility.IsVerified, &facility.IsActive,
			&facility.CategoryName, &facility.SurfaceName, &facility.EnvironmentName,
			&facility.SportName, &facility.SportComplexName,
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
			f.description, f.capacity, f.is_verified, f.is_active,
			c.name as category_name, s.name as surface_name, e.name as environment_name,
			sp.name as sport_name,
			COALESCE(sc.name, '') as sport_complex_name
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
		&facility.SurfaceID, &facility.EnvironmentID, &facility.Description, &facility.Capacity,
		&facility.IsVerified, &facility.IsActive,
		&facility.CategoryName, &facility.SurfaceName, &facility.EnvironmentName,
		&facility.SportName, &facility.SportComplexName,
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
			f.description, f.capacity, f.is_verified, f.is_active,
			c.name as category_name, s.name as surface_name, e.name as environment_name,
			sp.name as sport_name,
			COALESCE(sc.name, '') as sport_complex_name
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
			&facility.SurfaceID, &facility.EnvironmentID, &facility.Description, &facility.Capacity,
			&facility.IsVerified, &facility.IsActive,
			&facility.CategoryName, &facility.SurfaceName, &facility.EnvironmentName,
			&facility.SportName, &facility.SportComplexName,
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
			f.description, f.capacity, f.is_verified, f.is_active,
			c.name as category_name, s.name as surface_name, e.name as environment_name,
			sp.name as sport_name,
			COALESCE(sc.name, '') as sport_complex_name
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
			&facility.SurfaceID, &facility.EnvironmentID, &facility.Description, &facility.Capacity,
			&facility.IsVerified, &facility.IsActive,
			&facility.CategoryName, &facility.SurfaceName, &facility.EnvironmentName,
			&facility.SportName, &facility.SportComplexName,
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
			f.description, f.capacity, f.is_verified, f.is_active,
			c.name as category_name, s.name as surface_name, e.name as environment_name,
			sp.name as sport_name,
			COALESCE(sc.name, '') as sport_complex_name
		FROM facilities f
		JOIN categories c ON f.category_id = c.id
		JOIN surfaces s ON f.surface_id = s.id
		JOIN environments e ON f.environment_id = e.id
		JOIN sports sp ON c.sport_id = sp.id
		LEFT JOIN sport_complexes sc ON f.sport_complex_id = sc.id
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
			&facility.SurfaceID, &facility.EnvironmentID, &facility.Description, &facility.Capacity,
			&facility.IsVerified, &facility.IsActive,
			&facility.CategoryName, &facility.SurfaceName, &facility.EnvironmentName,
			&facility.SportName, &facility.SportComplexName,
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
