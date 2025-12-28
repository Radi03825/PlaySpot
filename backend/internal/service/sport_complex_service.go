package service

import (
	"github.com/Radi03825/PlaySpot/internal/dto"
	"github.com/Radi03825/PlaySpot/internal/model"
	"github.com/Radi03825/PlaySpot/internal/repository"
)

type SportComplexService struct {
	repo         *repository.SportComplexRepository
	facilityRepo *repository.FacilityRepository
}

func NewSportComplexService(repo *repository.SportComplexRepository, facilityRepo *repository.FacilityRepository) *SportComplexService {
	return &SportComplexService{
		repo:         repo,
		facilityRepo: facilityRepo,
	}
}

func (s *SportComplexService) CreateSportComplex(dto dto.CreateSportComplexDTO, managerID int64) (*model.SportComplex, error) {
	// Create the sport complex (not verified by default)
	complex, err := s.repo.CreateSportComplex(dto.Name, dto.Address, dto.City, dto.Description, managerID)
	if err != nil {
		return nil, err
	}

	// Create associated facilities if provided
	if len(dto.Facilities) > 0 {
		for _, facilityDTO := range dto.Facilities {
			_, err := s.facilityRepo.CreateFacility(
				facilityDTO.Name,
				&complex.ID,
				facilityDTO.CategoryID,
				facilityDTO.SurfaceID,
				facilityDTO.EnvironmentID,
				facilityDTO.Description,
				facilityDTO.Capacity,
				managerID,
			)
			if err != nil {
				// Log error but continue creating other facilities
				// In production, you might want to handle this differently
				continue
			}
		}
	}

	return complex, nil
}

func (s *SportComplexService) GetAllSportComplexes() ([]model.SportComplex, error) {
	return s.repo.GetAllSportComplexes()
}

func (s *SportComplexService) GetSportComplexByID(id int64) (*model.SportComplex, error) {
	return s.repo.GetSportComplexByID(id)
}

func (s *SportComplexService) GetMyComplexes(managerID int64) ([]model.SportComplex, error) {
	return s.repo.GetComplexesByManagerID(managerID)
}

func (s *SportComplexService) GetPendingComplexes() ([]model.SportComplex, error) {
	return s.repo.GetPendingComplexes()
}

func (s *SportComplexService) VerifyComplex(id int64) error {
	return s.repo.VerifyComplex(id)
}

func (s *SportComplexService) ToggleComplexStatus(id int64, isActive bool) error {
	return s.repo.ToggleComplexStatus(id, isActive)
}
