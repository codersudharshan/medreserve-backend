const doctorService = require('../services/doctorService');

/**
 * Create a new doctor
 * Validates that name is provided, then creates the doctor via the service
 */
async function createDoctor(req, res, next) {
  try {
    const { name, specialization } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const doctor = await doctorService.createDoctor({ name, specialization });
    res.status(201).json(doctor);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all doctors
 * Retrieves and returns the list of all doctors
 */
async function getDoctors(req, res, next) {
  try {
    const doctors = await doctorService.getAllDoctors();
    res.json(doctors);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all slots for a specific doctor
 * Retrieves and returns all appointment slots for the given doctor ID
 */
async function getDoctorSlots(req, res, next) {
  try {
    const doctorId = req.params.id;
    const slots = await doctorService.getDoctorSlots(doctorId);
    res.json(slots);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorSlots
};


