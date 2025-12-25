package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"os"
	"time"

	"github.com/Radi03825/PlaySpot/internal/model"
	"github.com/Radi03825/PlaySpot/internal/repository"
	"github.com/golang-jwt/jwt/v5"
)

type TokenService struct {
	tokenRepo *repository.TokenRepository
	userRepo  *repository.UserRepository
}

func NewTokenService(tokenRepo *repository.TokenRepository, userRepo *repository.UserRepository) *TokenService {
	return &TokenService{
		tokenRepo: tokenRepo,
		userRepo:  userRepo,
	}
}

// CreateAccessToken creates a new JWT access token for a user
func (s *TokenService) CreateAccessToken(user *model.User) (string, error) {
	secret := os.Getenv("JWT_SECRET")

	claims := jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"role_id": user.RoleID,
		"exp":     time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	secretKey := []byte(secret)

	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateAccessToken validates a JWT token and returns the user claims
func (s *TokenService) ValidateAccessToken(tokenString string) (*jwt.MapClaims, error) {
	secret := os.Getenv("JWT_SECRET")

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return &claims, nil
	}

	return nil, errors.New("invalid token")
}

// GenerateRefreshToken generates a new refresh token for a user
func (s *TokenService) GenerateRefreshToken(userID int64, userAgent string) (string, error) {
	// Generate a secure random token
	tokenBytes := make([]byte, 32)
	_, err := rand.Read(tokenBytes)
	if err != nil {
		return "", errors.New("failed to generate refresh token")
	}
	tokenString := hex.EncodeToString(tokenBytes)

	// Hash the token before storing
	tokenHash := s.HashToken(tokenString)

	// Create refresh token record
	refreshToken := &model.Token{
		UserID:    userID,
		Token:     tokenHash,
		TokenType: model.TokenTypeRefresh,
		ExpiresAt: time.Now().Add(time.Hour * 24 * 7), // 7 days
		CreatedAt: time.Now(),
		UserAgent: userAgent,
		Used:      false,
		Revoked:   false,
	}

	err = s.tokenRepo.CreateToken(refreshToken)
	if err != nil {
		return "", errors.New("failed to save refresh token")
	}

	return tokenString, nil
}

// RefreshAccessToken creates a new access token using a valid refresh token
func (s *TokenService) RefreshAccessToken(refreshToken, userAgent string) (string, error) {
	// Hash the provided token to match against database
	tokenHash := s.HashToken(refreshToken)

	// Validate refresh token by hash first
	storedToken, err := s.tokenRepo.GetTokenByValue(tokenHash, model.TokenTypeRefresh)
	if err != nil {
		return "", errors.New("invalid or expired refresh token")
	}

	// Additional security: verify user agent matches
	if storedToken.UserAgent != userAgent {
		// Token is being used from a different device/browser - potential security issue
		// Optionally revoke this token
		_ = s.tokenRepo.RevokeToken(tokenHash)
		return "", errors.New("refresh token user agent mismatch")
	}

	// Get user using repository method
	user, err := s.userRepo.GetUserByID(storedToken.UserID)
	if err != nil {
		return "", errors.New("user not found")
	}

	// Create new access token
	accessToken, err := s.CreateAccessToken(user)
	if err != nil {
		return "", err
	}

	return accessToken, nil
}

// ValidateRefreshToken validates a refresh token and returns the associated token record
func (s *TokenService) ValidateRefreshToken(refreshToken, userAgent string) (*model.Token, error) {
	tokenHash := s.HashToken(refreshToken)

	// Get token by hash
	storedToken, err := s.tokenRepo.GetTokenByValue(tokenHash, model.TokenTypeRefresh)
	if err != nil {
		return nil, errors.New("invalid or expired refresh token")
	}

	// Verify user agent matches
	if storedToken.UserAgent != userAgent {
		_ = s.tokenRepo.RevokeToken(tokenHash)
		return nil, errors.New("refresh token user agent mismatch")
	}

	return storedToken, nil
}

// GetUserActiveRefreshToken gets the active refresh token for a specific user and device
func (s *TokenService) GetUserActiveRefreshToken(userID int64, userAgent string) (*model.Token, error) {
	return s.tokenRepo.GetTokenByUserIDAndAgent(userID, userAgent, model.TokenTypeRefresh)
}

// RevokeRefreshToken revokes a specific refresh token
func (s *TokenService) RevokeRefreshToken(refreshToken string) error {
	tokenHash := s.HashToken(refreshToken)
	return s.tokenRepo.RevokeToken(tokenHash)
}

// RevokeAllUserTokens revokes all refresh tokens for a user (logout from all devices)
func (s *TokenService) RevokeAllUserTokens(userID int64) error {
	return s.tokenRepo.RevokeAllUserTokens(userID)
}

// GetUserActiveDevices returns all active sessions for a user
func (s *TokenService) GetUserActiveDevices(userID int64) ([]model.Token, error) {
	return s.tokenRepo.GetUserActiveTokens(userID)
}

// HashToken creates a SHA256 hash of a token string
func (s *TokenService) HashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

// CleanupExpiredTokens removes expired and revoked tokens from the database
func (s *TokenService) CleanupExpiredTokens() error {
	return s.tokenRepo.CleanupExpiredTokens()
}

// GenerateResetToken generates a secure random token for password reset
func (s *TokenService) GenerateResetToken(userID int64) (string, error) {
	tokenBytes := make([]byte, 32)
	_, err := rand.Read(tokenBytes)
	if err != nil {
		return "", errors.New("failed to generate reset token")
	}
	tokenString := hex.EncodeToString(tokenBytes)

	// Create token record
	token := &model.Token{
		UserID:    userID,
		Token:     tokenString,
		TokenType: model.TokenTypePasswordReset,
		ExpiresAt: time.Now().Add(time.Hour * 1), // 1 hour
		CreatedAt: time.Now(),
		Used:      false,
		Revoked:   false,
		UserAgent: "", // Not applicable for reset tokens
	}

	err = s.tokenRepo.CreateToken(token)
	if err != nil {
		return "", errors.New("failed to save reset token")
	}

	return tokenString, nil
}

// ValidateResetToken checks if a reset token is valid
func (s *TokenService) ValidateResetToken(token string) (*model.User, error) {
	vToken, err := s.tokenRepo.GetTokenByValue(token, model.TokenTypePasswordReset)
	if err != nil {
		return nil, errors.New("invalid or expired reset token")
	}

	user, err := s.userRepo.GetUserByID(vToken.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// Mark token as used
	_ = s.tokenRepo.MarkTokenAsUsed(vToken.ID)

	return user, nil
}

// GenerateEmailVerificationToken generates an email verification token
func (s *TokenService) GenerateEmailVerificationToken(userID int64) (string, error) {
	// Generate a secure random token
	tokenBytes := make([]byte, 32)
	_, err := rand.Read(tokenBytes)
	if err != nil {
		return "", errors.New("failed to generate token")
	}
	tokenString := hex.EncodeToString(tokenBytes)

	// Create token record
	token := &model.Token{
		UserID:    userID,
		Token:     tokenString,
		TokenType: model.TokenTypeEmailVerification,
		ExpiresAt: time.Now().Add(time.Hour * 24), // 24 hours
		CreatedAt: time.Now(),
		Used:      false,
		Revoked:   false,
		UserAgent: "", // Not applicable for verification tokens
	}

	err = s.tokenRepo.CreateToken(token)
	if err != nil {
		return "", errors.New("failed to save verification token")
	}

	return tokenString, nil
}

// ValidateEmailVerificationToken validates an email verification token and activates the account
func (s *TokenService) ValidateEmailVerificationToken(token string) (*model.User, error) {
	vToken, err := s.tokenRepo.GetTokenByValue(token, model.TokenTypeEmailVerification)
	if err != nil {
		return nil, errors.New("invalid or expired verification token")
	}

	// Mark email as verified
	err = s.userRepo.MarkEmailAsVerified(vToken.UserID)
	if err != nil {
		return nil, errors.New("failed to verify email")
	}

	// Mark token as used
	_ = s.tokenRepo.MarkTokenAsUsed(vToken.ID)

	user, err := s.userRepo.GetUserByID(vToken.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	return user, nil
}

// GenerateVerificationToken generates a secure random token for email verification
func (s *TokenService) GenerateVerificationToken(userID int64) (string, error) {
	return s.GenerateEmailVerificationToken(userID)
}
