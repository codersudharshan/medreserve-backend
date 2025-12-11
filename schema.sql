-- MedReserve Database Schema
-- Healthcare appointment booking system

-- Doctors table: Stores medical professionals who can have appointment slots
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    specialization TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slots table: Represents available appointment time slots for doctors
-- Each slot can be booked by only one patient
CREATE TABLE IF NOT EXISTS slots (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table: Represents a patient's attempt to book a slot
-- Status can be PENDING, CONFIRMED, or FAILED
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    slot_id INTEGER NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking_slots table: Junction table linking bookings to slots
-- The UNIQUE constraint on slot_id ensures only one booking can own a given slot,
-- preventing double booking under concurrency
CREATE TABLE IF NOT EXISTS booking_slots (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    slot_id INTEGER NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (slot_id)
);

