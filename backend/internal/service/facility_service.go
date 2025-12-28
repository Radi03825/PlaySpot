package service

import (
	"github.com/Radi03825/PlaySpot/internal/model"
	"github.com/Radi03825/PlaySpot/internal/repository"
)

type FacilityService struct {
	repo *repository.FacilityRepository
}

func NewFacilityService(repo *repository.FacilityRepository) *FacilityService {
	return &FacilityService{repo: repo}
}

func (s *FacilityService) CreateFacility(name string, sportComplexID *int64, categoryID, surfaceID, environmentID int64, description string, capacity int, managerID int64) (*model.Facility, error) {
	return s.repo.CreateFacility(name, sportComplexID, categoryID, surfaceID, environmentID, description, capacity, managerID)
}

func (s *FacilityService) GetAllFacilities() ([]model.FacilityDetails, error) {
	return s.repo.GetAllFacilities()
}

func (s *FacilityService) GetFacilityByID(id int64) (*model.FacilityDetails, error) {
	return s.repo.GetFacilityByID(id)
}

func (s *FacilityService) GetFacilitiesByComplexID(complexID int64) ([]model.FacilityDetails, error) {
	return s.repo.GetFacilitiesByComplexID(complexID)
}

func (s *FacilityService) GetMyFacilities(managerID int64) ([]model.FacilityDetails, error) {
	return s.repo.GetFacilitiesByManagerID(managerID)
}

func (s *FacilityService) GetPendingFacilities() ([]model.FacilityDetails, error) {
	return s.repo.GetPendingFacilities()
}

func (s *FacilityService) VerifyFacility(id int64) error {
	return s.repo.VerifyFacility(id)
}

func (s *FacilityService) ToggleFacilityStatus(id int64, isActive bool) error {
	return s.repo.ToggleFacilityStatus(id, isActive)
}
