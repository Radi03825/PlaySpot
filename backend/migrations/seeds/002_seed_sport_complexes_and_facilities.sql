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
    (1, 'Main Football Field', 1, NULL, 1, 2, 2, 'Professional-grade football field with lighting', 200, TRUE, TRUE),
    (2, 'Indoor Basketball Court 1', 1, NULL, 3, 3, 1, 'Championship basketball court with bleacher seating', 500, TRUE, TRUE),
    (3, 'Tennis Court A', NULL, NULL, 5, 6, 2, 'Professional acrylic tennis court', 50, TRUE, TRUE),

    -- Riverside Sports Park facilities (complex_id: 2)
    (4, '5-a-side Pitch 1', 2, NULL, 2, 2, 2, 'Small-sided football pitch perfect for quick games', 50, TRUE, TRUE),
    (5, 'Beach Volleyball Court', 2, NULL, 7, 7, 2, 'Regulation beach volleyball court with quality sand', 100, TRUE, TRUE),

    -- Elite Fitness Center facilities (complex_id: 3)
    (6, 'Olympic Swimming Pool', 3, NULL, 9, 8, 4, '50m Olympic-size swimming pool with 8 lanes', 300, TRUE, TRUE),
    (7, 'Indoor Volleyball Court', 3, NULL, 8, 3, 1, 'Professional volleyball court with sprung floor', 200, TRUE, TRUE),

    -- Mountain View Complex facilities (complex_id: 4)
    (8, 'Tennis Court Complex', 4, NULL, 6, 5, 2, 'Red clay tennis courts, set of 4 courts', 200, TRUE, TRUE),
    (9, 'Multi-Purpose Sports Hall', 4, NULL, 3, 3, 1, 'Large indoor hall suitable for basketball, volleyball, and events', 800, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

