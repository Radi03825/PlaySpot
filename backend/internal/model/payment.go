package model

import "time"

type Payment struct {
	ID            int64      `json:"id"`
	UserID        int64      `json:"user_id"`
	ReservationID int64      `json:"reservation_id"`
	Amount        float64    `json:"amount"`
	Currency      string     `json:"currency"`
	PaymentMethod string     `json:"payment_method"` // 'on_place', 'card'
	PaymentStatus string     `json:"payment_status"` // 'pending', 'completed', 'failed', 'refunded'
	ExpiredAt     *time.Time `json:"expired_at,omitempty"`
	PaidAt        *time.Time `json:"paid_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}
