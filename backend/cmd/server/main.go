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
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	// Try to load .env from multiple locations
	err := godotenv.Load()
	if err != nil {
		// Try loading from parent directory (if running from backend/)
		err = godotenv.Load(filepath.Join("..", ".env"))
		if err != nil {
			// Try loading from project root (if running from anywhere else)
			err = godotenv.Load(filepath.Join("..", "..", ".env"))
			if err != nil {
				fmt.Println("Warning: Could not load .env file, using environment variables")
			}
		}
	}

	db, err := repository.ConnectDatabase(true, true)
	if err != nil {
		panic("Failed to connect to database: " + err.Error())
	}

	userRepo := repository.NewUserRepository(db)
	tokenRepo := repository.NewTokenRepository(db)
	sportComplexRepo := repository.NewSportComplexRepository(db)
	facilityRepo := repository.NewFacilityRepository(db)

	// Create email service
	emailService := service.NewEmailService()

	// Create token service first as it's needed by user service
	tokenService := service.NewTokenService(tokenRepo, userRepo)

	// Create user service with token service and email service
	userService := service.NewUserService(userRepo, tokenService, emailService)

	// Create sport complex and facility services
	sportComplexService := service.NewSportComplexService(sportComplexRepo)
	facilityService := service.NewFacilityService(facilityRepo)

	// Create handlers
	userHandler := handler.NewUserHandler(userService, tokenService)
	sportComplexHandler := handler.NewSportComplexHandler(sportComplexService)
	facilityHandler := handler.NewFacilityHandler(facilityService)

	router := http2.NewRouter(userHandler, sportComplexHandler, facilityHandler)

	handlerr := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"}, // React URL
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}).Handler(router)

	port := os.Getenv("BE_PORT")

	err = http.ListenAndServe(":"+port, handlerr)
	if err != nil {
		return
	} else {
		println("Server is running on port " + port)
	}

}
