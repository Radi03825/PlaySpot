package dto

type GoogleLoginDTO struct {
	IDToken     string `json:"id_token"`
	AccessToken string `json:"access_token,omitempty"` // Optional: for calendar access
	Code        string `json:"code,omitempty"`         // OAuth2 authorization code
	Scope       string `json:"scope,omitempty"`        // Scopes granted
}
