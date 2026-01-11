package model

type SportComplex struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Address     string  `json:"address"`
	City        string  `json:"city"`
	Description string  `json:"description"`
	ManagerID   *int64  `json:"manager_id"`
	IsVerified  bool    `json:"is_verified"`
	IsActive    bool    `json:"is_active"`
	Images      []Image `json:"images,omitempty"`
}
