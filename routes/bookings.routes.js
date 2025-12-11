/**
 * Bookings Routes
 * 
 * Handles booking retrieval endpoints.
 * Mounted at /api/bookings
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

/**
 * GET /:id
 * Get a booking by its ID
 * Full path: /api/bookings/:id
 */
router.get('/:id', bookingController.getBooking);

module.exports = router;

