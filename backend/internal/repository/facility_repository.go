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

func (r *FacilityRepository) GetAll() ([]model.FacilityDetails, error) {
	query := `
		SELECT 
			f.id, f.name, f.sport_complex_id, f.category_id, f.surface_id, 
			f.environment_id, f.description, f.capacity, f.is_verified, f.is_active,
			c.name as category_name,
			s.name as surface_name,
			e.name as environment_name,
			sp.name as sport_name,
			COALESCE(sc.name, '') as sport_complex_name
		FROM facilities f
		INNER JOIN categories c ON f.category_id = c.id
		INNER JOIN surfaces s ON f.surface_id = s.id
		INNER JOIN environments e ON f.environment_id = e.id
		INNER JOIN sports sp ON c.sport_id = sp.id
		LEFT JOIN sport_complexes sc ON f.sport_complex_id = sc.id
		WHERE f.is_active = TRUE
		ORDER BY f.name
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var facilities []model.FacilityDetails
	for rows.Next() {
		var f model.FacilityDetails
		err := rows.Scan(
			&f.ID,
			&f.Name,
			&f.SportComplexID,
			&f.CategoryID,
			&f.SurfaceID,
			&f.EnvironmentID,
			&f.Description,
			&f.Capacity,
			&f.IsVerified,
			&f.IsActive,
			&f.CategoryName,
			&f.SurfaceName,
			&f.EnvironmentName,
			&f.SportName,
			&f.SportComplexName,
		)
		if err != nil {
			return nil, err
		}
		facilities = append(facilities, f)
	}

	return facilities, nil
}

func (r *FacilityRepository) GetByID(id int64) (*model.FacilityDetails, error) {
	query := `
		SELECT 
			f.id, f.name, f.sport_complex_id, f.category_id, f.surface_id, 
			f.environment_id, f.description, f.capacity, f.is_verified, f.is_active,
			c.name as category_name,
			s.name as surface_name,
			e.name as environment_name,
			sp.name as sport_name,
			COALESCE(sc.name, '') as sport_complex_name
		FROM facilities f
		INNER JOIN categories c ON f.category_id = c.id
		INNER JOIN surfaces s ON f.surface_id = s.id
		INNER JOIN environments e ON f.environment_id = e.id
		INNER JOIN sports sp ON c.sport_id = sp.id
		LEFT JOIN sport_complexes sc ON f.sport_complex_id = sc.id
		WHERE f.id = $1
	`

	var f model.FacilityDetails
	err := r.db.QueryRow(query, id).Scan(
		&f.ID,
		&f.Name,
		&f.SportComplexID,
		&f.CategoryID,
		&f.SurfaceID,
		&f.EnvironmentID,
		&f.Description,
		&f.Capacity,
		&f.IsVerified,
		&f.IsActive,
		&f.CategoryName,
		&f.SurfaceName,
		&f.EnvironmentName,
		&f.SportName,
		&f.SportComplexName,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &f, nil
}
