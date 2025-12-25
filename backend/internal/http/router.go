package http

import (
	"github.com/Radi03825/PlaySpot/internal/handler"
	"github.com/Radi03825/PlaySpot/internal/middleware"
	"github.com/gorilla/mux"
)

func NewRouter(userHandler *handler.UserHandler) *mux.Router {
	router := mux.NewRouter()

	api := router.PathPrefix("/api").Subrouter()

	// Public routes
	api.HandleFunc("/register", userHandler.RegisterUser).Methods("POST")
	api.HandleFunc("/login", userHandler.LoginUser).Methods("POST")
	api.HandleFunc("/forgot-password", userHandler.ForgotPassword).Methods("POST")
	api.HandleFunc("/reset-password", userHandler.ResetPassword).Methods("POST")
	api.HandleFunc("/refresh-token", userHandler.RefreshToken).Methods("POST")
	api.HandleFunc("/verify-email", userHandler.VerifyEmail).Methods("GET")
	api.HandleFunc("/resend-verification", userHandler.ResendVerificationEmail).Methods("POST")

	// Protected routes
	protected := api.PathPrefix("").Subrouter()
	protected.Use(middleware.JWTAuthMiddleware)
	protected.HandleFunc("/profile", userHandler.GetProfile).Methods("GET")
	protected.HandleFunc("/change-password", userHandler.ChangePassword).Methods("POST")
	protected.HandleFunc("/active-devices", userHandler.GetActiveDevices).Methods("GET")
	protected.HandleFunc("/logout-all", userHandler.LogoutAllDevices).Methods("POST")

	return router
}
