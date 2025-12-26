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

func (s *FacilityService) GetAllFacilities() ([]model.FacilityDetails, error) {
	return s.repo.GetAll()
}

func (s *FacilityService) GetFacilityByID(id int64) (*model.FacilityDetails, error) {
	return s.repo.GetByID(id)
}
