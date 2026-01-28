package dto

type ProcessPaymentDTO struct {
	PaymentMethod string `json:"payment_method"` // 'on_place' or 'card'
}
