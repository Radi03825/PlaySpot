package model

import "time"

type TokenType string

const (
	TokenTypeEmailVerification TokenType = "email_verification"
	TokenTypePasswordReset     TokenType = "password_reset"
	TokenTypeRefresh           TokenType = "refresh"
)

// Token represents a unified token that can be used for various purposes:
// - Email verification
// - Password reset
// - JWT refresh token
type Token struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	Token     string    `json:"-"` // Never expose in JSON
	TokenType TokenType `json:"token_type"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
	Used      bool      `json:"used"`       // For verification and reset tokens
	Revoked   bool      `json:"revoked"`    // For refresh tokens
	UserAgent string    `json:"user_agent"` // For refresh tokens (device tracking)
}
