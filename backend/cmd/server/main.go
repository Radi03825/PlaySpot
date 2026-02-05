package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/Radi03825/PlaySpot/internal/handler"
	http2 "github.com/Radi03825/PlaySpot/internal/http"

	"github.com/Radi03825/PlaySpot/internal/repository"
	"github.com/Radi03825/PlaySpot/internal/service"
	"github.com/Radi03825/PlaySpot/internal/service/storage"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		err = godotenv.Load(filepath.Join("..", ".env"))
		if err != nil {
			err = godotenv.Load(filepath.Join("..", "..", ".env"))
			if err != nil {
				fmt.Println("Warning: Could not load .env file, using environment variables")
			}
		}
	}

	db, err := repository.ConnectDatabase(true, false)
	if err != nil {
		panic("Failed to connect to database: " + err.Error())
	}

	userRepo := repository.NewUserRepository(db)
	tokenRepo := repository.NewTokenRepository(db)
	sportComplexRepo := repository.NewSportComplexRepository(db)
	facilityRepo := repository.NewFacilityRepository(db)
	metadataRepo := repository.NewMetadataRepository(db)
	reservationRepo := repository.NewReservationRepository(db)
	imageRepo := repository.NewImageRepository(db)
	paymentRepo := repository.NewPaymentRepository(db)
	eventRepo := repository.NewEventRepository(db)
	reviewRepo := repository.NewReviewRepository(db)

	// Create email service
	emailService := service.NewEmailService()

	// Create image storage provider
	imageStorage := storage.NewCloudinaryStorage()

	// Create Image service
	imageService := service.NewImageService(imageStorage, imageRepo)

	// Create Google Calendar service
	googleClientID := os.Getenv("GOOGLE_CLIENT_ID")
	googleClientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	if googleClientSecret == "" {
		fmt.Println("Warning: GOOGLE_CLIENT_SECRET not set, Google Calendar integration will be limited")
	}
	googleCalendarService := service.NewGoogleCalendarService(googleClientID, googleClientSecret)

	// Create token service
	tokenService := service.NewTokenService(tokenRepo, userRepo)

	// Create user service
	userService := service.NewUserService(userRepo, tokenService, emailService)

	// Create facility service
	facilityService := service.NewFacilityService(facilityRepo, userService, imageService)

	// Create sport complex service
	sportComplexService := service.NewSportComplexService(sportComplexRepo, facilityService, userService, imageService)

	// Set the sport complex service on facility service
	facilityService.SetSportComplexService(sportComplexService)

	// Create reservation service (needs userService, facilityService, and googleCalendarService)
	reservationService := service.NewReservationService(reservationRepo, userService, facilityService, googleCalendarService)

	// Create payment service
	paymentService := service.NewPaymentService(paymentRepo, reservationRepo, facilityService, emailService, googleCalendarService, userService)

	// Create event service
	eventService := service.NewEventService(eventRepo)

	// Create review service
	reviewService := service.NewReviewService(reviewRepo)

	//// Create and start reminder service
	//reminderService := service.NewReminderService(reservationRepo, userService, facilityService, sportComplexService, emailService)
	//reminderService.Start()

	// Create handlers
	userHandler := handler.NewUserHandler(userService, tokenService, googleCalendarService)
	sportComplexHandler := handler.NewSportComplexHandler(sportComplexService)
	facilityHandler := handler.NewFacilityHandler(facilityService, metadataRepo)
	reservationHandler := handler.NewReservationHandler(reservationService)
	imageHandler := handler.NewImageHandler(imageService)
	paymentHandler := handler.NewPaymentHandler(paymentService)
	eventHandler := handler.NewEventHandler(eventService)
	reviewHandler := handler.NewReviewHandler(reviewService)

	router := http2.NewRouter(userHandler, facilityHandler, sportComplexHandler, reservationHandler, imageHandler, paymentHandler, eventHandler, reviewHandler)

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	handlerr := cors.New(cors.Options{
		AllowedOrigins:   []string{frontendURL},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}).Handler(router)

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8081"
	}

	fmt.Printf("Server starting on :%s\n", port)
	fmt.Printf("Allowing CORS from: %s\n", frontendURL)
	err = http.ListenAndServe(":"+port, handlerr)
	if err != nil {
		fmt.Printf("Server error: %v\n", err)
		panic(err)
	}

}
