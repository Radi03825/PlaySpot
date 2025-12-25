package service

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
	"os"
	"path/filepath"
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
	// Get template path from environment or use default
	templatePath := os.Getenv("EMAIL_TEMPLATE_PATH")
	if templatePath == "" {
		// Get absolute path to templates directory
		// Start from the current working directory and look for templates
		workDir, err := os.Getwd()
		if err == nil {
			fmt.Printf("[EmailService] Current working directory: %s\n", workDir)

			// Try to find templates in the backend directory structure
			possiblePaths := []string{
				filepath.Join(workDir, "internal", "templates"),
				filepath.Join(workDir, "backend", "internal", "templates"),
				filepath.Join(workDir, "..", "internal", "templates"),
			}

			for _, path := range possiblePaths {
				fmt.Printf("[EmailService] Checking path: %s\n", path)
				if _, err := os.Stat(path); err == nil {
					templatePath = path
					fmt.Printf("[EmailService] Found templates at: %s\n", templatePath)
					break
				}
			}

			// Fallback to relative path if none found
			if templatePath == "" {
				templatePath = filepath.Join("internal", "templates")
				fmt.Printf("[EmailService] Using fallback path: %s\n", templatePath)
			}
		} else {
			templatePath = filepath.Join("internal", "templates")
			fmt.Printf("[EmailService] Error getting workdir, using fallback: %s\n", templatePath)
		}
	} else {
		fmt.Printf("[EmailService] Using env template path: %s\n", templatePath)
	}

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

	// Set up authentication
	auth := smtp.PlainAuth("", s.smtpUsername, s.smtpPassword, s.smtpHost)

	// Send email
	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)
	err := smtp.SendMail(addr, auth, s.fromEmail, []string{to}, message)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
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
