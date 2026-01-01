-- Seed File 001: Sports and Metadata
-- This file seeds basic sports data, categories, surfaces, and environments

-- SEED SPORTS DATA
INSERT INTO sports (id, name) VALUES
    (1, 'Football'),
    (2, 'Basketball'),
    (3, 'Tennis'),
    (4, 'Volleyball'),
    (5, 'Swimming')
ON CONFLICT (id) DO NOTHING;

-- SEED CATEGORIES DATA
INSERT INTO categories (id, name, sport_id) VALUES
    (1, 'Soccer Field', 1),
    (2, '5-a-side', 1),
    (3, 'Full Court', 2),
    (4, 'Half Court', 2),
    (5, 'Singles Court', 3),
    (6, 'Doubles Court', 3),
    (7, 'Beach Volleyball', 4),
    (8, 'Indoor Court', 4),
    (9, 'Olympic Pool', 5),
    (10, 'Training Pool', 5)
ON CONFLICT (id) DO NOTHING;

-- SEED SURFACES DATA
INSERT INTO surfaces (id, name, description) VALUES
    (1, 'Grass', 'Natural grass surface'),
    (2, 'Artificial Turf', 'Synthetic grass surface'),
    (3, 'Hardwood', 'Wooden court surface'),
    (4, 'Concrete', 'Concrete surface'),
    (5, 'Clay', 'Clay court surface'),
    (6, 'Acrylic', 'Hard acrylic court surface'),
    (7, 'Sand', 'Sand surface for beach sports'),
    (8, 'Water', 'Water surface for swimming')
ON CONFLICT (id) DO NOTHING;

-- SEED ENVIRONMENTS DATA
INSERT INTO environments (id, name, description) VALUES
    (1, 'Indoor', 'Fully enclosed indoor facility'),
    (2, 'Outdoor', 'Open-air outdoor facility'),
    (3, 'Semi-Covered', 'Partially covered facility'),
    (4, 'Climate Controlled', 'Temperature and humidity controlled')
ON CONFLICT (id) DO NOTHING;

