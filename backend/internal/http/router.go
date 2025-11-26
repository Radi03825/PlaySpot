package http

import (
	"github.com/Radi03825/PlaySpot/internal/handler"
	"github.com/gorilla/mux"
)

func NewRouter(userHandler *handler.UserHandler) *mux.Router {
	r := mux.NewRouter()

	r.HandleFunc("/register", userHandler.RegisterUser).Methods("POST")

	return r
}
