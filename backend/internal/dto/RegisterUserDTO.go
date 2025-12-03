package dto

type RegisterUserDTO struct {
	Name      string `json:"name"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	BirthDate string `json:"birth_date"` // Format: YYYY-MM-DD
}
