-- Migration: Add booking expiry support
-- Adds expires_at column and index for efficient expiry queries

-- Add expires_at column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL;

-- Create index for efficient queries on status and expires_at
-- This index helps the expiry job quickly find PENDING bookings that have expired
CREATE INDEX IF NOT EXISTS idx_bookings_status_expires ON bookings(status, expires_at);

