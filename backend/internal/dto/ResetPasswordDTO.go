package dto

type ResetPasswordDTO struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}
