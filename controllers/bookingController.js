const bookingService = require('../services/bookingService');
const { getClient } = require('../config/database');

/**
 * Book a slot using a SQL transaction
 * Uses FOR UPDATE to lock the slot and prevent double booking
 */
async function bookSlot(req, res, next) {
  const client = await getClient();
  
  try {
    const slotId = parseInt(req.params.slotId);
    const { patient_name, patient_email } = req.body;

    // Validate required fields
    if (!slotId || !patient_name) {
      return res.status(400).json({ error: 'slotId and patient_name are required' });
    }

    // Start transaction
    await client.query('BEGIN');

    try {
      // SELECT the slot with FOR UPDATE to lock it
      const slotResult = await client.query(
        'SELECT id FROM slots WHERE id = $1 FOR UPDATE',
        [slotId]
      );

      if (slotResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Slot not found' });
      }

      // Insert into bookings with status PENDING and expires_at set to 2 minutes from now
      // If the booking is not confirmed within 2 minutes, it will be marked as FAILED by the expiry job
      // Note: patient_email is optional and may not exist in the schema
      const bookingResult = await client.query(
        'INSERT INTO bookings (slot_id, patient_name, status, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'2 minutes\') RETURNING *',
        [slotId, patient_name, 'PENDING']
      );
      const booking = bookingResult.rows[0];

      // Try to insert into booking_slots (unique constraint on slot_id)
      try {
        await client.query(
          'INSERT INTO booking_slots (booking_id, slot_id) VALUES ($1, $2)',
          [booking.id, slotId]
        );

        // Success - update booking status to CONFIRMED
        const confirmedResult = await client.query(
          'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
          ['CONFIRMED', booking.id]
        );
        const confirmedBooking = confirmedResult.rows[0];

        // Commit transaction
        await client.query('COMMIT');

        // Return the confirmed booking
        res.status(201).json({
          id: confirmedBooking.id,
          slot_id: confirmedBooking.slot_id,
          patient_name: confirmedBooking.patient_name,
          patient_email: patient_email || null,
          status: confirmedBooking.status,
          created_at: confirmedBooking.created_at,
          updated_at: confirmedBooking.updated_at
        });
      } catch (insertError) {
        // Check if it's a unique violation (slot already booked)
        if (insertError.code === '23505') { // PostgreSQL unique violation error code
          await client.query('ROLLBACK');
          return res.status(409).json({ error: 'Slot already booked' });
        }
        // Other error - rollback and rethrow
        await client.query('ROLLBACK');
        throw insertError;
      }
    } catch (error) {
      // Rollback on any error
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    // Pass to error handling middleware
    next(error);
  } finally {
    // Always release the client
    client.release();
  }
}

/**
 * Create a new booking for a slot
 * Validates that slotId and patientName are provided, then creates the booking via the service
 * Handles concurrency errors (409) and other errors appropriately
 */
async function createBooking(req, res, next) {
  try {
    const slotId = req.params.slotId;
    const { patientName } = req.body;

    if (!slotId || !patientName) {
      return res.status(400).json({ error: 'slotId and patientName are required' });
    }

    const booking = await bookingService.createBooking({ slotId, patientName });
    res.status(201).json(booking);
  } catch (error) {
    // If the error has a statusCode (e.g., 409 for slot already booked), use it
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    // Otherwise, pass to error handling middleware
    next(error);
  }
}

/**
 * Get a booking by its ID
 * Retrieves the booking from the service and returns it, or 404 if not found
 */
async function getBooking(req, res, next) {
  try {
    const bookingId = req.params.id;
    const booking = await bookingService.getBookingById(bookingId);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.status(200).json(booking);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  bookSlot,
  createBooking,
  getBooking
};

