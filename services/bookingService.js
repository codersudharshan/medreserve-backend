const { getClient, query } = require('../config/database');

/**
 * Create a new booking for a slot with concurrency control
 * 
 * This function uses a database transaction to prevent double-booking:
 * 1. Creates a booking record with status 'PENDING'
 * 2. Attempts to insert into booking_slots table (which has UNIQUE constraint on slot_id)
 * 3. If successful, updates booking to 'CONFIRMED' and commits
 * 4. If the slot is already booked (unique constraint violation), rolls back and throws error
 * 
 * The UNIQUE constraint on booking_slots.slot_id ensures that only one booking
 * can claim a slot, even under concurrent requests. The transaction ensures atomicity.
 * 
 * @param {Object} bookingData - Booking data
 * @param {number} bookingData.slotId - The ID of the slot to book
 * @param {string} bookingData.patientName - The name of the patient making the booking
 * @returns {Promise<Object>} The created booking record with status 'CONFIRMED'
 * @throws {Error} Throws error with statusCode 409 if slot is already booked
 */
async function createBooking({ slotId, patientName }) {
  const client = await getClient();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Step 1: Insert booking with PENDING status and expires_at set to 2 minutes from now
    // If the booking is not confirmed within 2 minutes, it will be marked as FAILED by the expiry job
    const bookingResult = await client.query(
      'INSERT INTO bookings (slot_id, patient_name, status, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'2 minutes\') RETURNING id, slot_id, patient_name, status, created_at, expires_at',
      [slotId, patientName, 'PENDING']
    );
    
    const booking = bookingResult.rows[0];
    const bookingId = booking.id;
    
    // Step 2: Attempt to insert into booking_slots
    // This will fail with unique constraint violation if slot is already booked
    try {
      await client.query(
        'INSERT INTO booking_slots (booking_id, slot_id) VALUES ($1, $2)',
        [bookingId, slotId]
      );
      
      // Step 3: If successful, update booking to CONFIRMED
      const confirmedResult = await client.query(
        'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        ['CONFIRMED', bookingId]
      );
      
      // Commit the transaction
      await client.query('COMMIT');
      
      return confirmedResult.rows[0];
      
    } catch (insertError) {
      // Check if this is a unique constraint violation (slot already booked)
      // PostgreSQL error code 23505 = unique_violation
      if (insertError.code === '23505') {
        // Rollback the transaction
        await client.query('ROLLBACK');
        
        // Throw a domain-specific error
        const error = new Error('Slot already booked');
        error.statusCode = 409;
        throw error;
      }
      
      // For other errors, rethrow to be handled by outer catch
      throw insertError;
    }
    
  } catch (error) {
    // If transaction is still open, rollback
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      // Ignore rollback errors if transaction was already rolled back
      console.error('Rollback error:', rollbackError);
    }
    
    // Re-throw the original error (or the custom 409 error)
    throw error;
    
  } finally {
    // Always release the client back to the pool
    client.release();
  }
}

/**
 * Get a booking by its ID
 * Retrieves the booking record from the database
 * 
 * @param {number} bookingId - The ID of the booking to retrieve
 * @returns {Promise<Object|null>} The booking record, or null if not found
 */
async function getBookingById(bookingId) {
  const result = await query(
    'SELECT * FROM bookings WHERE id = $1',
    [bookingId]
  );
  
  return result.rows[0] || null;
}

module.exports = {
  createBooking,
  getBookingById
};


