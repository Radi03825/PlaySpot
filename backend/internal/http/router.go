package http

import (
	"github.com/Radi03825/PlaySpot/internal/handler"
	"github.com/gorilla/mux"
)

func NewRouter(userHandler *handler.UserHandler) *mux.Router {
	router := mux.NewRouter()

	api := router.PathPrefix("/api").Subrouter()

	api.HandleFunc("/register", userHandler.RegisterUser).Methods("POST")
	api.HandleFunc("/login", userHandler.LoginUser).Methods("POST")

	return router
}
