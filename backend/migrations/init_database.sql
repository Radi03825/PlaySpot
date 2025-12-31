-- Database Initialization Script for PlaySpot
-- This script creates all necessary tables, indexes, and constraints
-- Safe to run multiple times due to IF NOT EXISTS checks

-- 1. CREATE ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Insert default roles
INSERT INTO roles (id, name) VALUES
    (1, 'Admin'),
    (2, 'User'),
    (3, 'Manager')
ON CONFLICT (id) DO NOTHING;

-- 2. CREATE USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    role_id BIGINT NOT NULL DEFAULT 1 REFERENCES roles(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    birth_date TIMESTAMP,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE user_auth_identities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255),
    UNIQUE (provider, provider_user_id),
    UNIQUE (user_id, provider)
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_email_verified ON users(is_email_verified);

-- 3. CREATE UNIFIED TOKENS TABLE
CREATE TABLE IF NOT EXISTS tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('email_verification', 'password_reset', 'refresh')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    used BOOLEAN NOT NULL DEFAULT FALSE,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    user_agent TEXT,
    CONSTRAINT unique_token UNIQUE(token)
);

-- Create indexes for tokens table
CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens(token);
CREATE INDEX IF NOT EXISTS idx_tokens_type ON tokens(token_type);
CREATE INDEX IF NOT EXISTS idx_tokens_expires_at ON tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_tokens_user_type ON tokens(user_id, token_type);
CREATE INDEX IF NOT EXISTS idx_tokens_active ON tokens(used, revoked, expires_at) WHERE used = FALSE AND revoked = FALSE;


-- 4. CREATE SPORTS TABLE
CREATE TABLE IF NOT EXISTS sports (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- 5. CREATE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sport_id BIGINT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    UNIQUE (sport_id, name)
);

-- 6. CREATE SURFACES TABLE
CREATE TABLE IF NOT EXISTS surfaces (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- 7. CREATE ENVIRONMENTS TABLE
CREATE TABLE IF NOT EXISTS environments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- 8. CREATE SPORT_COMPLEXES TABLE
CREATE TABLE IF NOT EXISTS sport_complexes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    description TEXT,
    manager_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 9. CREATE FACILITIES TABLE
CREATE TABLE IF NOT EXISTS facilities (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sport_complex_id BIGINT NULL REFERENCES sport_complexes(id) ON DELETE CASCADE,
    manager_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    surface_id BIGINT NOT NULL REFERENCES surfaces(id) ON DELETE CASCADE,
    environment_id BIGINT NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    description TEXT,
    capacity INTEGER,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 10. CREATE FACILITY SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS facility_schedules (
    id BIGSERIAL PRIMARY KEY,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    day_type VARCHAR(50) NOT NULL CHECK (day_type IN ('weekday', 'weekend'))
);

-- 11. CREATE FACILITY PRICING TABLE
CREATE TABLE IF NOT EXISTS facility_pricings (
    id BIGSERIAL PRIMARY KEY,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    day_type VARCHAR(50) NOT NULL CHECK (day_type IN ('weekday', 'weekend')),
    start_hour TIME NOT NULL,
    end_hour TIME NOT NULL,
    price_per_hour NUMERIC(10, 2) NOT NULL
);

-- 12. CREATE FACILITY RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS facility_reservations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);