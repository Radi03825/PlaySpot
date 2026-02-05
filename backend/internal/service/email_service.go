package service

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"html/template"
	"log"
	"net/smtp"
	"os"
	"path/filepath"
	"time"
)

type EmailService struct {
	smtpHost     string
	smtpPort     string
	smtpUsername string
	smtpPassword string
	fromEmail    string
	fromName     string
	templatePath string
}

func NewEmailService() *EmailService {
	// Template path is fixed relative to project root
	templatePath := filepath.Join("backend", "internal", "templates")

	return &EmailService{
		smtpHost:     os.Getenv("SMTP_HOST"),
		smtpPort:     os.Getenv("SMTP_PORT"),
		smtpUsername: os.Getenv("SMTP_USERNAME"),
		smtpPassword: os.Getenv("SMTP_PASSWORD"),
		fromEmail:    os.Getenv("FROM_EMAIL"),
		fromName:     os.Getenv("FROM_NAME"),
		templatePath: templatePath,
	}
}

// SendVerificationEmail sends an email verification link to the user
func (s *EmailService) SendVerificationEmail(toEmail, userName, verificationToken string) error {
	baseURL := os.Getenv("FRONTEND_URL")
	if baseURL == "" {
		baseURL = "http://localhost:5173"
	}

	verificationLink := fmt.Sprintf("%s/verify-email?token=%s", baseURL, verificationToken)

	subject := "Welcome to PlaySpot - Verify Your Email"

	// Load and render template
	body, err := s.renderTemplate("email_verification.html", map[string]interface{}{
		"UserName":         userName,
		"VerificationLink": verificationLink,
	})
	if err != nil {
		return fmt.Errorf("failed to render email template: %w", err)
	}

	return s.sendEmail(toEmail, subject, body)
}

// SendVerificationEmailAsync sends a verification email asynchronously
func (s *EmailService) SendVerificationEmailAsync(toEmail, userName, verificationToken string) {
	go func() {
		err := s.SendVerificationEmail(toEmail, userName, verificationToken)
		if err != nil {
			log.Printf("[EMAIL ERROR] Failed to send verification email to %s: %v", toEmail, err)
		}
	}()
}

// SendPasswordResetEmail sends a password reset link to the user
func (s *EmailService) SendPasswordResetEmail(toEmail, userName, resetToken string) error {
	baseURL := os.Getenv("FRONTEND_URL")
	if baseURL == "" {
		baseURL = "http://localhost:5173"
	}

	resetLink := fmt.Sprintf("%s/reset-password?token=%s", baseURL, resetToken)

	subject := "PlaySpot - Password Reset Request"

	// Load and render template
	body, err := s.renderTemplate("password_reset.html", map[string]interface{}{
		"UserName":  userName,
		"ResetLink": resetLink,
	})
	if err != nil {
		return fmt.Errorf("failed to render email template: %w", err)
	}

	return s.sendEmail(toEmail, subject, body)
}

// SendPasswordResetEmailAsync sends a password reset email asynchronously
func (s *EmailService) SendPasswordResetEmailAsync(toEmail, userName, resetToken string) {
	go func() {
		err := s.SendPasswordResetEmail(toEmail, userName, resetToken)
		if err != nil {
			log.Printf("[EMAIL ERROR] Failed to send password reset email to %s: %v", toEmail, err)
		}
	}()
}

func (s *EmailService) sendEmail(to, subject, body string) error {
	// If SMTP is not configured, just log the email (for development)
	if s.smtpHost == "" || s.smtpPassword == "" {
		fmt.Println("=== EMAIL (SMTP NOT CONFIGURED) ===")
		fmt.Printf("To: %s\n", to)
		fmt.Printf("Subject: %s\n", subject)
		fmt.Printf("Body:\n%s\n", body)
		fmt.Println("===================================")
		return nil
	}

	fmt.Printf("[EMAIL] Attempting to send email to: %s\n", to)
	fmt.Printf("[EMAIL] SMTP Server: %s:%s\n", s.smtpHost, s.smtpPort)
	fmt.Printf("[EMAIL] Username: %s\n", s.smtpUsername)

	from := s.fromEmail
	if s.fromName != "" {
		from = fmt.Sprintf("%s <%s>", s.fromName, s.fromEmail)
	}

	// Construct email message
	message := []byte(
		"From: " + from + "\r\n" +
			"To: " + to + "\r\n" +
			"Subject: " + subject + "\r\n" +
			"MIME-Version: 1.0\r\n" +
			"Content-Type: text/html; charset=UTF-8\r\n" +
			"\r\n" +
			body + "\r\n",
	)

	// Try sending with STARTTLS first (port 587)
	if s.smtpPort == "587" {
		fmt.Println("[EMAIL] Using STARTTLS method (port 587)")
		err := s.sendWithSTARTTLS(to, message)
		if err == nil {
			fmt.Println("[EMAIL] ✓ Email sent successfully with STARTTLS")
			return nil
		}
		fmt.Printf("[EMAIL] ✗ STARTTLS failed: %v\n", err)
		fmt.Println("[EMAIL] Falling back to direct TLS...")
	}

	// Try direct TLS connection (port 465 or as fallback for 587)
	fmt.Println("[EMAIL] Using direct TLS method")
	err := s.sendWithDirectTLS(to, message)
	if err == nil {
		fmt.Println("[EMAIL] ✓ Email sent successfully with direct TLS")
		return nil
	}
	fmt.Printf("[EMAIL] ✗ Direct TLS failed: %v\n", err)

	// Last resort: try plain SMTP with basic auth (not recommended)
	if s.smtpPort == "25" {
		fmt.Println("[EMAIL] Using plain SMTP method (port 25)")
		err = s.sendPlainSMTP(to, message)
		if err == nil {
			fmt.Println("[EMAIL] ✓ Email sent successfully with plain SMTP")
			return nil
		}
		fmt.Printf("[EMAIL] ✗ Plain SMTP failed: %v\n", err)
	}

	return fmt.Errorf("all email sending methods failed, last error: %w", err)
}

func (s *EmailService) sendWithSTARTTLS(to string, message []byte) error {
	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)

	// Connect to the SMTP server
	client, err := smtp.Dial(addr)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}
	defer func() {
		if closeErr := client.Close(); closeErr != nil {
			fmt.Printf("[EMAIL] Warning: failed to close SMTP client: %v\n", closeErr)
		}
	}()

	// Say HELLO
	if err = client.Hello(s.smtpHost); err != nil {
		return fmt.Errorf("failed HELLO: %w", err)
	}

	// Start TLS if available (STARTTLS)
	if ok, _ := client.Extension("STARTTLS"); ok {
		tlsConfig := &tls.Config{
			ServerName:         s.smtpHost,
			InsecureSkipVerify: false,
		}
		if err = client.StartTLS(tlsConfig); err != nil {
			return fmt.Errorf("failed to start TLS: %w", err)
		}
	} else {
		return fmt.Errorf("server does not support STARTTLS")
	}

	// Authenticate
	auth := smtp.PlainAuth("", s.smtpUsername, s.smtpPassword, s.smtpHost)
	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("failed to authenticate: %w", err)
	}

	// Set sender
	if err = client.Mail(s.fromEmail); err != nil {
		return fmt.Errorf("failed to set sender: %w", err)
	}

	// Set recipient
	if err = client.Rcpt(to); err != nil {
		return fmt.Errorf("failed to set recipient: %w", err)
	}

	// Send message body
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to open data writer: %w", err)
	}

	_, err = w.Write(message)
	if err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}

	err = w.Close()
	if err != nil {
		return fmt.Errorf("failed to close data writer: %w", err)
	}

	// Send QUIT command
	if err = client.Quit(); err != nil {
		return fmt.Errorf("failed to quit: %w", err)
	}

	return nil
}

func (s *EmailService) sendWithDirectTLS(to string, message []byte) error {
	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)

	// Create TLS configuration
	tlsConfig := &tls.Config{
		ServerName:         s.smtpHost,
		InsecureSkipVerify: false,
	}

	// Connect with TLS directly
	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("failed to connect with TLS: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.smtpHost)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %w", err)
	}
	defer client.Close()

	// Authenticate
	auth := smtp.PlainAuth("", s.smtpUsername, s.smtpPassword, s.smtpHost)
	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("failed to authenticate: %w", err)
	}

	// Set sender
	if err = client.Mail(s.fromEmail); err != nil {
		return fmt.Errorf("failed to set sender: %w", err)
	}

	// Set recipient
	if err = client.Rcpt(to); err != nil {
		return fmt.Errorf("failed to set recipient: %w", err)
	}

	// Send message body
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to open data writer: %w", err)
	}

	_, err = w.Write(message)
	if err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}

	err = w.Close()
	if err != nil {
		return fmt.Errorf("failed to close data writer: %w", err)
	}

	// Send QUIT command
	if err = client.Quit(); err != nil {
		return fmt.Errorf("failed to quit: %w", err)
	}

	return nil
}

func (s *EmailService) sendPlainSMTP(to string, message []byte) error {
	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)
	auth := smtp.PlainAuth("", s.smtpUsername, s.smtpPassword, s.smtpHost)

	err := smtp.SendMail(addr, auth, s.fromEmail, []string{to}, message)
	if err != nil {
		return fmt.Errorf("failed to send: %w", err)
	}

	return nil
}

// renderTemplate loads and renders an email template with the given data
func (s *EmailService) renderTemplate(templateName string, data map[string]interface{}) (string, error) {
	templateFile := filepath.Join(s.templatePath, templateName)

	tmpl, err := template.ParseFiles(templateFile)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, data)
	if err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}

// SendPaymentConfirmationEmail sends a confirmation email after successful payment
func (s *EmailService) SendPaymentConfirmationEmail(
	toEmail, userName, facilityName, address, city, categoryName, sportName string,
	startTime, endTime time.Time,
	amount float64,
	paymentMethod string,
) error {
	var subject string
	if paymentMethod == "on_place" {
		subject = "Booking Confirmed - Payment Due On Arrival"
	} else {
		subject = "Payment Confirmed - Your Booking is Complete!"
	}

	paymentMethodText := "On Place"
	if paymentMethod == "card" {
		paymentMethodText = "Card"
	}

	// Load and render template
	body, err := s.renderTemplate("payment_confirmation.html", map[string]interface{}{
		"UserName":      userName,
		"FacilityName":  facilityName,
		"Address":       address,
		"City":          city,
		"CategoryName":  categoryName,
		"SportName":     sportName,
		"StartTime":     startTime.Format("Monday, January 2, 2006 at 3:04 PM"),
		"EndTime":       endTime.Format("3:04 PM"),
		"Date":          startTime.Format("Monday, January 2, 2006"),
		"StartTimeOnly": startTime.Format("3:04 PM"),
		"Amount":        fmt.Sprintf("%.2f", amount),
		"PaymentMethod": paymentMethodText,
	})
	if err != nil {
		return fmt.Errorf("failed to render email template: %w", err)
	}

	return s.sendEmail(toEmail, subject, body)
}
