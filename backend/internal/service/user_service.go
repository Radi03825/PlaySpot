package service

import (
	"errors"
	"os"
	"time"

	"github.com/Radi03825/PlaySpot/internal/dto"
	"github.com/Radi03825/PlaySpot/internal/model"
	"github.com/Radi03825/PlaySpot/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

// TODO: Add error handling for duplicate emails
// TODO: Add validation for email format and password strength
// TODO: Send confirmation email after registration and before activating account
func (s *UserService) RegisterUser(user dto.RegisterUserDTO) (*model.User, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	newUser := &model.User{
		Name:     user.Name,
		Email:    user.Email,
		Password: string(hashed),
		RoleID:   2, // Default role ID for regular users
	}

	err = s.repo.CreateUser(newUser)
	if err != nil {
		return nil, err
	}

	return newUser, nil
}

func (s *UserService) LoginUser(loginUser dto.LoginUserDTO) (string, *model.User, error) {
	user, err := s.AuthenticateUser(loginUser)
	if err != nil {
		return "", nil, err
	}

	token, err := createToken(user)
	if err != nil {
		return "", nil, err
	}

	return token, user, nil
}

func createToken(user *model.User) (string, error) {
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
