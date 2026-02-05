package http

import (
	"github.com/Radi03825/PlaySpot/internal/handler"
	"github.com/Radi03825/PlaySpot/internal/middleware"
	"github.com/gorilla/mux"
)

func NewRouter(userHandler *handler.UserHandler, facilityHandler *handler.FacilityHandler, sportComplexHandler *handler.SportComplexHandler, reservationHandler *handler.ReservationHandler, imageHandler *handler.ImageHandler, paymentHandler *handler.PaymentHandler, eventHandler *handler.EventHandler, reviewHandler *handler.ReviewHandler) *mux.Router {
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
	api.HandleFunc("/facilities/metadata/sports", facilityHandler.GetSports).Methods("GET")
	api.HandleFunc("/facilities/metadata/surfaces", facilityHandler.GetSurfaces).Methods("GET")
	api.HandleFunc("/facilities/metadata/environments", facilityHandler.GetEnvironments).Methods("GET")
	api.HandleFunc("/facilities/metadata/cities", facilityHandler.GetCities).Methods("GET")

	// Public browsing routes
	api.HandleFunc("/facilities", facilityHandler.GetAllFacilities).Methods("GET")
	api.HandleFunc("/facilities/search", facilityHandler.SearchFacilities).Methods("GET")
	api.HandleFunc("/facilities/{id:[0-9]+}", facilityHandler.GetFacilityByID).Methods("GET")
	api.HandleFunc("/facilities/{id:[0-9]+}/availability", reservationHandler.GetFacilityAvailability).Methods("GET")
	api.HandleFunc("/sport-complexes", sportComplexHandler.GetAllSportComplexes).Methods("GET")
	api.HandleFunc("/sport-complexes/{id:[0-9]+}", sportComplexHandler.GetSportComplexByID).Methods("GET")
	api.HandleFunc("/sport-complexes/{id:[0-9]+}/facilities", facilityHandler.GetFacilitiesByComplexID).Methods("GET")

	// Public image routes (allow viewing images without authentication)
	api.HandleFunc("/images/{entityType}/{entityId:[0-9]+}", imageHandler.GetEntityImages).Methods("GET")

	// Public event routes (viewing events)
	api.HandleFunc("/events", eventHandler.GetAllEvents).Methods("GET")
	api.HandleFunc("/events/{id:[0-9]+}", eventHandler.GetEventByID).Methods("GET")
	api.HandleFunc("/events/{id:[0-9]+}/participants", eventHandler.GetEventParticipants).Methods("GET")

	// Public review routes (viewing reviews)
	api.HandleFunc("/facilities/{id:[0-9]+}/reviews", reviewHandler.GetReviewsByFacility).Methods("GET")
	api.HandleFunc("/facilities/{id:[0-9]+}/reviews/stats", reviewHandler.GetFacilityReviewStats).Methods("GET")

	// Protected routes (require authentication)
	protected := api.PathPrefix("").Subrouter()
	protected.Use(middleware.JWTAuthMiddleware)

	// Image upload routes (authenticated users can upload images)
	protected.HandleFunc("/upload/image", imageHandler.UploadImage).Methods("POST")
	protected.HandleFunc("/upload/images", imageHandler.UploadMultipleImages).Methods("POST")

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
	protected.HandleFunc("/facilities/{id:[0-9]+}", facilityHandler.UpdateFacility).Methods("PUT")
	// Reservation routes (authenticated users)
	protected.HandleFunc("/reservations", reservationHandler.CreateReservation).Methods("POST")
	protected.HandleFunc("/reservations/user", reservationHandler.GetUserReservations).Methods("GET")
	protected.HandleFunc("/reservations/upcoming", reservationHandler.GetUpcomingConfirmedReservations).Methods("GET")
	protected.HandleFunc("/reservations/{id:[0-9]+}/cancel", reservationHandler.CancelReservation).Methods("PUT", "POST")

	// Payment routes (authenticated users)
	protected.HandleFunc("/reservations/{id:[0-9]+}/payment", paymentHandler.GetPaymentByReservation).Methods("GET")
	protected.HandleFunc("/reservations/{id:[0-9]+}/pay", paymentHandler.ProcessPayment).Methods("POST")

	// Event routes (authenticated users)
	protected.HandleFunc("/events", eventHandler.CreateEvent).Methods("POST")
	protected.HandleFunc("/events/{id:[0-9]+}", eventHandler.UpdateEvent).Methods("PUT")
	protected.HandleFunc("/events/{id:[0-9]+}", eventHandler.DeleteEvent).Methods("DELETE")
	protected.HandleFunc("/events/{id:[0-9]+}/join", eventHandler.JoinEvent).Methods("POST")
	protected.HandleFunc("/events/{id:[0-9]+}/leave", eventHandler.LeaveEvent).Methods("POST")
	protected.HandleFunc("/users/me/events", eventHandler.GetUserEvents).Methods("GET")
	protected.HandleFunc("/users/me/events/joined", eventHandler.GetUserJoinedEvents).Methods("GET")

	// Review routes (authenticated users)
	protected.HandleFunc("/reviews", reviewHandler.CreateReview).Methods("POST")
	protected.HandleFunc("/reviews/{id:[0-9]+}", reviewHandler.UpdateReview).Methods("PUT")
	protected.HandleFunc("/reviews/{id:[0-9]+}", reviewHandler.DeleteReview).Methods("DELETE")
	protected.HandleFunc("/facilities/{id:[0-9]+}/reviews/my", reviewHandler.GetUserReviewForFacility).Methods("GET")
	protected.HandleFunc("/facilities/{id:[0-9]+}/can-review", reviewHandler.CanUserReview).Methods("GET")

	// Admin routes - manage all pending items
	adminRoutes := protected.PathPrefix("/admin").Subrouter()
	adminRoutes.Use(middleware.AdminRoleMiddleware)
	adminRoutes.HandleFunc("/facilities/pending", facilityHandler.GetPendingFacilities).Methods("GET")
	adminRoutes.HandleFunc("/facilities/{id}/verify", facilityHandler.VerifyFacility).Methods("POST")
	adminRoutes.HandleFunc("/facilities/{id}/toggle-status", facilityHandler.ToggleFacilityStatus).Methods("POST")
	adminRoutes.HandleFunc("/sport-complexes/pending", sportComplexHandler.GetPendingComplexes).Methods("GET")
	adminRoutes.HandleFunc("/sport-complexes/{id}/verify", sportComplexHandler.VerifyComplex).Methods("POST")
	adminRoutes.HandleFunc("/sport-complexes/{id}/toggle-status", sportComplexHandler.ToggleComplexStatus).Methods("POST")

	return router
}
