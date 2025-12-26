package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Radi03825/PlaySpot/internal/service"
	"github.com/gorilla/mux"
)

type SportComplexHandler struct {
	service *service.SportComplexService
}

func NewSportComplexHandler(service *service.SportComplexService) *SportComplexHandler {
	return &SportComplexHandler{service: service}
}

func (h *SportComplexHandler) GetAllSportComplexes(w http.ResponseWriter, r *http.Request) {
	complexes, err := h.service.GetAllSportComplexes()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to fetch sport complexes"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(complexes)
}

func (h *SportComplexHandler) GetSportComplexByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid sport complex ID"})
		return
	}

	complex, err := h.service.GetSportComplexByID(id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to fetch sport complex"})
		return
	}

	if complex == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Sport complex not found"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(complex)
}

func (h *SportComplexHandler) GetFacilitiesByComplexID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid sport complex ID"})
		return
	}

	facilities, err := h.service.GetFacilitiesByComplexID(id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to fetch facilities"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(facilities)
}
