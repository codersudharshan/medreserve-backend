/**
 * Booking Routes (mounted at /api/slots)
 * 
 * Handles booking-related endpoints for patients to create appointments.
 * When mounted at /api/slots, the route becomes /api/slots/:slotId/book
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

/**
 * POST /:slotId/book
 * Book a specific slot (mounted at /api/slots, so full path is /api/slots/:slotId/book)
 */
router.post('/:slotId/book', bookingController.bookSlot);

module.exports = router;

