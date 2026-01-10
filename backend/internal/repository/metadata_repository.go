package repository

import (
	"database/sql"
)

type MetadataRepository struct {
	db *sql.DB
}

func NewMetadataRepository(db *sql.DB) *MetadataRepository {
	return &MetadataRepository{db: db}
}

type Category struct {
	ID      int64  `json:"id"`
	Name    string `json:"name"`
	SportID int64  `json:"sport_id"`
}

type Sport struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type Surface struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type Environment struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (r *MetadataRepository) GetCategories() ([]Category, error) {
	query := `SELECT id, name, sport_id FROM categories ORDER BY name`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var cat Category
		if err := rows.Scan(&cat.ID, &cat.Name, &cat.SportID); err != nil {
			return nil, err
		}
		categories = append(categories, cat)
	}

	return categories, nil
}

func (r *MetadataRepository) GetSports() ([]Sport, error) {
	query := `SELECT id, name FROM sports ORDER BY name`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sports []Sport
	for rows.Next() {
		var sport Sport
		if err := rows.Scan(&sport.ID, &sport.Name); err != nil {
			return nil, err
		}
		sports = append(sports, sport)
	}

	return sports, nil
}

func (r *MetadataRepository) GetSurfaces() ([]Surface, error) {
	query := `SELECT id, name, description FROM surfaces ORDER BY name`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var surfaces []Surface
	for rows.Next() {
		var surf Surface
		if err := rows.Scan(&surf.ID, &surf.Name, &surf.Description); err != nil {
			return nil, err
		}
		surfaces = append(surfaces, surf)
	}

	return surfaces, nil
}

func (r *MetadataRepository) GetEnvironments() ([]Environment, error) {
	query := `SELECT id, name, description FROM environments ORDER BY name`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var environments []Environment
	for rows.Next() {
		var env Environment
		if err := rows.Scan(&env.ID, &env.Name, &env.Description); err != nil {
			return nil, err
		}
		environments = append(environments, env)
	}

	return environments, nil
}

func (r *MetadataRepository) GetCities() ([]string, error) {
	query := `SELECT DISTINCT city FROM sport_complexes WHERE city IS NOT NULL AND city != '' AND is_verified = true AND is_active = true ORDER BY city`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cities []string
	for rows.Next() {
		var city string
		if err := rows.Scan(&city); err != nil {
			return nil, err
		}
		cities = append(cities, city)
	}
	return cities, nil
}
