package model

type UserAuthIdentity struct {
	ID             int64  `json:"id"`
	UserID         int64  `json:"user_id"`
	Provider       string `json:"provider"`
	ProviderUserID string `json:"provider_user_id"`
}
