package service

import (
	"github.com/Radi03825/PlaySpot/internal/dto"
	"github.com/Radi03825/PlaySpot/internal/model"
	"github.com/Radi03825/PlaySpot/internal/repository"
)

type SportComplexService struct {
	repo            *repository.SportComplexRepository
	facilityService *FacilityService
	userService     *UserService
	imageService    *ImageService
}

func NewSportComplexService(repo *repository.SportComplexRepository, facilityService *FacilityService, userService *UserService, imageService *ImageService) *SportComplexService {
	return &SportComplexService{
		repo:            repo,
		facilityService: facilityService,
		userService:     userService,
		imageService:    imageService,
	}
}

func (s *SportComplexService) CreateSportComplex(dto dto.CreateSportComplexDTO, managerID int64) (*model.SportComplex, error) {
	// Create the sport complex (not verified by default)
	complex, err := s.repo.CreateSportComplex(dto.Name, dto.Address, dto.City, dto.Description, managerID)
	if err != nil {
		return nil, err
	}

	// Save images if provided using the image service
	if len(dto.ImageURLs) > 0 {
		err = s.imageService.CreateImagesFromURLs(dto.ImageURLs, "sport_complex", complex.ID, managerID)
		if err != nil {
			// Log error but don't fail the complex creation
			// The complex was successfully created, only image saving failed
		}
	}

	// Create associated facilities if provided
	if len(dto.Facilities) > 0 {
		for _, facilityDTO := range dto.Facilities {
			facility, err := s.facilityService.CreateFacilityWithoutImages(
				facilityDTO.Name,
				&complex.ID,
				facilityDTO.CategoryID,
				facilityDTO.SurfaceID,
				facilityDTO.EnvironmentID,
				dto.City,    // Use complex's city
				dto.Address, // Use complex's address
				facilityDTO.Description,
				facilityDTO.Capacity,
				managerID,
			)
			if err != nil {
				// Log error but continue creating other facilities
				// In production, you might want to handle this differently
				continue
			}

			// Save facility images if provided
			if len(facilityDTO.ImageURLs) > 0 {
				err = s.imageService.CreateImagesFromURLs(facilityDTO.ImageURLs, "facility", facility.ID, managerID)
				if err != nil {
					// Log error but don't fail the facility creation
				}
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
	managerID, err := s.repo.VerifyComplex(id)
	if err != nil {
		return err
	}

	// Upgrade user to manager role if they have verified facilities
	if managerID != nil {
		// Get Manager role ID from database
		managerRoleID, err := s.userService.GetRoleIDByName("Manager")
		if err != nil {
			// Log error but don't fail the verification
			return nil
		}

		err = s.userService.UpdateUserRole(*managerID, managerRoleID)
		if err != nil {
			// Log error but don't fail the verification
			// The complex is already verified at this point
			return nil
		}
	}

	return nil
}

func (s *SportComplexService) ToggleComplexStatus(id int64, isActive bool) error {
	return s.repo.ToggleComplexStatus(id, isActive)
}

// GetSportComplexByIDForReminder retrieves a sport complex by ID (for internal use)
func (s *SportComplexService) GetSportComplexByIDForReminder(id int64) (*model.SportComplex, error) {
	return s.repo.GetSportComplexByID(id)
}
