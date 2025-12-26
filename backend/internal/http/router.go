package http

import (
	"github.com/Radi03825/PlaySpot/internal/handler"
	"github.com/Radi03825/PlaySpot/internal/middleware"
	"github.com/gorilla/mux"
)

func NewRouter(userHandler *handler.UserHandler, sportComplexHandler *handler.SportComplexHandler, facilityHandler *handler.FacilityHandler) *mux.Router {
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

	// Sport Complex routes (public)
	api.HandleFunc("/sport-complexes", sportComplexHandler.GetAllSportComplexes).Methods("GET")
	api.HandleFunc("/sport-complexes/{id}", sportComplexHandler.GetSportComplexByID).Methods("GET")
	api.HandleFunc("/sport-complexes/{id}/facilities", sportComplexHandler.GetFacilitiesByComplexID).Methods("GET")

	// Facility routes (public)
	api.HandleFunc("/facilities", facilityHandler.GetAllFacilities).Methods("GET")
	api.HandleFunc("/facilities/{id}", facilityHandler.GetFacilityByID).Methods("GET")

	// Protected routes
	protected := api.PathPrefix("").Subrouter()
	protected.Use(middleware.JWTAuthMiddleware)
	protected.HandleFunc("/profile", userHandler.GetProfile).Methods("GET")
	protected.HandleFunc("/change-password", userHandler.ChangePassword).Methods("POST")
	protected.HandleFunc("/active-devices", userHandler.GetActiveDevices).Methods("GET")
	protected.HandleFunc("/logout-all", userHandler.LogoutAllDevices).Methods("POST")

	return router
}
