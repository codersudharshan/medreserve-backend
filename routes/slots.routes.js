/**
 * Slots Routes
 * 
 * Handles slot-related endpoints for booking appointments.
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

/**
 * POST /slots/:slotId/book
 * Book a specific slot with transaction-based concurrency control
 */
router.post('/slots/:slotId/book', bookingController.bookSlot);

module.exports = router;

