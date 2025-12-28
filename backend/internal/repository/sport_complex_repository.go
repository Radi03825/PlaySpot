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

func (r *SportComplexRepository) CreateSportComplex(name, address, city, description string, managerID int64) (*model.SportComplex, error) {
	query := `
		INSERT INTO sport_complexes (name, address, city, description, manager_id, is_verified, is_active)
		VALUES ($1, $2, $3, $4, $5, false, false)
		RETURNING id
	`
	var id int64
	err := r.db.QueryRow(query, name, address, city, description, managerID).Scan(&id)
	if err != nil {
		return nil, err
	}

	return &model.SportComplex{
		ID:          id,
		Name:        name,
		Address:     address,
		City:        city,
		Description: description,
		ManagerID:   &managerID,
		IsVerified:  false,
		IsActive:    false,
	}, nil
}

func (r *SportComplexRepository) GetAllSportComplexes() ([]model.SportComplex, error) {
	query := `
		SELECT id, name, address, city, description, manager_id, is_verified, is_active
		FROM sport_complexes
		WHERE is_verified = true AND is_active = true
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var complexes []model.SportComplex
	for rows.Next() {
		var complex model.SportComplex
		err := rows.Scan(&complex.ID, &complex.Name, &complex.Address, &complex.City, &complex.Description, &complex.ManagerID, &complex.IsVerified, &complex.IsActive)
		if err != nil {
			return nil, err
		}
		complexes = append(complexes, complex)
	}

	return complexes, nil
}

func (r *SportComplexRepository) GetSportComplexByID(id int64) (*model.SportComplex, error) {
	query := `
		SELECT id, name, address, city, description, manager_id, is_verified, is_active
		FROM sport_complexes
		WHERE id = $1
	`
	var complex model.SportComplex
	err := r.db.QueryRow(query, id).Scan(&complex.ID, &complex.Name, &complex.Address, &complex.City, &complex.Description, &complex.ManagerID, &complex.IsVerified, &complex.IsActive)
	if err != nil {
		return nil, err
	}

	return &complex, nil
}

func (r *SportComplexRepository) GetComplexesByManagerID(managerID int64) ([]model.SportComplex, error) {
	query := `
		SELECT id, name, address, city, description, manager_id, is_verified, is_active
		FROM sport_complexes
		WHERE manager_id = $1
		ORDER BY id DESC
	`
	rows, err := r.db.Query(query, managerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var complexes []model.SportComplex
	for rows.Next() {
		var complex model.SportComplex
		err := rows.Scan(&complex.ID, &complex.Name, &complex.Address, &complex.City, &complex.Description, &complex.ManagerID, &complex.IsVerified, &complex.IsActive)
		if err != nil {
			return nil, err
		}
		complexes = append(complexes, complex)
	}

	return complexes, nil
}

func (r *SportComplexRepository) GetPendingComplexes() ([]model.SportComplex, error) {
	query := `
		SELECT id, name, address, city, description, manager_id, is_verified, is_active
		FROM sport_complexes
		WHERE is_verified = false OR is_active = false
		ORDER BY id DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var complexes []model.SportComplex
	for rows.Next() {
		var complex model.SportComplex
		err := rows.Scan(&complex.ID, &complex.Name, &complex.Address, &complex.City, &complex.Description, &complex.ManagerID, &complex.IsVerified, &complex.IsActive)
		if err != nil {
			return nil, err
		}
		complexes = append(complexes, complex)
	}

	return complexes, nil
}

func (r *SportComplexRepository) VerifyComplex(id int64) error {
	query := `UPDATE sport_complexes SET is_verified = true, is_active = true WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *SportComplexRepository) ToggleComplexStatus(id int64, isActive bool) error {
	query := `UPDATE sport_complexes SET is_active = $1 WHERE id = $2`
	_, err := r.db.Exec(query, isActive, id)
	return err
}
