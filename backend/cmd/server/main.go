package main

import (
	"net/http"

	"github.com/Radi03825/PlaySpot/internal/handler"
	http2 "github.com/Radi03825/PlaySpot/internal/http"

	"github.com/Radi03825/PlaySpot/internal/repository"
	"github.com/Radi03825/PlaySpot/internal/service"
	"github.com/joho/godotenv"
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

	port := "8080"

	http.ListenAndServe(":"+port, router)

}
