/**
 * Doctor Routes
 * 
 * Public endpoints for viewing doctors and their available appointment slots.
 * These routes are used by patients/clients to:
 * - List all doctors in the system
 * - Create new doctors
 * - View available slots for a specific doctor
 */

const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

/**
 * GET /
 * List all doctors
 */
router.get('/', doctorController.getDoctors);

/**
 * POST /
 * Create a new doctor
 */
router.post('/', doctorController.createDoctor);

/**
 * GET /:id/slots
 * List all slots for a specific doctor (by doctor id)
 */
router.get('/:id/slots', doctorController.getDoctorSlots);

module.exports = router;

