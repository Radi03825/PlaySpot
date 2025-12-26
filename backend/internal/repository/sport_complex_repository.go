package repository

import (
	"database/sql"

	"github.com/Radi03825/PlaySpot/internal/model"
)

type SportComplexRepository struct {
	db *sql.DB
}

func NewSportComplexRepository(db *sql.DB) *SportComplexRepository {
	return &SportComplexRepository{db: db}
}

func (r *SportComplexRepository) GetAll() ([]model.SportComplex, error) {
	query := `
		SELECT id, name, address, city, description, manager_id, is_verified, is_active
		FROM sport_complexes
		WHERE is_active = TRUE
		ORDER BY name
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var complexes []model.SportComplex
	for rows.Next() {
		var c model.SportComplex
		err := rows.Scan(
			&c.ID,
			&c.Name,
			&c.Address,
			&c.City,
			&c.Description,
			&c.ManagerID,
			&c.IsVerified,
			&c.IsActive,
		)
		if err != nil {
			return nil, err
		}
		complexes = append(complexes, c)
	}

	return complexes, nil
}

func (r *SportComplexRepository) GetByID(id int64) (*model.SportComplex, error) {
	query := `
		SELECT id, name, address, city, description, manager_id, is_verified, is_active
		FROM sport_complexes
		WHERE id = $1
	`

	var c model.SportComplex
	err := r.db.QueryRow(query, id).Scan(
		&c.ID,
		&c.Name,
		&c.Address,
		&c.City,
		&c.Description,
		&c.ManagerID,
		&c.IsVerified,
		&c.IsActive,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &c, nil
}

func (r *SportComplexRepository) GetFacilitiesByComplexID(complexID int64) ([]model.FacilityDetails, error) {
	query := `
		SELECT 
			f.id, f.name, f.sport_complex_id, f.category_id, f.surface_id, 
			f.environment_id, f.description, f.capacity, f.is_verified, f.is_active,
			c.name as category_name,
			s.name as surface_name,
			e.name as environment_name,
			sp.name as sport_name
		FROM facilities f
		INNER JOIN categories c ON f.category_id = c.id
		INNER JOIN surfaces s ON f.surface_id = s.id
		INNER JOIN environments e ON f.environment_id = e.id
		INNER JOIN sports sp ON c.sport_id = sp.id
		WHERE f.sport_complex_id = $1 AND f.is_active = TRUE
		ORDER BY f.name
	`

	rows, err := r.db.Query(query, complexID)
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
		)
		if err != nil {
			return nil, err
		}
		facilities = append(facilities, f)
	}

	return facilities, nil
}
