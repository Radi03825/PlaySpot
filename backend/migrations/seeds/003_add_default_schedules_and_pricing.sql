-- Seed File 003: Default Facility Schedules and Pricing
-- This file adds default operating hours and pricing for all facilities

-- Add default weekday schedule (9 AM - 10 PM) for all facilities that don't have schedules
INSERT INTO facility_schedules (facility_id, open_time, close_time, day_type)
SELECT f.id, '09:00:00', '22:00:00', 'weekday'
FROM facilities f
WHERE NOT EXISTS (
    SELECT 1 FROM facility_schedules fs
    WHERE fs.facility_id = f.id AND fs.day_type = 'weekday'
);

-- Add default weekend schedule (8 AM - 11 PM) for all facilities that don't have schedules
INSERT INTO facility_schedules (facility_id, open_time, close_time, day_type)
SELECT f.id, '08:00:00', '23:00:00', 'weekend'
FROM facilities f
WHERE NOT EXISTS (
    SELECT 1 FROM facility_schedules fs
    WHERE fs.facility_id = f.id AND fs.day_type = 'weekend'
);

-- Add default weekday pricing (morning: cheaper, evening: more expensive)
-- Morning hours (9 AM - 12 PM): €20/hour
INSERT INTO facility_pricings (facility_id, day_type, start_hour, end_hour, price_per_hour)
SELECT f.id, 'weekday', '09:00:00', '12:00:00', 20.00
FROM facilities f
WHERE NOT EXISTS (
    SELECT 1 FROM facility_pricings fp
    WHERE fp.facility_id = f.id AND fp.day_type = 'weekday' AND fp.start_hour = '09:00:00'
);

-- Afternoon hours (12 PM - 6 PM): €25/hour
INSERT INTO facility_pricings (facility_id, day_type, start_hour, end_hour, price_per_hour)
SELECT f.id, 'weekday', '12:00:00', '18:00:00', 25.00
FROM facilities f
WHERE NOT EXISTS (
    SELECT 1 FROM facility_pricings fp
    WHERE fp.facility_id = f.id AND fp.day_type = 'weekday' AND fp.start_hour = '12:00:00'
);

-- Evening hours (6 PM - 10 PM): €30/hour
INSERT INTO facility_pricings (facility_id, day_type, start_hour, end_hour, price_per_hour)
SELECT f.id, 'weekday', '18:00:00', '22:00:00', 30.00
FROM facilities f
WHERE NOT EXISTS (
    SELECT 1 FROM facility_pricings fp
    WHERE fp.facility_id = f.id AND fp.day_type = 'weekday' AND fp.start_hour = '18:00:00'
);

-- Add default weekend pricing (all day premium)
-- Morning hours (8 AM - 12 PM): €25/hour
INSERT INTO facility_pricings (facility_id, day_type, start_hour, end_hour, price_per_hour)
SELECT f.id, 'weekend', '08:00:00', '12:00:00', 25.00
FROM facilities f
WHERE NOT EXISTS (
    SELECT 1 FROM facility_pricings fp
    WHERE fp.facility_id = f.id AND fp.day_type = 'weekend' AND fp.start_hour = '08:00:00'
);

-- Afternoon hours (12 PM - 6 PM): €35/hour
INSERT INTO facility_pricings (facility_id, day_type, start_hour, end_hour, price_per_hour)
SELECT f.id, 'weekend', '12:00:00', '18:00:00', 35.00
FROM facilities f
WHERE NOT EXISTS (
    SELECT 1 FROM facility_pricings fp
    WHERE fp.facility_id = f.id AND fp.day_type = 'weekend' AND fp.start_hour = '12:00:00'
);

-- Evening hours (6 PM - 11 PM): €40/hour
INSERT INTO facility_pricings (facility_id, day_type, start_hour, end_hour, price_per_hour)
SELECT f.id, 'weekend', '18:00:00', '23:00:00', 40.00
FROM facilities f
WHERE NOT EXISTS (
    SELECT 1 FROM facility_pricings fp
    WHERE fp.facility_id = f.id AND fp.day_type = 'weekend' AND fp.start_hour = '18:00:00'
);


