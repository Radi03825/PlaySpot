package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/Radi03825/PlaySpot/internal/dto"
	"github.com/Radi03825/PlaySpot/internal/service"
)

type UserHandler struct {
	service *service.UserService
}

type ErrorResponse struct {
	Error string `json:"error"`
	Field string `json:"field,omitempty"`
}

func NewUserHandler(service *service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (u *UserHandler) RegisterUser(w http.ResponseWriter, r *http.Request) {
	var req dto.RegisterUserDTO
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request payload"})
		return
	}

	user, err := u.service.RegisterUser(req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")

		// Check for duplicate email error
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "exists") {
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(ErrorResponse{
				Error: "User with this email already exists",
				Field: "email",
			})
			return
		}

		// Check for invalid birth date
		if strings.Contains(err.Error(), "birth date") {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(ErrorResponse{
				Error: err.Error(),
				Field: "birth_date",
			})
			return
		}

		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	user.Password = "" // Hide password in response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (u *UserHandler) LoginUser(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginUserDTO
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request payload"})
		return
	}

	token, user, err := u.service.LoginUser(req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "Invalid email or password",
			Field: "general",
		})
		return
	}

	user.Password = "" // Hide password in response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
		"user":  user,
	})
}
