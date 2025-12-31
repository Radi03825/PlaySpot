package model

import "time"

type UserAuthIdentity struct {
	ID                 int64      `json:"id"`
	UserID             int64      `json:"user_id"`
	Provider           string     `json:"provider"`
	ProviderUserID     string     `json:"provider_user_id"`
	GoogleAccessToken  *string    `json:"-"`
	GoogleRefreshToken *string    `json:"-"`
	TokenExpiry        *time.Time `json:"-"`
}
