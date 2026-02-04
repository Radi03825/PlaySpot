package service

import (
	"fmt"
	"time"

	"github.com/Radi03825/PlaySpot/internal/dto"
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
	facilities, err := s.repo.GetPendingFacilities()
	if err != nil {
		return nil, err
	}

	// Fetch images for each facility
	for i := range facilities {
		images, err := s.imageService.GetImagesByReference("facility", facilities[i].ID)
		if err == nil {
			facilities[i].Images = images
		}
	}

	return facilities, nil
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

func (s *FacilityService) UpdateFacility(id int64, name string, sportComplexID *int64, categoryID, surfaceID, environmentID int64, city, address, description string, capacity int, userID int64) error {
	// Check if user owns the facility
	managerID, err := s.repo.GetFacilityManagerID(id)
	if err != nil {
		return err
	}

	if managerID == nil || *managerID != userID {
		return fmt.Errorf("unauthorized: you do not own this facility")
	}

	// If facility belongs to a sport complex, get city and address from the complex
	if sportComplexID != nil && *sportComplexID > 0 {
		complex, err := s.sportComplexService.GetSportComplexByID(*sportComplexID)
		if err != nil {
			return err
		}
		city = complex.City
		address = complex.Address
	}

	return s.repo.UpdateFacility(id, name, sportComplexID, categoryID, surfaceID, environmentID, city, address, description, capacity)
}

// CreateFacilityWithoutImages creates a facility without handling images (for internal use)
func (s *FacilityService) CreateFacilityWithoutImages(name string, sportComplexID *int64, categoryID, surfaceID, environmentID int64, city, address, description string, capacity int, managerID int64) (*model.Facility, error) {
	return s.repo.CreateFacility(name, sportComplexID, categoryID, surfaceID, environmentID, city, address, description, capacity, managerID)
}

func (s *FacilityService) GetFacilityDetailsByID(id int64) (*model.FacilityDetails, error) {
	return s.repo.GetFacilityByID(id)
}

// parseTime parses a time string in HH:MM format
func parseTime(timeStr string) (time.Time, error) {
	return time.Parse("15:04", timeStr)
}

// saveWorkingHours saves working hours for a facility
func (s *FacilityService) saveWorkingHours(facilityID int64, workingHours []dto.WorkingHoursDTO) error {
	for _, wh := range workingHours {
		// Validate time format
		_, err := parseTime(wh.OpenTime)
		if err != nil {
			return fmt.Errorf("invalid open time format: %v", err)
		}

		_, err = parseTime(wh.CloseTime)
		if err != nil {
			return fmt.Errorf("invalid close time format: %v", err)
		}

		schedule := &model.FacilitySchedule{
			FacilityID: facilityID,
			DayType:    model.DayType(wh.DayType),
			OpenTime:   wh.OpenTime + ":00",  // Convert HH:MM to HH:MM:SS
			CloseTime:  wh.CloseTime + ":00", // Convert HH:MM to HH:MM:SS
		}

		if err := s.repo.CreateSchedule(schedule); err != nil {
			return fmt.Errorf("failed to create schedule: %v", err)
		}
	}
	return nil
}

// savePricing saves pricing slots for a facility
func (s *FacilityService) savePricing(facilityID int64, pricingSlots []dto.PricingSlotDTO) error {
	for _, ps := range pricingSlots {
		pricing := &model.FacilityPricing{
			FacilityID:   facilityID,
			DayType:      model.DayType(ps.DayType),
			StartHour:    ps.StartHour,
			EndHour:      ps.EndHour,
			PricePerHour: ps.PricePerHour,
		}

		if err := s.repo.CreatePricing(pricing); err != nil {
			return fmt.Errorf("failed to create pricing: %v", err)
		}
	}
	return nil
}

// CreateFacilityWithScheduleAndPricing creates a facility with working hours and pricing
func (s *FacilityService) CreateFacilityWithScheduleAndPricing(name string, sportComplexID *int64, categoryID, surfaceID, environmentID int64, city, address, description string, capacity int, managerID int64, imageURLs []string, workingHours []dto.WorkingHoursDTO, pricing []dto.PricingSlotDTO) (*model.Facility, error) {
	// Create the facility first
	facility, err := s.CreateFacility(name, sportComplexID, categoryID, surfaceID, environmentID, city, address, description, capacity, managerID, imageURLs)
	if err != nil {
		return nil, err
	}

	// Save working hours if provided
	if len(workingHours) > 0 {
		if err := s.saveWorkingHours(facility.ID, workingHours); err != nil {
			// Log error but don't fail the facility creation
			// The facility was successfully created, only schedule saving failed
		}
	}

	// Save pricing if provided
	if len(pricing) > 0 {
		if err := s.savePricing(facility.ID, pricing); err != nil {
			// Log error but don't fail the facility creation
			// The facility was successfully created, only pricing saving failed
		}
	}

	return facility, nil
}

// CreateFacilityWithoutImagesAndSchedule creates a facility without handling images, schedules, or pricing (for internal use)
func (s *FacilityService) CreateFacilityWithoutImagesAndSchedule(name string, sportComplexID *int64, categoryID, surfaceID, environmentID int64, city, address, description string, capacity int, managerID int64, workingHours []dto.WorkingHoursDTO, pricing []dto.PricingSlotDTO) (*model.Facility, error) {
	// Create the facility
	facility, err := s.repo.CreateFacility(name, sportComplexID, categoryID, surfaceID, environmentID, city, address, description, capacity, managerID)
	if err != nil {
		return nil, err
	}

	// Save working hours if provided
	if len(workingHours) > 0 {
		if err := s.saveWorkingHours(facility.ID, workingHours); err != nil {
			// Log error but don't fail the facility creation
		}
	}

	// Save pricing if provided
	if len(pricing) > 0 {
		if err := s.savePricing(facility.ID, pricing); err != nil {
			// Log error but don't fail the facility creation
		}
	}

	return facility, nil
}

// GetSchedulesByFacilityID retrieves all schedules for a facility
func (s *FacilityService) GetSchedulesByFacilityID(facilityID int64) ([]*model.FacilitySchedule, error) {
	return s.repo.GetSchedulesByFacilityID(facilityID)
}

// GetPricingByFacilityID retrieves all pricing entries for a facility
func (s *FacilityService) GetPricingByFacilityID(facilityID int64) ([]*model.FacilityPricing, error) {
	return s.repo.GetPricingByFacilityID(facilityID)
}
