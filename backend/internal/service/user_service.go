package service

import (
	"errors"
	"time"

	"github.com/Radi03825/PlaySpot/internal/dto"
	"github.com/Radi03825/PlaySpot/internal/model"
	"github.com/Radi03825/PlaySpot/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	repo         *repository.UserRepository
	tokenService *TokenService
	emailService *EmailService
}

func NewUserService(repo *repository.UserRepository, tokenService *TokenService, emailService *EmailService) *UserService {
	return &UserService{
		repo:         repo,
		tokenService: tokenService,
		emailService: emailService,
	}
}

// TODO: Add validation for email format and password strength
// TODO: Send confirmation email after registration and before activating account
func (s *UserService) RegisterUser(user dto.RegisterUserDTO) (*model.User, error) {
	// Check if user already exists
	existingUser, _ := s.repo.GetUserByEmail(user.Email)
	if existingUser != nil {
		return nil, errors.New("user with this email already exists")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Parse birth date
	birthDate, err := time.Parse("2006-01-02", user.BirthDate)
	if err != nil {
		return nil, errors.New("invalid birth date format, expected YYYY-MM-DD")
	}

	// Validate birth date is not in the future
	if birthDate.After(time.Now()) {
		return nil, errors.New("birth date cannot be in the future")
	}

	newUser := &model.User{
		Name:            user.Name,
		Email:           user.Email,
		Password:        string(hashed),
		BirthDate:       birthDate,
		RoleID:          2, // Default role ID for regular users
		IsEmailVerified: false,
	}

	err = s.repo.CreateUser(newUser)
	if err != nil {
		return nil, err
	}

	// Add local auth identity (email-based login)
	err = s.repo.AddAuthIdentity(newUser.ID, "local", user.Email)
	if err != nil {
		return nil, err
	}

	// Generate and send verification email
	verificationToken, err := s.tokenService.GenerateVerificationToken(newUser.ID)
	if err == nil {
		s.emailService.SendVerificationEmail(newUser.Email, newUser.Name, verificationToken)
	}

	return newUser, nil
}

func (s *UserService) LoginUser(loginUser dto.LoginUserDTO, userAgent string) (string, string, *model.User, error) {
	user, err := s.AuthenticateUser(loginUser)
	if err != nil {
		return "", "", nil, err
	}

	// Check if email is verified
	if !user.IsEmailVerified {
		return "", "", nil, errors.New("account is not activated, please check your email to activate your account")
	}

	// Create access token
	accessToken, err := s.tokenService.CreateAccessToken(user)
	if err != nil {
		return "", "", nil, err
	}

	// Create refresh token
	refreshToken, err := s.tokenService.GenerateRefreshToken(user.ID, userAgent)
	if err != nil {
		return "", "", nil, err
	}

	return accessToken, refreshToken, user, nil
}

func (s *UserService) AuthenticateUser(loginUser dto.LoginUserDTO) (*model.User, error) {
	user, err := s.repo.GetUserByEmail(loginUser.Email)
	if err != nil {
		return nil, errors.New("user not found")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginUser.Password))
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	return user, nil
}

func (s *UserService) GetUserByEmail(email string) (*model.User, error) {
	return s.repo.GetUserByEmail(email)
}

func (s *UserService) GetUserByID(userID int64) (*model.User, error) {
	return s.repo.GetUserByID(userID)
}

// GetGoogleTokens retrieves Google OAuth tokens for a user
func (s *UserService) GetGoogleTokens(userID int64) (accessToken, refreshToken string, expiry time.Time, err error) {
	return s.repo.GetGoogleTokens(userID)
}

// HasAuthIdentity checks if a user has a specific auth identity provider
func (s *UserService) HasAuthIdentity(userID int64, provider string) (bool, error) {
	return s.repo.HasAuthIdentity(userID, provider)
}

func (s *UserService) ChangePassword(userID int64, oldPassword, newPassword string) error {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	// Verify old password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(oldPassword))
	if err != nil {
		return errors.New("old password is incorrect")
	}

	// Hash new password
	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Update password (this will also clear reset token)
	return s.repo.UpdatePassword(userID, string(hashed))
}

func (s *UserService) SendPasswordResetEmail(email string) error {
	user, err := s.repo.GetUserByEmail(email)
	if err != nil {
		return errors.New("user not found")
	}

	// Generate reset token
	resetToken, err := s.tokenService.GenerateResetToken(user.ID)
	if err != nil {
		return errors.New("failed to generate reset token")
	}

	return s.emailService.SendPasswordResetEmail(user.Email, user.Name, resetToken)
}

func (s *UserService) ResetPassword(token, newPassword string) error {
	user, err := s.tokenService.ValidateResetToken(token)
	if err != nil {
		return errors.New("invalid or expired reset token")
	}

	// Hash new password
	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Update password
	return s.repo.UpdatePassword(user.ID, string(hashed))
}

func (s *UserService) VerifyEmail(token string) (*model.User, error) {
	user, err := s.tokenService.ValidateEmailVerificationToken(token)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *UserService) ResendVerificationEmail(email string) error {
	user, err := s.repo.GetUserByEmail(email)
	if err != nil {
		return errors.New("user not found")
	}

	// Check if already verified
	if user.IsEmailVerified {
		return errors.New("email is already verified")
	}

	// Generate new verification token
	verificationToken, err := s.tokenService.GenerateVerificationToken(user.ID)
	if err != nil {
		return errors.New("failed to generate verification token")
	}

	// Send verification email
	return s.emailService.SendVerificationEmail(user.Email, user.Name, verificationToken)
}

func (s *UserService) GoogleLogin(googleID, email, name string, userAgent string, googleAccessToken, googleRefreshToken string, tokenExpiry time.Time) (string, string, *model.User, error) {
	// Try to find user by Google ID first
	user, err := s.repo.GetUserByAuthProvider("google", googleID)

	// If not found by Google ID, check by email
	if err != nil {
		user, err = s.repo.GetUserByEmail(email)

		// If user doesn't exist at all, create a new one
		if err != nil {
			newUser := &model.User{
				Name:            name,
				Email:           email,
				RoleID:          2,          // Default role ID for regular users
				IsEmailVerified: true,       // Google users are already verified
				BirthDate:       time.Now(), // Default birth date, can be updated later
			}

			err = s.repo.CreateUser(newUser)
			if err != nil {
				return "", "", nil, err
			}

			// Add Google auth identity with OAuth tokens
			if googleAccessToken != "" && googleRefreshToken != "" {
				err = s.repo.AddAuthIdentityWithTokens(newUser.ID, "google", googleID, googleAccessToken, googleRefreshToken, tokenExpiry)
			} else {
				err = s.repo.AddAuthIdentity(newUser.ID, "google", googleID)
			}
			if err != nil {
				return "", "", nil, err
			}

			user = newUser
		} else {
			// User exists with same email
			// Check if they already have a Google auth identity
			hasGoogle, err := s.repo.HasAuthIdentity(user.ID, "google")
			if err != nil {
				return "", "", nil, err
			}

			if !hasGoogle {
				// User exists but doesn't have Google linked yet
				// Check if they have a local auth (password)
				hasLocal, err := s.repo.HasAuthIdentity(user.ID, "local")
				if err != nil {
					return "", "", nil, err
				}

				if hasLocal {
					// User has local auth, need to verify password before linking
					return "", "", user, errors.New("ACCOUNT_LINK_REQUIRED")
				} else {
					// User exists but has no auth methods (shouldn't happen normally)
					// Just add Google auth
					if googleAccessToken != "" && googleRefreshToken != "" {
						err = s.repo.AddAuthIdentityWithTokens(user.ID, "google", googleID, googleAccessToken, googleRefreshToken, tokenExpiry)
					} else {
						err = s.repo.AddAuthIdentity(user.ID, "google", googleID)
					}
					if err != nil {
						return "", "", nil, err
					}
				}
			} else {
				// User already has Google linked, update tokens if provided
				if googleAccessToken != "" && googleRefreshToken != "" {
					_ = s.repo.UpdateGoogleTokens(user.ID, googleAccessToken, googleRefreshToken, tokenExpiry)
				}
			}
		}
	} else {
		// User found by Google ID, update tokens if provided
		if googleAccessToken != "" && googleRefreshToken != "" {
			_ = s.repo.UpdateGoogleTokens(user.ID, googleAccessToken, googleRefreshToken, tokenExpiry)
		}
	}

	// Create access token
	accessToken, err := s.tokenService.CreateAccessToken(user)
	if err != nil {
		return "", "", nil, err
	}

	// Create refresh token
	refreshToken, err := s.tokenService.GenerateRefreshToken(user.ID, userAgent)
	if err != nil {
		return "", "", nil, err
	}

	return accessToken, refreshToken, user, nil
}

func (s *UserService) LinkGoogleAccount(email, password, googleID string, userAgent string) (string, string, *model.User, error) {
	// Get user by email
	user, err := s.repo.GetUserByEmail(email)
	if err != nil {
		return "", "", nil, errors.New("user not found")
	}

	// Verify password (only if user has a password)
	if user.Password != "" {
		err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
		if err != nil {
			return "", "", nil, errors.New("invalid password")
		}
	}

	// Link Google account by adding auth identity
	err = s.repo.AddAuthIdentity(user.ID, "google", googleID)
	if err != nil {
		return "", "", nil, err
	}

	// Create access token
	accessToken, err := s.tokenService.CreateAccessToken(user)
	if err != nil {
		return "", "", nil, err
	}

	// Create refresh token
	refreshToken, err := s.tokenService.GenerateRefreshToken(user.ID, userAgent)
	if err != nil {
		return "", "", nil, err
	}

	return accessToken, refreshToken, user, nil
}

func (s *UserService) UpdateGoogleCalendarTokens(userID int64, accessToken, refreshToken string, expiry time.Time) error {
	// Update the Google auth identity with calendar tokens
	return s.repo.UpdateGoogleCalendarTokens(userID, accessToken, refreshToken, expiry)
}

// GetRoleIDByName retrieves role ID by role name
func (s *UserService) GetRoleIDByName(roleName string) (int64, error) {
	return s.repo.GetRoleIDByName(roleName)
}

// UpdateUserRole updates a user's role
func (s *UserService) UpdateUserRole(userID int64, roleID int64) error {
	return s.repo.UpdateUserRole(userID, roleID)
}
