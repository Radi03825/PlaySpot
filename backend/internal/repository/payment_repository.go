package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/Radi03825/PlaySpot/internal/model"
)

type PaymentRepository struct {
	db *sql.DB
}

func NewPaymentRepository(db *sql.DB) *PaymentRepository {
	return &PaymentRepository{db: db}
}

func (r *PaymentRepository) CreatePayment(userID, reservationID int64, amount float64, currency string) (*model.Payment, error) {
	query := `
		INSERT INTO payments (user_id, reservation_id, amount, currency, payment_method, payment_status, created_at)
		VALUES ($1, $2, $3, $4, 'pending', 'pending', NOW())
		RETURNING id, user_id, reservation_id, amount, currency, payment_method, payment_status, expired_at, paid_at, created_at
	`

	var payment model.Payment
	err := r.db.QueryRow(query, userID, reservationID, amount, currency).Scan(
		&payment.ID,
		&payment.UserID,
		&payment.ReservationID,
		&payment.Amount,
		&payment.Currency,
		&payment.PaymentMethod,
		&payment.PaymentStatus,
		&payment.ExpiredAt,
		&payment.PaidAt,
		&payment.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create payment: %w", err)
	}

	return &payment, nil
}

func (r *PaymentRepository) GetPaymentByReservationID(reservationID int64) (*model.Payment, error) {
	query := `
		SELECT id, user_id, reservation_id, amount, currency, payment_method, payment_status, expired_at, paid_at, created_at
		FROM payments
		WHERE reservation_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`

	var payment model.Payment
	err := r.db.QueryRow(query, reservationID).Scan(
		&payment.ID,
		&payment.UserID,
		&payment.ReservationID,
		&payment.Amount,
		&payment.Currency,
		&payment.PaymentMethod,
		&payment.PaymentStatus,
		&payment.ExpiredAt,
		&payment.PaidAt,
		&payment.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get payment: %w", err)
	}

	return &payment, nil
}

func (r *PaymentRepository) ProcessPayment(paymentID int64, paymentMethod string) error {
	now := time.Now()
	query := `
		UPDATE payments
		SET payment_method = $1, payment_status = 'completed', paid_at = $2
		WHERE id = $3 AND payment_status = 'pending'
	`

	result, err := r.db.Exec(query, paymentMethod, now, paymentID)
	if err != nil {
		return fmt.Errorf("failed to process payment: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("payment not found or already processed")
	}

	return nil
}

func (r *PaymentRepository) GetPaymentByID(paymentID int64) (*model.Payment, error) {
	query := `
		SELECT id, user_id, reservation_id, amount, currency, payment_method, payment_status, expired_at, paid_at, created_at
		FROM payments
		WHERE id = $1
	`

	var payment model.Payment
	err := r.db.QueryRow(query, paymentID).Scan(
		&payment.ID,
		&payment.UserID,
		&payment.ReservationID,
		&payment.Amount,
		&payment.Currency,
		&payment.PaymentMethod,
		&payment.PaymentStatus,
		&payment.ExpiredAt,
		&payment.PaidAt,
		&payment.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get payment: %w", err)
	}

	return &payment, nil
}
