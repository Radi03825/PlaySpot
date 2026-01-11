-- Seed File 002: Sport Complexes and Facilities Sample Data
-- This file seeds sample sport complexes and facilities for testing

-- SEED SPORT COMPLEXES DATA
INSERT INTO sport_complexes (name, address, city, description, is_verified, is_active) VALUES
    ('Central Sports Arena', '123 Main Street', 'Sofia', 'Premier multi-sport facility in the heart of Sofia', TRUE, TRUE),
    ( 'Riverside Sports Park', '456 River Road', 'Plovdiv', 'Outdoor sports complex near the river', TRUE, TRUE),
    ( 'Elite Fitness Center', '789 Stadium Avenue', 'Varna', 'Modern sports and fitness complex', TRUE, TRUE),
    ('Mountain View Complex', '321 Highland Drive', 'Burgas', 'Sports facility with beautiful mountain views', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- SEED FACILITIES DATA
INSERT INTO facilities (name, sport_complex_id, manager_id, category_id, surface_id, environment_id, city, address, description, capacity, is_verified, is_active) VALUES
    -- Central Sports Arena facilities (complex_id: 1)
    -- Football facilities
    ('Main Football Field', 1, NULL, 1, 2, 2, 'Sofia', '123 Main Street', 'Full-size professional football field with artificial turf and floodlights', 200, TRUE, TRUE),
    ('5-a-side Pitch A', 1, NULL, 2, 2, 2, 'Sofia', '123 Main Street','Small-sided football pitch with artificial turf, perfect for quick games', 50, TRUE, TRUE),
    -- Basketball facilities
    ('Indoor Basketball Court 1', 1, NULL, 3, 3, 1,'Sofia', '123 Main Street', 'Championship basketball court with hardwood floor and bleacher seating', 500, TRUE, TRUE),
    ('Half Court Basketball', 1, NULL, 4, 4, 2,'Sofia', '123 Main Street', 'Outdoor half basketball court with concrete surface', 30, TRUE, TRUE),

    -- Riverside Sports Park facilities (complex_id: 2)
    -- Football facilities
    ('Riverside Football Pitch', 2, NULL, 1, 1, 2, 'Plovdiv','456 River Road', 'Natural grass football field with riverside view', 150, TRUE, TRUE),
    ('5-a-side Pitch B', 2, NULL, 2, 2, 2, 'Plovdiv','456 River Road','Compact artificial turf pitch for small team games', 40, TRUE, TRUE),
    -- Volleyball facilities
    ('Beach Volleyball Court', 2, NULL, 7, 7, 2, 'Plovdiv','456 River Road','Professional beach volleyball court with imported sand', 100, TRUE, TRUE),

    -- Elite Fitness Center facilities (complex_id: 3)
    -- Swimming facilities
    ('Olympic Swimming Pool', 3, NULL, 9, 8, 4, 'Varna','789 Stadium Avenue','50-meter Olympic-size pool with 8 lanes and climate control', 300, TRUE, TRUE),
    ('Training Pool', 3, NULL, 10, 8, 4, 'Varna','789 Stadium Avenue', '25-meter training pool ideal for lessons and fitness swimming', 100, TRUE, TRUE),
    -- Volleyball facilities
    ('Indoor Volleyball Court A', 3, NULL, 8, 3, 1, 'Varna','789 Stadium Avenue','Professional volleyball court with hardwood floor and full equipment', 200, TRUE, TRUE),

    -- Mountain View Complex facilities (complex_id: 4)
    -- Tennis facilities
    ('Clay Tennis Court 1', 4, NULL, 5, 5, 2, 'Burgas','321 Highland Drive' ,'Professional red clay tennis court for singles play', 50, TRUE, TRUE),
    ('Clay Tennis Court 2', 4, NULL, 6, 5, 2, 'Burgas','321 Highland Drive', 'Red clay tennis court suitable for doubles matches', 80, TRUE, TRUE),
    ('Hard Court Tennis', 4, NULL, 5, 6, 2, 'Burgas','321 Highland Drive', 'Acrylic hard court for all-weather tennis', 50, TRUE, TRUE),
    -- Basketball facilities
    ('Mountain View Sports Hall', 4, NULL, 3, 3, 1, 'Burgas','321 Highland Drive', 'Indoor basketball court with hardwood floor and mountain views', 400, TRUE, TRUE),
    
    -- Standalone facilities (no sport complex)
    ('Downtown Tennis Club - Court A', NULL, NULL, 5, 6, 2, 'Sofia', '123 Main Street','Professional hard court tennis singles court in city center', 40, TRUE, TRUE),
    ('City Park Football Field', NULL, NULL, 1, 1, 2, 'Plovdiv','456 River Road','Community football field with natural grass', 100, TRUE, TRUE),
    ( 'Seaside Beach Volleyball', NULL, NULL, 7, 7, 2, 'Burgas','321 Highland Drive', 'Beach volleyball court right by the sea with natural sand', 80, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

