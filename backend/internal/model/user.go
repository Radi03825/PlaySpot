package model

import (
	"time"
)

type User struct {
	ID              int64     `json:"id"`
	Name            string    `json:"name"`
	Email           string    `json:"email"`
	Password        string    `json:"-"`
	RoleID          int64     `json:"role_id"`
	CreatedAt       time.Time `json:"created_at"`
	BirthDate       time.Time `json:"birth_date"`
	IsEmailVerified bool      `json:"is_email_verified"`
	IsActive        bool      `json:"is_active"`
}
