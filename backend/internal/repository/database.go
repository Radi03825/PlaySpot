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
		err = InitializeSchema(db)
		if err != nil {
			log.Printf("Warning: Schema initialization failed: %v", err)
		} else {
			log.Println("Database schema initialized successfully")
		}
	}

	if seedData {
		err = SeedBasicData(db)
		if err != nil {
			log.Printf("Warning: Data seeding failed: %v", err)
		} else {
			log.Println("Basic data seeded successfully")
		}
	}

	return db, nil
}

// InitializeSchema creates all database tables, indexes, and functions
func InitializeSchema(db *sql.DB) error {
	possiblePaths := []string{
		filepath.Join("backend", "migrations", "init_database.sql"),
		filepath.Join("migrations", "init_database.sql"),
		"init_database.sql",
	}

	var sqlBytes []byte
	var err error

	for _, migrationPath := range possiblePaths {
		sqlBytes, err = os.ReadFile(migrationPath)
		if err == nil {
			log.Printf("Found schema file at: %s", migrationPath)
			break
		}
	}

	if err != nil {
		return fmt.Errorf("failed to read schema file from any location: %w", err)
	}

	_, err = db.Exec(string(sqlBytes))
	if err != nil {
		return fmt.Errorf("failed to execute schema: %w", err)
	}

	return nil
}

// SeedBasicData inserts basic data into the database
// Automatically discovers and executes all .sql files in the seeds folder
// Files are executed in alphabetical order (Should be with numeric prefixes like 001_, 002_, etc.)
func SeedBasicData(db *sql.DB) error {
	possiblePaths := []string{
		filepath.Join("backend", "migrations", "seeds"),
		filepath.Join("migrations", "seeds"),
		"seeds",
	}

	var migrationsPath string
	var entries []os.DirEntry
	var err error

	for _, path := range possiblePaths {
		entries, err = os.ReadDir(path)
		if err == nil {
			migrationsPath = path
			log.Printf("Found seeds directory at: %s", path)
			break
		}
	}

	if err != nil {
		log.Printf("Warning: Could not read seeds directory from any location: %v", err)
		return nil
	}

	// Filter and collect only .sql files
	var sqlFiles []string
	for _, entry := range entries {
		if !entry.IsDir() && filepath.Ext(entry.Name()) == ".sql" {
			sqlFiles = append(sqlFiles, entry.Name())
		}
	}

	if len(sqlFiles) == 0 {
		log.Println("No seed files found in seeds directory")
		return nil
	}

	log.Printf("Found %d seed file(s) to execute", len(sqlFiles))

	// Execute each SQL file in order
	for _, fileName := range sqlFiles {
		migrationFile := filepath.Join(migrationsPath, fileName)

		sqlBytes, err := os.ReadFile(migrationFile)
		if err != nil {
			log.Printf("Warning: Failed to read seed file %s: %v", fileName, err)
			continue
		}

		_, err = db.Exec(string(sqlBytes))
		if err != nil {
			log.Printf("Warning: Failed to execute seed file %s: %v", fileName, err)
			continue
		}

		log.Printf("Executed seed migration: %s", fileName)
	}

	log.Println("All seed migrations completed")
	return nil
}
