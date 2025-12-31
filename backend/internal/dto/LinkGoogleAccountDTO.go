package dto

type LinkGoogleAccountDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	GoogleID string `json:"google_id"`
}
