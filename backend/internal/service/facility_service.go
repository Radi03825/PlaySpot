package service

import (
	"github.com/Radi03825/PlaySpot/internal/model"
	"github.com/Radi03825/PlaySpot/internal/repository"
)

type FacilityService struct {
	repo                *repository.FacilityRepository
	sportComplexService *SportComplexService
	userService         *UserService
	imageService        *ImageService
}

func NewFacilityService(repo *repository.FacilityRepository, userService *UserService, imageService *ImageService) *FacilityService {
	return &FacilityService{
		repo:         repo,
		userService:  userService,
		imageService: imageService,
	}
}

// SetSportComplexService sets the sport complex service (for resolving circular dependencies)
func (s *FacilityService) SetSportComplexService(sportComplexService *SportComplexService) {
	s.sportComplexService = sportComplexService
}

func (s *FacilityService) CreateFacility(name string, sportComplexID *int64, categoryID, surfaceID, environmentID int64, city, address, description string, capacity int, managerID int64, imageURLs []string) (*model.Facility, error) {
	// If facility belongs to a sport complex, get city and address from the complex
	if sportComplexID != nil && *sportComplexID > 0 {
		complex, err := s.sportComplexService.GetSportComplexByID(*sportComplexID)
		if err != nil {
			return nil, err
		}
		city = complex.City
		address = complex.Address
	}

	facility, err := s.repo.CreateFacility(name, sportComplexID, categoryID, surfaceID, environmentID, city, address, description, capacity, managerID)
	if err != nil {
		return nil, err
	}

	// Save images if provided using the image service
	if len(imageURLs) > 0 {
		err = s.imageService.CreateImagesFromURLs(imageURLs, "facility", facility.ID, managerID)
		if err != nil {
			// Log error but don't fail the facility creation
			// The facility was successfully created, only image saving failed
		}
	}

	return facility, nil
}

func (s *FacilityService) GetAllFacilities() ([]model.FacilityDetails, error) {
	return s.repo.GetAllFacilities()
}

func (s *FacilityService) SearchFacilities(params model.FacilitySearchParams) ([]model.FacilityDetails, error) {
	return s.repo.SearchFacilities(params)
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
	managerID, err := s.repo.VerifyFacility(id)
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
			// The facility is already verified at this point
			return nil
		}
	}

	return nil
}

func (s *FacilityService) ToggleFacilityStatus(id int64, isActive bool) error {
	return s.repo.ToggleFacilityStatus(id, isActive)
}

// CreateFacilityWithoutImages creates a facility without handling images (for internal use)
func (s *FacilityService) CreateFacilityWithoutImages(name string, sportComplexID *int64, categoryID, surfaceID, environmentID int64, city, address, description string, capacity int, managerID int64) (*model.Facility, error) {
	return s.repo.CreateFacility(name, sportComplexID, categoryID, surfaceID, environmentID, city, address, description, capacity, managerID)
}

// GetFacilityDetailsByID retrieves facility details by ID
func (s *FacilityService) GetFacilityDetailsByID(id int64) (*model.FacilityDetails, error) {
	return s.repo.GetFacilityByID(id)
}
