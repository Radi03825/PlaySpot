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
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    role_id BIGINT NOT NULL DEFAULT 1 REFERENCES roles(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    birth_date TIMESTAMP,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS user_auth_identities (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('email_verification', 'password_reset', 'refresh', 'google_access', 'google_refresh')),
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
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sport_complex_id BIGINT NULL REFERENCES sport_complexes(id) ON DELETE CASCADE,
    manager_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    surface_id BIGINT NOT NULL REFERENCES surfaces(id) ON DELETE CASCADE,
    environment_id BIGINT NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    capacity INTEGER,
    description TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 10. CREATE FACILITY SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS facility_schedules (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    day_type VARCHAR(50) NOT NULL CHECK (day_type IN ('weekday', 'weekend'))
);

-- 11. CREATE FACILITY PRICING TABLE
CREATE TABLE IF NOT EXISTS facility_pricings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    day_type VARCHAR(50) NOT NULL CHECK (day_type IN ('weekday', 'weekend')),
    start_hour TIME NOT NULL,
    end_hour TIME NOT NULL,
    price_per_hour NUMERIC(10, 2) NOT NULL
);

-- 12. CREATE FACILITY RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS facility_reservations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    google_calendar_event_id VARCHAR(255)
);

-- 13. CREATE IMAGES TABLE
CREATE TABLE IF NOT EXISTS images (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    url TEXT NOT NULL,
    storage_id TEXT,
    storage_provider VARCHAR(50) DEFAULT 'cloudinary',
    image_type VARCHAR(50) NOT NULL CHECK (image_type IN ('sport_complex', 'facility', 'user_profile')),
    reference_id BIGINT NOT NULL,
    owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_images_reference ON images(image_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_images_owner ON images(owner_id);

-- 14. CREATE PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reservation_id BIGINT NOT NULL REFERENCES facility_reservations(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    expired_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 15. CREATE EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sport_id BIGINT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    max_participants INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('UPCOMING', 'FULL', 'CANCELED', 'COMPLETED')) DEFAULT 'UPCOMING',
    organizer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facility_id BIGINT REFERENCES facilities(id) ON DELETE SET NULL,
    address TEXT,
    related_booking_id BIGINT REFERENCES facility_reservations(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

-- Create indexes for events table
CREATE INDEX IF NOT EXISTS idx_events_sport_id ON events(sport_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_facility_id ON events(facility_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);

-- 16. CREATE EVENT_PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS event_participants (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL CHECK (status IN ('JOINED', 'LEFT', 'REMOVED')) DEFAULT 'JOINED',
    CONSTRAINT unique_event_participant UNIQUE (event_id, user_id)
    );

-- Create indexes for event_participants table
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON event_participants(status);

-- 17. CREATE REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facility_id BIGINT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_facility_review UNIQUE (user_id, facility_id)
);