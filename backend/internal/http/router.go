package http

import (
	"github.com/Radi03825/PlaySpot/internal/handler"
	"github.com/Radi03825/PlaySpot/internal/middleware"
	"github.com/gorilla/mux"
)

func NewRouter(userHandler *handler.UserHandler, facilityHandler *handler.FacilityHandler, sportComplexHandler *handler.SportComplexHandler, reservationHandler *handler.ReservationHandler) *mux.Router {
	router := mux.NewRouter()
	api := router.PathPrefix("/api").Subrouter()

	// Public routes
	api.HandleFunc("/register", userHandler.RegisterUser).Methods("POST")
	api.HandleFunc("/login", userHandler.LoginUser).Methods("POST")
	api.HandleFunc("/google-login", userHandler.GoogleLogin).Methods("POST")
	api.HandleFunc("/link-google-account", userHandler.LinkGoogleAccount).Methods("POST")
	api.HandleFunc("/forgot-password", userHandler.ForgotPassword).Methods("POST")
	api.HandleFunc("/reset-password", userHandler.ResetPassword).Methods("POST")
	api.HandleFunc("/refresh-token", userHandler.RefreshToken).Methods("POST")
	api.HandleFunc("/verify-email", userHandler.VerifyEmail).Methods("GET")
	api.HandleFunc("/resend-verification", userHandler.ResendVerificationEmail).Methods("POST")

	// Public metadata routes
	api.HandleFunc("/facilities/metadata/categories", facilityHandler.GetCategories).Methods("GET")
	api.HandleFunc("/facilities/metadata/surfaces", facilityHandler.GetSurfaces).Methods("GET")
	api.HandleFunc("/facilities/metadata/environments", facilityHandler.GetEnvironments).Methods("GET")
	api.HandleFunc("/facilities/metadata/cities", facilityHandler.GetCities).Methods("GET")

	// Public browsing routes (register GET routes first)
	api.HandleFunc("/facilities", facilityHandler.GetAllFacilities).Methods("GET")
	api.HandleFunc("/facilities/search", facilityHandler.SearchFacilities).Methods("GET")
	api.HandleFunc("/facilities/{id:[0-9]+}", facilityHandler.GetFacilityByID).Methods("GET")
	api.HandleFunc("/facilities/{id:[0-9]+}/availability", reservationHandler.GetFacilityAvailability).Methods("GET")
	api.HandleFunc("/sport-complexes", sportComplexHandler.GetAllSportComplexes).Methods("GET")
	api.HandleFunc("/sport-complexes/{id:[0-9]+}", sportComplexHandler.GetSportComplexByID).Methods("GET")
	api.HandleFunc("/sport-complexes/{id:[0-9]+}/facilities", facilityHandler.GetFacilitiesByComplexID).Methods("GET")

	// Protected routes (require authentication)
	protected := api.PathPrefix("").Subrouter()
	protected.Use(middleware.JWTAuthMiddleware)

	// User routes
	protected.HandleFunc("/profile", userHandler.GetProfile).Methods("GET")
	protected.HandleFunc("/change-password", userHandler.ChangePassword).Methods("POST")
	protected.HandleFunc("/connect-google-calendar", userHandler.ConnectGoogleCalendar).Methods("POST")
	protected.HandleFunc("/active-devices", userHandler.GetActiveDevices).Methods("GET")
	protected.HandleFunc("/logout-all", userHandler.LogoutAllDevices).Methods("POST")

	// Manager routes - manage own facilities/complexes
	protected.HandleFunc("/sport-complexes/my", sportComplexHandler.GetMyComplexes).Methods("GET")
	protected.HandleFunc("/facilities/my", facilityHandler.GetMyFacilities).Methods("GET")
	protected.HandleFunc("/sport-complexes", sportComplexHandler.CreateSportComplex).Methods("POST")
	protected.HandleFunc("/facilities", facilityHandler.CreateFacility).Methods("POST")
	// Reservation routes (authenticated users)
	protected.HandleFunc("/reservations", reservationHandler.CreateReservation).Methods("POST")
	protected.HandleFunc("/reservations/user", reservationHandler.GetUserReservations).Methods("GET")
	protected.HandleFunc("/reservations/{id:[0-9]+}/cancel", reservationHandler.CancelReservation).Methods("PUT", "POST")

	// Admin routes - manage all pending items
	adminRoutes := protected.PathPrefix("/admin").Subrouter()
	// TODO: Add admin role check middleware here
	adminRoutes.HandleFunc("/facilities/pending", facilityHandler.GetPendingFacilities).Methods("GET")
	adminRoutes.HandleFunc("/facilities/{id}/verify", facilityHandler.VerifyFacility).Methods("POST")
	adminRoutes.HandleFunc("/facilities/{id}/toggle-status", facilityHandler.ToggleFacilityStatus).Methods("POST")
	adminRoutes.HandleFunc("/sport-complexes/pending", sportComplexHandler.GetPendingComplexes).Methods("GET")
	adminRoutes.HandleFunc("/sport-complexes/{id}/verify", sportComplexHandler.VerifyComplex).Methods("POST")
	adminRoutes.HandleFunc("/sport-complexes/{id}/toggle-status", sportComplexHandler.ToggleComplexStatus).Methods("POST")

	return router
}
