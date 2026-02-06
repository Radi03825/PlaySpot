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
	query := `SELECT id, name, email, COALESCE(password, ''), role_id, created_at, birth_date, is_email_verified, is_active
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
		&user.IsActive,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) GetUserByID(id int64) (*model.User, error) {
	query := `SELECT id, name, email, COALESCE(password, ''), role_id, created_at, birth_date, is_email_verified, is_active
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
		&user.IsActive,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) GetUserByAuthProvider(provider, providerUserID string) (*model.User, error) {
	query := `SELECT u.id, u.name, u.email, COALESCE(u.password, ''), u.role_id, u.created_at, u.birth_date, u.is_email_verified, u.is_active
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
		&user.IsActive,
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

func (r *UserRepository) AddAuthIdentityWithTokens(userID int64, provider, providerUserID, accessToken, refreshToken string, tokenExpiry time.Time) error {
	// Add the auth identity first
	identityQuery := `INSERT INTO user_auth_identities (user_id, provider, provider_user_id)
	                  VALUES ($1, $2, $3)
	                  ON CONFLICT (user_id, provider) DO UPDATE
	                  SET provider_user_id = EXCLUDED.provider_user_id`

	_, err := r.db.Exec(identityQuery, userID, provider, providerUserID)
	if err != nil {
		return err
	}

	// If we have Google tokens, save them to the tokens table
	if accessToken != "" && refreshToken != "" {
		return r.UpdateGoogleCalendarTokens(userID, accessToken, refreshToken, tokenExpiry)
	}

	return nil
}

func (r *UserRepository) UpdateGoogleTokens(userID int64, accessToken, refreshToken string, tokenExpiry time.Time) error {
	// This is now an alias for UpdateGoogleCalendarTokens
	return r.UpdateGoogleCalendarTokens(userID, accessToken, refreshToken, tokenExpiry)
}

// UpdateGoogleCalendarTokens saves Google OAuth tokens to the tokens table
func (r *UserRepository) UpdateGoogleCalendarTokens(userID int64, accessToken, refreshToken string, tokenExpiry time.Time) error {
	// Start a transaction to ensure both tokens are saved together
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Delete existing Google tokens for this user to avoid duplicates
	deleteQuery := `DELETE FROM tokens WHERE user_id = $1 AND token_type IN ('google_access', 'google_refresh')`
	_, err = tx.Exec(deleteQuery, userID)
	if err != nil {
		return err
	}

	// Insert new access token
	insertAccessQuery := `INSERT INTO tokens (user_id, token, token_type, expires_at, created_at, used, revoked)
	                      VALUES ($1, $2, 'google_access', $3, NOW(), FALSE, FALSE)`
	_, err = tx.Exec(insertAccessQuery, userID, accessToken, tokenExpiry)
	if err != nil {
		return err
	}

	// Insert new refresh token (refresh tokens typically don't expire, set far future date)
	refreshExpiry := time.Now().AddDate(1, 0, 0) // 1 year from now
	insertRefreshQuery := `INSERT INTO tokens (user_id, token, token_type, expires_at, created_at, used, revoked)
	                       VALUES ($1, $2, 'google_refresh', $3, NOW(), FALSE, FALSE)`
	_, err = tx.Exec(insertRefreshQuery, userID, refreshToken, refreshExpiry)
	if err != nil {
		return err
	}

	// Commit transaction
	return tx.Commit()
}

func (r *UserRepository) GetGoogleTokens(userID int64) (accessToken, refreshToken string, tokenExpiry time.Time, err error) {
	// Get access token
	accessQuery := `SELECT token, expires_at FROM tokens 
	                WHERE user_id = $1 AND token_type = 'google_access' 
	                AND used = FALSE AND revoked = FALSE
	                ORDER BY created_at DESC LIMIT 1`
	err = r.db.QueryRow(accessQuery, userID).Scan(&accessToken, &tokenExpiry)
	if err != nil && err != sql.ErrNoRows {
		return "", "", time.Time{}, err
	}

	// Get refresh token
	refreshQuery := `SELECT token FROM tokens 
	                 WHERE user_id = $1 AND token_type = 'google_refresh' 
	                 AND used = FALSE AND revoked = FALSE
	                 ORDER BY created_at DESC LIMIT 1`
	err = r.db.QueryRow(refreshQuery, userID).Scan(&refreshToken)
	if err != nil && err != sql.ErrNoRows {
		return "", "", time.Time{}, err
	}

	// If no tokens found, return empty strings (not an error, just means calendar not connected)
	if accessToken == "" && refreshToken == "" {
		return "", "", time.Time{}, nil
	}

	return accessToken, refreshToken, tokenExpiry, nil
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

		// If this is a Google identity, get tokens from tokens table
		if identity.Provider == "google" {
			accessToken, refreshToken, tokenExpiry, err := r.GetGoogleTokens(userID)
			if err == nil && accessToken != "" {
				identity.GoogleAccessToken = &accessToken
				identity.GoogleRefreshToken = &refreshToken
				identity.TokenExpiry = &tokenExpiry
			}
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

// GetAllUsers retrieves all users from the database
func (r *UserRepository) GetAllUsers() ([]model.User, error) {
	query := `SELECT id, name, email, COALESCE(password, ''), role_id, created_at, birth_date, is_email_verified, is_active
	          FROM users
	          ORDER BY created_at DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var user model.User
		err := rows.Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&user.Password,
			&user.RoleID,
			&user.CreatedAt,
			&user.BirthDate,
			&user.IsEmailVerified,
			&user.IsActive,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, nil
}

// GetAllUsersWithPagination retrieves users with pagination support
func (r *UserRepository) GetAllUsersWithPagination(limit, offset int) ([]model.User, int, error) {
	// Get total count
	var totalCount int
	countQuery := `SELECT COUNT(*) FROM users`
	err := r.db.QueryRow(countQuery).Scan(&totalCount)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated users
	query := `SELECT id, name, email, COALESCE(password, ''), role_id, created_at, birth_date, is_email_verified, is_active
	          FROM users
	          ORDER BY created_at DESC
	          LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var user model.User
		err := rows.Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&user.Password,
			&user.RoleID,
			&user.CreatedAt,
			&user.BirthDate,
			&user.IsEmailVerified,
			&user.IsActive,
		)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, user)
	}

	return users, totalCount, nil
}

// ActivateUser sets is_active to true for a user
func (r *UserRepository) ActivateUser(userID int64) error {
	query := `UPDATE users SET is_active = TRUE WHERE id = $1`
	_, err := r.db.Exec(query, userID)
	return err
}

// DeactivateUser sets is_active to false for a user and deactivates all their managed complexes and facilities
func (r *UserRepository) DeactivateUser(userID int64) error {
	// Start a transaction
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Deactivate the user
	userQuery := `UPDATE users SET is_active = FALSE WHERE id = $1`
	_, err = tx.Exec(userQuery, userID)
	if err != nil {
		return err
	}

	// Deactivate all sport complexes managed by this user
	complexQuery := `UPDATE sport_complexes SET is_active = FALSE WHERE manager_id = $1`
	_, err = tx.Exec(complexQuery, userID)
	if err != nil {
		return err
	}

	// Deactivate all facilities managed by this user
	facilityQuery := `UPDATE facilities SET is_active = FALSE WHERE manager_id = $1`
	_, err = tx.Exec(facilityQuery, userID)
	if err != nil {
		return err
	}

	// Commit the transaction
	return tx.Commit()
}

