const { query } = require('../config/database');

/**
 * Create a new doctor in the database
 * @param {Object} doctorData - Doctor data containing name and optional specialization
 * @param {string} doctorData.name - Doctor's name (required)
 * @param {string} [doctorData.specialization] - Doctor's specialization (optional)
 * @returns {Promise<Object>} The created doctor record
 */
async function createDoctor({ name, specialization }) {
  const result = await query(
    'INSERT INTO doctors (name, specialization) VALUES ($1, $2) RETURNING *',
    [name, specialization || null]
  );
  return result.rows[0];
}

/**
 * Get all doctors from the database, ordered by creation date (newest first)
 * @returns {Promise<Array>} Array of doctor records
 */
async function getAllDoctors() {
  const result = await query(
    'SELECT * FROM doctors ORDER BY created_at DESC',
    []
  );
  return result.rows;
}

/**
 * Get all appointment slots for a specific doctor, ordered by start time (earliest first)
 * @param {number} doctorId - The ID of the doctor
 * @returns {Promise<Array>} Array of slot records for the doctor
 */
async function getDoctorSlots(doctorId) {
  const result = await query(
    'SELECT * FROM slots WHERE doctor_id = $1 ORDER BY start_time ASC',
    [doctorId]
  );
  return result.rows;
}

module.exports = {
  createDoctor,
  getAllDoctors,
  getDoctorSlots
};


