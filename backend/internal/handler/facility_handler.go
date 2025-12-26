package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Radi03825/PlaySpot/internal/service"
	"github.com/gorilla/mux"
)

type FacilityHandler struct {
	service *service.FacilityService
}

func NewFacilityHandler(service *service.FacilityService) *FacilityHandler {
	return &FacilityHandler{service: service}
}

func (h *FacilityHandler) GetAllFacilities(w http.ResponseWriter, r *http.Request) {
	facilities, err := h.service.GetAllFacilities()
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

func (h *FacilityHandler) GetFacilityByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid facility ID"})
		return
	}

	facility, err := h.service.GetFacilityByID(id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to fetch facility"})
		return
	}

	if facility == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Facility not found"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(facility)
}
