package repository

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/lib/pq"
)

func ConnectDatabase(initSchema, seedData bool) (*sql.DB, error) {
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASS")
	host := os.Getenv("DB_HOST")
	dbName := os.Getenv("DB_NAME")
	port := os.Getenv("DB_PORT")

	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		user, password, host, port, dbName,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		return nil, err
	}

	if initSchema {
		// Initialize database schema (create tables, indexes, etc.)
		err = InitializeSchema(db)
		if err != nil {
			log.Printf("Warning: Schema initialization failed: %v", err)
			// Don't return error - tables might already exist
		} else {
			log.Println("Database schema initialized successfully")
		}
	}

	if seedData {
		// Seed basic data
		err = SeedBasicData(db)
		if err != nil {
			log.Printf("Warning: Data seeding failed: %v", err)
			// Don't return error - data might already exist
		} else {
			log.Println("Basic data seeded successfully")
		}
	}

	return db, nil
}

// InitializeSchema creates all database tables, indexes, and functions
func InitializeSchema(db *sql.DB) error {
	// Fixed path relative to project root
	migrationPath := filepath.Join("backend", "migrations", "init_database.sql")

	sqlBytes, err := os.ReadFile(migrationPath)
	if err != nil {
		return fmt.Errorf("failed to read schema file: %w", err)
	}

	_, err = db.Exec(string(sqlBytes))
	if err != nil {
		return fmt.Errorf("failed to execute schema: %w", err)
	}

	return nil
}

// SeedBasicData inserts default/basic data into the database
func SeedBasicData(db *sql.DB) error {
	// Fixed path relative to project root
	seedPath := filepath.Join("backend", "migrations", "seed_data.sql")

	sqlBytes, err := os.ReadFile(seedPath)
	if err != nil {
		return fmt.Errorf("failed to read seed file: %w", err)
	}

	_, err = db.Exec(string(sqlBytes))
	if err != nil {
		return fmt.Errorf("failed to execute seed data: %w", err)
	}

	return nil
}
