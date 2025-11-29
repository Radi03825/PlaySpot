package main

import (
	"net/http"
	"os"

	"github.com/Radi03825/PlaySpot/internal/handler"
	http2 "github.com/Radi03825/PlaySpot/internal/http"

	"github.com/Radi03825/PlaySpot/internal/repository"
	"github.com/Radi03825/PlaySpot/internal/service"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	godotenv.Load()

	db, err := repository.ConnectDatabase()
	if err != nil {
		panic("Failed to connect to database: " + err.Error())
	}

	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userService)

	router := http2.NewRouter(userHandler)

	handlerr := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"}, // React URL
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Content-Type"},
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
