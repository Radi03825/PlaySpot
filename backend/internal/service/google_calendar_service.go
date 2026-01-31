package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

type GoogleCalendarService struct {
	clientID     string
	clientSecret string
}

func NewGoogleCalendarService(clientID, clientSecret string) *GoogleCalendarService {
	return &GoogleCalendarService{
		clientID:     clientID,
		clientSecret: clientSecret,
	}
}

// getOAuthConfig returns the OAuth2 config for Google Calendar
func (s *GoogleCalendarService) getOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     s.clientID,
		ClientSecret: s.clientSecret,
		RedirectURL:  "postmessage", // For auth-code flow with @react-oauth/google
		Endpoint:     google.Endpoint,
		Scopes:       []string{calendar.CalendarEventsScope},
	}
}

// getCalendarService creates a Google Calendar service with the given token
func (s *GoogleCalendarService) getCalendarService(accessToken, refreshToken string, tokenExpiry time.Time) (*calendar.Service, error) {
	config := s.getOAuthConfig()

	token := &oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		Expiry:       tokenExpiry,
		TokenType:    "Bearer",
	}

	ctx := context.Background()
	client := config.Client(ctx, token)

	service, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, fmt.Errorf("failed to create calendar service: %w", err)
	}

	return service, nil
}

// CreateEvent creates a calendar event for a reservation
func (s *GoogleCalendarService) CreateEvent(
	accessToken, refreshToken string,
	tokenExpiry time.Time,
	facilityName, description, location string,
	startTime, endTime time.Time,
) (string, error) {
	service, err := s.getCalendarService(accessToken, refreshToken, tokenExpiry)
	if err != nil {
		return "", err
	}

	event := &calendar.Event{
		Summary:     fmt.Sprintf("PlaySpot Booking - %s", facilityName),
		Description: description,
		Location:    location,
		Start: &calendar.EventDateTime{
			DateTime: startTime.Format(time.RFC3339),
			TimeZone: "Europe/Sofia", // Bulgaria timezone
		},
		End: &calendar.EventDateTime{
			DateTime: endTime.Format(time.RFC3339),
			TimeZone: "Europe/Sofia", // Bulgaria timezone
		},
		ColorId: "9", // Blue color
		Reminders: &calendar.EventReminders{
			UseDefault: true, // Use user's default calendar reminder settings
		},
	}

	createdEvent, err := service.Events.Insert("primary", event).Do()
	if err != nil {
		return "", fmt.Errorf("failed to create calendar event: %w", err)
	}

	return createdEvent.Id, nil
}

// DeleteEvent deletes a calendar event
func (s *GoogleCalendarService) DeleteEvent(
	accessToken, refreshToken string,
	tokenExpiry time.Time,
	eventID string,
) error {
	service, err := s.getCalendarService(accessToken, refreshToken, tokenExpiry)
	if err != nil {
		return err
	}

	err = service.Events.Delete("primary", eventID).Do()
	if err != nil {
		return fmt.Errorf("failed to delete calendar event: %w", err)
	}

	return nil
}

// UpdateEvent updates an existing calendar event
func (s *GoogleCalendarService) UpdateEvent(
	accessToken, refreshToken string,
	tokenExpiry time.Time,
	eventID, facilityName, description string,
	startTime, endTime time.Time,
) error {
	service, err := s.getCalendarService(accessToken, refreshToken, tokenExpiry)
	if err != nil {
		return err
	}

	event, err := service.Events.Get("primary", eventID).Do()
	if err != nil {
		return fmt.Errorf("failed to get event: %w", err)
	}

	event.Summary = fmt.Sprintf("PlaySpot Booking - %s", facilityName)
	event.Description = description
	event.Start = &calendar.EventDateTime{
		DateTime: startTime.Format(time.RFC3339),
		TimeZone: "UTC",
	}
	event.End = &calendar.EventDateTime{
		DateTime: endTime.Format(time.RFC3339),
		TimeZone: "UTC",
	}

	_, err = service.Events.Update("primary", eventID, event).Do()
	if err != nil {
		return fmt.Errorf("failed to update calendar event: %w", err)
	}

	return nil
}

// ExchangeCodeForTokens exchanges an authorization code for access and refresh tokens
func (s *GoogleCalendarService) ExchangeCodeForTokens(code string) (*oauth2.Token, error) {
	config := s.getOAuthConfig()
	ctx := context.Background()

	token, err := config.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code for token: %w", err)
	}

	return token, nil
}

// ParseIDToken parses the ID token to extract user information
func (s *GoogleCalendarService) ParseIDToken(idToken string) (map[string]interface{}, error) {
	var claims map[string]interface{}

	// Note: In production, you should verify the token signature
	// For now, we'll just decode the payload
	// The token has 3 parts separated by dots: header.payload.signature
	parts := []byte(idToken)

	err := json.Unmarshal(parts, &claims)
	if err != nil {
		return nil, fmt.Errorf("failed to parse ID token: %w", err)
	}

	return claims, nil
}
