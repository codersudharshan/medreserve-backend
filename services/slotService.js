const { query } = require('../config/database');

/**
 * Create a new appointment slot for a doctor
 * First validates that the doctor exists, then inserts the slot into the database
 * @param {Object} slotData - Slot data containing doctorId, startTime, and optional durationMinutes
 * @param {number} slotData.doctorId - The ID of the doctor (required)
 * @param {string|Date} slotData.startTime - The start time of the slot (required)
 * @param {number} [slotData.durationMinutes] - Duration of the slot in minutes (defaults to 15)
 * @returns {Promise<Object>} The created slot record
 * @throws {Error} Throws error with statusCode 404 if doctor is not found
 */
async function createSlot({ doctorId, startTime, durationMinutes }) {
  // Check if doctor exists
  const doctorResult = await query(
    'SELECT id FROM doctors WHERE id = $1',
    [doctorId]
  );

  if (doctorResult.rows.length === 0) {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    throw error;
  }

  // Insert the slot (use 15 minutes as default if durationMinutes is not provided)
  const duration = durationMinutes || 15;
  const result = await query(
    'INSERT INTO slots (doctor_id, start_time, duration_minutes) VALUES ($1, $2, $3) RETURNING *',
    [doctorId, startTime, duration]
  );

  return result.rows[0];
}

module.exports = {
  createSlot
};


