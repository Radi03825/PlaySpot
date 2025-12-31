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
	query := `INSERT INTO users (name, email, password, role_id, created_at, birth_date, is_email_verified)
	          VALUES ($1, $2, $3, $4, $5, $6, $7) 
	          RETURNING id`

	return r.db.QueryRow(query,
		user.Name,
		user.Email,
		user.Password,
		user.RoleID,
		time.Now(),
		user.BirthDate,
		user.IsEmailVerified,
	).Scan(&user.ID)
}

func (r *UserRepository) GetUserByEmail(email string) (*model.User, error) {
	query := `SELECT id, name, email, COALESCE(password, ''), role_id, created_at, birth_date, is_email_verified
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
	query := `SELECT id, name, email, COALESCE(password, ''), role_id, created_at, birth_date, is_email_verified
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

func (r *UserRepository) GetUserByAuthProvider(provider, providerUserID string) (*model.User, error) {
	query := `SELECT u.id, u.name, u.email, COALESCE(u.password, ''), u.role_id, u.created_at, u.birth_date, u.is_email_verified
	          FROM users u
	          INNER JOIN user_auth_identities uai ON u.id = uai.user_id
	          WHERE uai.provider = $1 AND uai.provider_user_id = $2`

	row := r.db.QueryRow(query, provider, providerUserID)

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

func (r *UserRepository) AddAuthIdentity(userID int64, provider, providerUserID string) error {
	query := `INSERT INTO user_auth_identities (user_id, provider, provider_user_id)
	          VALUES ($1, $2, $3)
	          ON CONFLICT (user_id, provider) DO UPDATE
	          SET provider_user_id = EXCLUDED.provider_user_id`

	_, err := r.db.Exec(query, userID, provider, providerUserID)
	return err
}

func (r *UserRepository) GetAuthIdentities(userID int64) ([]model.UserAuthIdentity, error) {
	query := `SELECT id, user_id, provider, provider_user_id
	          FROM user_auth_identities
	          WHERE user_id = $1`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var identities []model.UserAuthIdentity
	for rows.Next() {
		var identity model.UserAuthIdentity
		err := rows.Scan(
			&identity.ID,
			&identity.UserID,
			&identity.Provider,
			&identity.ProviderUserID,
		)
		if err != nil {
			return nil, err
		}
		identities = append(identities, identity)
	}

	return identities, nil
}

func (r *UserRepository) HasAuthIdentity(userID int64, provider string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM user_auth_identities WHERE user_id = $1 AND provider = $2)`

	var exists bool
	err := r.db.QueryRow(query, userID, provider).Scan(&exists)
	return exists, err
}
