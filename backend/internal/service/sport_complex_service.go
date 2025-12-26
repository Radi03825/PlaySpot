package service

import (
	"github.com/Radi03825/PlaySpot/internal/model"
	"github.com/Radi03825/PlaySpot/internal/repository"
)

type SportComplexService struct {
	repo *repository.SportComplexRepository
}

func NewSportComplexService(repo *repository.SportComplexRepository) *SportComplexService {
	return &SportComplexService{repo: repo}
}

func (s *SportComplexService) GetAllSportComplexes() ([]model.SportComplex, error) {
	return s.repo.GetAll()
}

func (s *SportComplexService) GetSportComplexByID(id int64) (*model.SportComplex, error) {
	return s.repo.GetByID(id)
}

func (s *SportComplexService) GetFacilitiesByComplexID(complexID int64) ([]model.FacilityDetails, error) {
	return s.repo.GetFacilitiesByComplexID(complexID)
}
