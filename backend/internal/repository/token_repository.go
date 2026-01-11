package repository

import (
	"database/sql"

	"github.com/Radi03825/PlaySpot/internal/model"
)

type TokenRepository struct {
	db *sql.DB
}

func NewTokenRepository(db *sql.DB) *TokenRepository {
	return &TokenRepository{db: db}
}

// CreateToken creates a new token of any type
func (r *TokenRepository) CreateToken(token *model.Token) error {
	query := `INSERT INTO tokens (user_id, token, token_type, expires_at, created_at, used, revoked, user_agent)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
	          RETURNING id`

	return r.db.QueryRow(query,
		token.UserID,
		token.Token,
		token.TokenType,
		token.ExpiresAt,
		token.CreatedAt,
		token.Used,
		token.Revoked,
		token.UserAgent,
	).Scan(&token.ID)
}

func (r *TokenRepository) GetTokenByValue(tokenValue string, tokenType model.TokenType) (*model.Token, error) {
	query := `SELECT id, user_id, token, token_type, expires_at, created_at, used, revoked, user_agent
	          FROM tokens
	          WHERE token = $1 AND token_type = $2 AND used = FALSE AND revoked = FALSE AND expires_at > NOW()`

	row := r.db.QueryRow(query, tokenValue, tokenType)

	var token model.Token
	err := row.Scan(
		&token.ID,
		&token.UserID,
		&token.Token,
		&token.TokenType,
		&token.ExpiresAt,
		&token.CreatedAt,
		&token.Used,
		&token.Revoked,
		&token.UserAgent,
	)
	if err != nil {
		return nil, err
	}

	return &token, nil
}

// GetTokenByValueIncludingUsed retrieves a token by its value and type, even if it's already used
// This is useful for checking if a user is already verified
func (r *TokenRepository) GetTokenByValueIncludingUsed(tokenValue string, tokenType model.TokenType) (*model.Token, error) {
	query := `SELECT id, user_id, token, token_type, expires_at, created_at, used, revoked, user_agent
	          FROM tokens
	          WHERE token = $1 AND token_type = $2 AND revoked = FALSE AND expires_at > NOW()`

	row := r.db.QueryRow(query, tokenValue, tokenType)

	var token model.Token
	err := row.Scan(
		&token.ID,
		&token.UserID,
		&token.Token,
		&token.TokenType,
		&token.ExpiresAt,
		&token.CreatedAt,
		&token.Used,
		&token.Revoked,
		&token.UserAgent,
	)
	if err != nil {
		return nil, err
	}

	return &token, nil
}

// GetTokenByUserIDAndAgent retrieves an active refresh token for a specific user and device
func (r *TokenRepository) GetTokenByUserIDAndAgent(userID int64, userAgent string, tokenType model.TokenType) (*model.Token, error) {
	query := `SELECT id, user_id, token, token_type, expires_at, created_at, used, revoked, user_agent
	          FROM tokens
	          WHERE user_id = $1 AND user_agent = $2 AND token_type = $3 AND revoked = FALSE AND expires_at > NOW()
	          ORDER BY created_at DESC
	          LIMIT 1`

	row := r.db.QueryRow(query, userID, userAgent, tokenType)

	var token model.Token
	err := row.Scan(
		&token.ID,
		&token.UserID,
		&token.Token,
		&token.TokenType,
		&token.ExpiresAt,
		&token.CreatedAt,
		&token.Used,
		&token.Revoked,
		&token.UserAgent,
	)
	if err != nil {
		return nil, err
	}

	return &token, nil
}

func (r *TokenRepository) MarkTokenAsUsed(tokenID int64) error {
	query := `UPDATE tokens SET used = TRUE WHERE id = $1`
	_, err := r.db.Exec(query, tokenID)
	return err
}

func (r *TokenRepository) RevokeToken(tokenValue string) error {
	query := `UPDATE tokens SET revoked = TRUE WHERE token = $1`
	_, err := r.db.Exec(query, tokenValue)
	return err
}

// RevokeUserTokensByType revokes all tokens of a specific type for a user
func (r *TokenRepository) RevokeUserTokensByType(userID int64, tokenType model.TokenType) error {
	query := `UPDATE tokens SET used = TRUE, revoked = TRUE 
	          WHERE user_id = $1 AND token_type = $2 AND used = FALSE AND revoked = FALSE`
	_, err := r.db.Exec(query, userID, tokenType)
	return err
}

// RevokeAllUserTokens revokes all refresh tokens for a user (logout from all devices)
func (r *TokenRepository) RevokeAllUserTokens(userID int64) error {
	query := `UPDATE tokens SET revoked = TRUE 
	          WHERE user_id = $1 AND token_type = $2`
	_, err := r.db.Exec(query, userID, model.TokenTypeRefresh)
	return err
}

// GetUserTokensByType retrieves all active tokens of a specific type for a user
func (r *TokenRepository) GetUserTokensByType(userID int64, tokenType model.TokenType) ([]model.Token, error) {
	query := `SELECT id, user_id, token, token_type, expires_at, created_at, used, revoked, user_agent
	          FROM tokens
	          WHERE user_id = $1 AND token_type = $2 AND used = FALSE AND revoked = FALSE AND expires_at > NOW()
	          ORDER BY created_at DESC`

	rows, err := r.db.Query(query, userID, tokenType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tokens []model.Token
	for rows.Next() {
		var token model.Token
		err := rows.Scan(
			&token.ID,
			&token.UserID,
			&token.Token,
			&token.TokenType,
			&token.ExpiresAt,
			&token.CreatedAt,
			&token.Used,
			&token.Revoked,
			&token.UserAgent,
		)
		if err != nil {
			return nil, err
		}
		tokens = append(tokens, token)
	}

	return tokens, nil
}

func (r *TokenRepository) GetUserActiveTokens(userID int64) ([]model.Token, error) {
	return r.GetUserTokensByType(userID, model.TokenTypeRefresh)
}

// CleanupExpiredTokens removes expired, used, and revoked tokens from the database
func (r *TokenRepository) CleanupExpiredTokens() error {
	query := `DELETE FROM tokens WHERE expires_at < NOW() OR used = TRUE OR revoked = TRUE`
	_, err := r.db.Exec(query)
	return err
}
