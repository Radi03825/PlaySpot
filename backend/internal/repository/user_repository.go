package repository

import (
	"database/sql"
	"time"

	"github.com/Radi03825/PlaySpot/internal/model"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(user *model.User) error {
	query := `INSERT INTO users (name, email, password, role_id, created_at, birth_date)
	          VALUES ($1, $2, $3, $4, $5, $6) 
	          RETURNING id`

	return r.db.QueryRow(query,
		user.Name,
		user.Email,
		user.Password,
		user.RoleID,
		time.Now(),
		user.BirthDate,
	).Scan(&user.ID)
}

func (r *UserRepository) GetUserByEmail(email string) (*model.User, error) {
	query := `SELECT id, name, email, password, role_id, created_at, birth_date
	          FROM users
	          WHERE email = $1`

	row := r.db.QueryRow(query, email)

	var user model.User
	err := row.Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Password,
		&user.RoleID,
		&user.CreatedAt,
		&user.BirthDate,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}
