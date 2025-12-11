/**
 * Admin Routes
 * 
 * Administrative endpoints for managing doctors, slots, and viewing statistics.
 * All endpoints are mounted under /api/admin
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * POST /doctors
 * Create a new doctor
 * Validation: name is required, specialization is optional
 */
async function createDoctor(req, res, next) {
  try {
    const { name, specialization } = req.body;

    // Validate name is required
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required and must be a non-empty string' });
    }

    // Insert doctor into database
    const result = await query(
      'INSERT INTO doctors (name, specialization) VALUES ($1, $2) RETURNING *',
      [name.trim(), specialization || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /doctors
 * List all doctors ordered by id
 */
async function listDoctors(req, res, next) {
  try {
    const result = await query(
      'SELECT * FROM doctors ORDER BY id',
      []
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /slots
 * Create a new appointment slot for a doctor
 * Validation: doctor must exist, start_time must be parsable, duration_minutes > 0
 */
async function createSlot(req, res, next) {
  try {
    const { doctor_id, start_time, duration_minutes } = req.body;

    // Validate doctor_id
    if (!doctor_id) {
      return res.status(400).json({ error: 'doctor_id is required' });
    }

    // Validate start_time is provided and parsable
    if (!start_time) {
      return res.status(400).json({ error: 'start_time is required' });
    }

    // Try to parse start_time - PostgreSQL will validate the format
    let parsedStartTime;
    try {
      parsedStartTime = new Date(start_time);
      if (isNaN(parsedStartTime.getTime())) {
        return res.status(400).json({ error: 'start_time must be a valid date/time' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'start_time must be a valid date/time' });
    }

    // Validate duration_minutes
    const duration = duration_minutes ? parseInt(duration_minutes) : 15;
    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({ error: 'duration_minutes must be a positive number' });
    }

    // Check if doctor exists
    const doctorCheck = await query(
      'SELECT id FROM doctors WHERE id = $1',
      [doctor_id]
    );

    if (doctorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Insert slot into database
    const result = await query(
      'INSERT INTO slots (doctor_id, start_time, duration_minutes) VALUES ($1, $2, $3) RETURNING *',
      [doctor_id, start_time, duration]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /doctors/:id/slots
 * List all slots for a specific doctor, ordered by start_time
 */
async function getDoctorSlots(req, res, next) {
  try {
    const doctorId = req.params.id;

    if (!doctorId) {
      return res.status(400).json({ error: 'doctor id is required' });
    }

    const result = await query(
      'SELECT * FROM slots WHERE doctor_id = $1 ORDER BY start_time',
      [doctorId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /stats
 * Get basic statistics: counts of doctors, slots, and bookings
 */
async function getStats(req, res, next) {
  try {
    // Get counts for each table
    const [doctorsResult, slotsResult, bookingsResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM doctors', []),
      query('SELECT COUNT(*) as count FROM slots', []),
      query('SELECT COUNT(*) as count FROM bookings', [])
    ]);

    res.json({
      doctors: parseInt(doctorsResult.rows[0].count),
      slots: parseInt(slotsResult.rows[0].count),
      bookings: parseInt(bookingsResult.rows[0].count)
    });
  } catch (error) {
    next(error);
  }
}

// Define routes
router.post('/doctors', createDoctor);
router.get('/doctors', listDoctors);
router.post('/slots', createSlot);
router.get('/doctors/:id/slots', getDoctorSlots);
router.get('/stats', getStats);

module.exports = router;
