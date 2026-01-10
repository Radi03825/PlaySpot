package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Radi03825/PlaySpot/internal/dto"
	"github.com/Radi03825/PlaySpot/internal/middleware"
	"github.com/Radi03825/PlaySpot/internal/model"
	"github.com/Radi03825/PlaySpot/internal/repository"
	"github.com/Radi03825/PlaySpot/internal/service"
	"github.com/gorilla/mux"
)

type FacilityHandler struct {
	service      *service.FacilityService
	metadataRepo *repository.MetadataRepository
}

func NewFacilityHandler(service *service.FacilityService, metadataRepo *repository.MetadataRepository) *FacilityHandler {
	return &FacilityHandler{
		service:      service,
		metadataRepo: metadataRepo,
	}
}

func (h *FacilityHandler) GetAllFacilities(w http.ResponseWriter, r *http.Request) {
	facilities, err := h.service.GetAllFacilities()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(facilities)
}

func (h *FacilityHandler) SearchFacilities(w http.ResponseWriter, r *http.Request) {
	queryParams := r.URL.Query()

	var params model.FacilitySearchParams
	params.City = queryParams.Get("city")
	params.Sport = queryParams.Get("sport")
	params.Surface = queryParams.Get("surface")
	params.Environment = queryParams.Get("environment")
	params.SortBy = queryParams.Get("sort_by")
	params.SortOrder = queryParams.Get("sort_order")

	if minCapStr := queryParams.Get("min_capacity"); minCapStr != "" {
		if minCap, err := strconv.Atoi(minCapStr); err == nil {
			params.MinCapacity = minCap
		}
	}

	if maxCapStr := queryParams.Get("max_capacity"); maxCapStr != "" {
		if maxCap, err := strconv.Atoi(maxCapStr); err == nil {
			params.MaxCapacity = maxCap
		}
	}

	facilities, err := h.service.SearchFacilities(params)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(facilities)
}

func (h *FacilityHandler) GetFacilityByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid ID"})
		return
	}

	facility, err := h.service.GetFacilityByID(id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(facility)
}

func (h *FacilityHandler) GetFacilitiesByComplexID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid ID"})
		return
	}

	facilities, err := h.service.GetFacilitiesByComplexID(id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(facilities)
}

func (h *FacilityHandler) CreateFacility(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateFacilityDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	facility, err := h.service.CreateFacility(
		req.Name,
		req.SportComplexID,
		req.CategoryID,
		req.SurfaceID,
		req.EnvironmentID,
		req.Description,
		req.Capacity,
		claims.UserID,
	)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(facility)
}

func (h *FacilityHandler) GetMyFacilities(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	facilities, err := h.service.GetMyFacilities(claims.UserID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(facilities)
}

func (h *FacilityHandler) GetPendingFacilities(w http.ResponseWriter, r *http.Request) {
	facilities, err := h.service.GetPendingFacilities()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(facilities)
}

func (h *FacilityHandler) VerifyFacility(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid ID"})
		return
	}

	if err := h.service.VerifyFacility(id); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Facility verified successfully"})
}

func (h *FacilityHandler) ToggleFacilityStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid ID"})
		return
	}

	var req struct {
		IsActive bool `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	if err := h.service.ToggleFacilityStatus(id, req.IsActive); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Facility status toggled successfully"})
}

func (h *FacilityHandler) GetCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.metadataRepo.GetCategories()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

func (h *FacilityHandler) GetSports(w http.ResponseWriter, r *http.Request) {
	sports, err := h.metadataRepo.GetSports()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sports)
}

func (h *FacilityHandler) GetSurfaces(w http.ResponseWriter, r *http.Request) {
	surfaces, err := h.metadataRepo.GetSurfaces()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(surfaces)
}

func (h *FacilityHandler) GetEnvironments(w http.ResponseWriter, r *http.Request) {
	environments, err := h.metadataRepo.GetEnvironments()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(environments)
}

func (h *FacilityHandler) GetCities(w http.ResponseWriter, r *http.Request) {
	cities, err := h.metadataRepo.GetCities()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cities)
}
