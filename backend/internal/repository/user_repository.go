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
	query := `SELECT id, name, email, password, role_id, created_at, birth_date, is_email_verified
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
		&user.IsEmailVerified,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) GetUserByID(id int64) (*model.User, error) {
	query := `SELECT id, name, email, password, role_id, created_at, birth_date, is_email_verified
	          FROM users
	          WHERE id = $1`

	row := r.db.QueryRow(query, id)

	var user model.User
	err := row.Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Password,
		&user.RoleID,
		&user.CreatedAt,
		&user.BirthDate,
		&user.IsEmailVerified,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) UpdatePassword(userID int64, hashedPassword string) error {
	query := `UPDATE users 
	          SET password = $1
	          WHERE id = $2`

	_, err := r.db.Exec(query, hashedPassword, userID)
	return err
}

func (r *UserRepository) MarkEmailAsVerified(userID int64) error {
	query := `UPDATE users 
	          SET is_email_verified = TRUE
	          WHERE id = $1`

	_, err := r.db.Exec(query, userID)
	return err
}

func (r *UserRepository) UpdateUserRole(userID int64, roleID int64) error {
	query := `UPDATE users 
	          SET role_id = $1
	          WHERE id = $2`

	_, err := r.db.Exec(query, roleID, userID)
	return err
}

func (r *UserRepository) GetRoleIDByName(roleName string) (int64, error) {
	query := `SELECT id FROM roles WHERE name = $1`

	var roleID int64
	err := r.db.QueryRow(query, roleName).Scan(&roleID)
	if err != nil {
		return 0, err
	}

	return roleID, nil
}
