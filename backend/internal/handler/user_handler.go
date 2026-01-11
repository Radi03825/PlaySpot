package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/Radi03825/PlaySpot/internal/dto"
	"github.com/Radi03825/PlaySpot/internal/middleware"
	"github.com/Radi03825/PlaySpot/internal/service"
	"google.golang.org/api/idtoken"
)

type UserHandler struct {
	service               *service.UserService
	tokenService          *service.TokenService
	googleCalendarService *service.GoogleCalendarService
}

type ErrorResponse struct {
	Error string `json:"error"`
	Field string `json:"field,omitempty"`
}

type GoogleIDTokenPayload struct {
	Subject string
	Email   string
	Name    string
}

func NewUserHandler(service *service.UserService, tokenService *service.TokenService, googleCalendarService *service.GoogleCalendarService) *UserHandler {
	return &UserHandler{
		service:               service,
		tokenService:          tokenService,
		googleCalendarService: googleCalendarService,
	}
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

	userAgent := r.Header.Get("User-Agent")

	accessToken, refreshToken, user, err := u.service.LoginUser(req, userAgent)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")

		// Check if account is not activated
		if strings.Contains(err.Error(), "not activated") || strings.Contains(err.Error(), "check your email") {
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(ErrorResponse{
				Error: "Account is not activated. Please check your email to activate your account.",
				Field: "email_verification",
			})
			return
		}

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
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user":          user,
	})
}

func (u *UserHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	var req dto.GoogleLoginDTO
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request payload"})
		return
	}

	var payload *GoogleIDTokenPayload
	var googleAccessToken, googleRefreshToken string
	var tokenExpiry time.Time

	// Handle auth-code flow (for calendar access - optional)
	if req.Code != "" {
		// Only process calendar tokens if the scope includes calendar
		if strings.Contains(req.Scope, "calendar") {
			token, err := u.googleCalendarService.ExchangeCodeForTokens(req.Code)
			if err != nil {
				// If calendar exchange fails, fall back to regular login without calendar
				// This prevents login failure if calendar verification is pending
				if req.IDToken != "" {
					payload, err = verifyGoogleIDToken(req.IDToken)
					if err != nil {
						w.Header().Set("Content-Type", "application/json")
						w.WriteHeader(http.StatusUnauthorized)
						json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid Google token"})
						return
					}
				} else {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusUnauthorized)
					json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to exchange authorization code"})
					return
				}
			} else {
				googleAccessToken = token.AccessToken
				googleRefreshToken = token.RefreshToken
				tokenExpiry = token.Expiry

				if token.Extra("id_token") != nil {
					idToken := token.Extra("id_token").(string)
					payload, err = verifyGoogleIDToken(idToken)
					if err != nil {
						w.Header().Set("Content-Type", "application/json")
						w.WriteHeader(http.StatusUnauthorized)
						json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid Google token"})
						return
					}
				} else {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusUnauthorized)
					json.NewEncoder(w).Encode(ErrorResponse{Error: "No ID token in response"})
					return
				}
			}
		} else {
			// Code provided but no calendar scope - just use the ID token
			if req.IDToken != "" {
				payload, err = verifyGoogleIDToken(req.IDToken)
				if err != nil {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusUnauthorized)
					json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid Google token"})
					return
				}
			} else {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusBadRequest)
				json.NewEncoder(w).Encode(ErrorResponse{Error: "ID token required"})
				return
			}
		}
	} else if req.IDToken != "" {
		// Handle ID token flow (standard login without calendar)
		payload, err = verifyGoogleIDToken(req.IDToken)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid Google token"})
			return
		}
	} else {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Either code or id_token is required"})
		return
	}

	userAgent := r.Header.Get("User-Agent")

	accessToken, refreshToken, user, err := u.service.GoogleLogin(
		payload.Subject,
		payload.Email,
		payload.Name,
		userAgent,
		googleAccessToken,
		googleRefreshToken,
		tokenExpiry,
	)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")

		// Check if account linking is required
		if err.Error() == "ACCOUNT_LINK_REQUIRED" {
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error":         "Account linking required",
				"link_required": true,
				"email":         payload.Email,
				"google_id":     payload.Subject,
				"message":       "An account with this email already exists. Please enter your password to link your Google account.",
			})
			return
		}

		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	user.Password = "" // Hide password in response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"access_token":        accessToken,
		"refresh_token":       refreshToken,
		"user":                user,
		"has_calendar_access": googleAccessToken != "",
	})
}

func (u *UserHandler) LinkGoogleAccount(w http.ResponseWriter, r *http.Request) {
	var req dto.LinkGoogleAccountDTO
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request payload"})
		return
	}

	userAgent := r.Header.Get("User-Agent")

	accessToken, refreshToken, user, err := u.service.LinkGoogleAccount(
		req.Email,
		req.Password,
		req.GoogleID,
		userAgent,
	)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")

		if strings.Contains(err.Error(), "password") {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(ErrorResponse{
				Error: "Invalid password",
				Field: "password",
			})
			return
		}

		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	user.Password = "" // Hide password in response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user":          user,
		"message":       "Google account linked successfully! You can now login with either method.",
	})
}

func (u *UserHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req dto.ForgotPasswordDTO
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request payload"})
		return
	}

	err = u.service.SendPasswordResetEmail(req.Email)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "User not found"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Password reset instructions have been sent to your email",
	})
}

func (u *UserHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req dto.ResetPasswordDTO
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request payload"})
		return
	}

	err = u.service.ResetPassword(req.Token, req.NewPassword)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Password reset successfully",
	})
}

func (u *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Unauthorized"})
		return
	}

	user, err := u.service.GetUserByID(claims.UserID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "User not found"})
		return
	}

	user.Password = "" // Hide password in response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(user)
}

func (u *UserHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Unauthorized"})
		return
	}

	var req dto.ChangePasswordDTO
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request payload"})
		return
	}

	err = u.service.ChangePassword(claims.UserID, req.OldPassword, req.NewPassword)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		if strings.Contains(err.Error(), "incorrect") {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(ErrorResponse{
				Error: err.Error(),
				Field: "old_password",
			})
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Password changed successfully",
	})
}

func (u *UserHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request payload"})
		return
	}

	userAgent := r.Header.Get("User-Agent")

	accessToken, err := u.tokenService.RefreshAccessToken(req.RefreshToken, userAgent)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid or expired refresh token"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"access_token": accessToken,
	})
}

func (u *UserHandler) GetActiveDevices(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Unauthorized"})
		return
	}

	devices, err := u.tokenService.GetUserActiveDevices(claims.UserID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to get active devices"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(devices)
}

func (u *UserHandler) LogoutAllDevices(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Unauthorized"})
		return
	}

	err := u.tokenService.RevokeAllUserTokens(claims.UserID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to logout from all devices"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Logged out from all devices successfully",
	})
}

func (u *UserHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Verification token is required"})
		return
	}

	user, err := u.service.VerifyEmail(token)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")

		// Check if account is already activated
		if strings.Contains(err.Error(), "already activated") {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message":          "Your account is already activated! You can login now.",
				"already_verified": true,
				"user":             user,
			})
			return
		}

		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	user.Password = "" // Hide password in response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Email verified successfully! You can now login to your account.",
		"user":    user,
	})
}

func (u *UserHandler) ResendVerificationEmail(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request payload"})
		return
	}

	if req.Email == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{
			Error: "Email is required",
			Field: "email",
		})
		return
	}

	err = u.service.ResendVerificationEmail(req.Email)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		if strings.Contains(err.Error(), "already verified") {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(ErrorResponse{Error: "Email is already verified"})
			return
		}
		if strings.Contains(err.Error(), "not found") {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(ErrorResponse{Error: "User not found"})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to send verification email"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Verification email sent successfully. Please check your inbox.",
	})
}

func (u *UserHandler) ConnectGoogleCalendar(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Unauthorized"})
		return
	}

	var req struct {
		Code string `json:"code"`
	}
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request payload"})
		return
	}

	token, err := u.googleCalendarService.ExchangeCodeForTokens(req.Code)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)

		println("Error exchanging code for tokens:", err.Error())
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to connect Google Calendar: " + err.Error()})
		return
	}

	// Update user's Google Calendar tokens
	err = u.service.UpdateGoogleCalendarTokens(
		claims.UserID,
		token.AccessToken,
		token.RefreshToken,
		token.Expiry,
	)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)

		println("Error saving calendar credentials:", err.Error())
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to save calendar credentials: " + err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Google Calendar connected successfully",
	})
}

func verifyGoogleIDToken(idToken string) (*GoogleIDTokenPayload, error) {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")

	payload, err := idtoken.Validate(context.Background(), idToken, clientID)
	if err != nil {
		return nil, err
	}

	email, _ := payload.Claims["email"].(string)
	name, _ := payload.Claims["name"].(string)

	return &GoogleIDTokenPayload{
		Subject: payload.Subject,
		Email:   email,
		Name:    name,
	}, nil
}
