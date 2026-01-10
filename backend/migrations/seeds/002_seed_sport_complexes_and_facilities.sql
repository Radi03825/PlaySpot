-- Seed File 002: Sport Complexes and Facilities Sample Data
-- This file seeds sample sport complexes and facilities for testing

-- SEED SPORT COMPLEXES DATA
INSERT INTO sport_complexes (id, name, address, city, description, is_verified, is_active) VALUES
    (1, 'Central Sports Arena', '123 Main Street', 'Sofia', 'Premier multi-sport facility in the heart of Sofia', TRUE, TRUE),
    (2, 'Riverside Sports Park', '456 River Road', 'Plovdiv', 'Outdoor sports complex near the river', TRUE, TRUE),
    (3, 'Elite Fitness Center', '789 Stadium Avenue', 'Varna', 'Modern sports and fitness complex', TRUE, TRUE),
    (4, 'Mountain View Complex', '321 Highland Drive', 'Burgas', 'Sports facility with beautiful mountain views', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- SEED FACILITIES DATA
INSERT INTO facilities (id, name, sport_complex_id, manager_id, category_id, surface_id, environment_id, description, capacity, is_verified, is_active) VALUES
    -- Central Sports Arena facilities (complex_id: 1)
    -- Football facilities
    (1, 'Main Football Field', 1, NULL, 1, 2, 2, 'Full-size professional football field with artificial turf and floodlights', 200, TRUE, TRUE),
    (2, '5-a-side Pitch A', 1, NULL, 2, 2, 2, 'Small-sided football pitch with artificial turf, perfect for quick games', 50, TRUE, TRUE),
    -- Basketball facilities
    (3, 'Indoor Basketball Court 1', 1, NULL, 3, 3, 1, 'Championship basketball court with hardwood floor and bleacher seating', 500, TRUE, TRUE),
    (4, 'Half Court Basketball', 1, NULL, 4, 4, 2, 'Outdoor half basketball court with concrete surface', 30, TRUE, TRUE),

    -- Riverside Sports Park facilities (complex_id: 2)
    -- Football facilities
    (5, 'Riverside Football Pitch', 2, NULL, 1, 1, 2, 'Natural grass football field with riverside view', 150, TRUE, TRUE),
    (6, '5-a-side Pitch B', 2, NULL, 2, 2, 2, 'Compact artificial turf pitch for small team games', 40, TRUE, TRUE),
    -- Volleyball facilities
    (7, 'Beach Volleyball Court', 2, NULL, 7, 7, 2, 'Professional beach volleyball court with imported sand', 100, TRUE, TRUE),

    -- Elite Fitness Center facilities (complex_id: 3)
    -- Swimming facilities
    (8, 'Olympic Swimming Pool', 3, NULL, 9, 8, 4, '50-meter Olympic-size pool with 8 lanes and climate control', 300, TRUE, TRUE),
    (9, 'Training Pool', 3, NULL, 10, 8, 4, '25-meter training pool ideal for lessons and fitness swimming', 100, TRUE, TRUE),
    -- Volleyball facilities
    (10, 'Indoor Volleyball Court A', 3, NULL, 8, 3, 1, 'Professional volleyball court with hardwood floor and full equipment', 200, TRUE, TRUE),

    -- Mountain View Complex facilities (complex_id: 4)
    -- Tennis facilities
    (11, 'Clay Tennis Court 1', 4, NULL, 5, 5, 2, 'Professional red clay tennis court for singles play', 50, TRUE, TRUE),
    (12, 'Clay Tennis Court 2', 4, NULL, 6, 5, 2, 'Red clay tennis court suitable for doubles matches', 80, TRUE, TRUE),
    (13, 'Hard Court Tennis', 4, NULL, 5, 6, 2, 'Acrylic hard court for all-weather tennis', 50, TRUE, TRUE),
    -- Basketball facilities
    (14, 'Mountain View Sports Hall', 4, NULL, 3, 3, 1, 'Indoor basketball court with hardwood floor and mountain views', 400, TRUE, TRUE),
    
    -- Standalone facilities (no sport complex)
    (15, 'Downtown Tennis Club - Court A', NULL, NULL, 5, 6, 2, 'Professional hard court tennis singles court in city center', 40, TRUE, TRUE),
    (16, 'City Park Football Field', NULL, NULL, 1, 1, 2, 'Community football field with natural grass', 100, TRUE, TRUE),
    (17, 'Seaside Beach Volleyball', NULL, NULL, 7, 7, 2, 'Beach volleyball court right by the sea with natural sand', 80, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

