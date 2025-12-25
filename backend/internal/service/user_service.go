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

func (s *UserService) GetUserByID(id int64) (*model.User, error) {
	return s.repo.GetUserByID(id)
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
