const slotService = require('../services/slotService');

/**
 * Create a new appointment slot for a doctor
 * Validates that doctorId and startTime are provided, then creates the slot via the service
 */
async function createSlot(req, res, next) {
  try {
    const { doctorId, startTime, durationMinutes } = req.body;

    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }

    if (!startTime) {
      return res.status(400).json({ error: 'Start time is required' });
    }

    const slot = await slotService.createSlot({ doctorId, startTime, durationMinutes });
    res.status(201).json(slot);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createSlot
};


