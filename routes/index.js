const express = require('express');
const router = express.Router();

// Admin routes - mounted at /api/admin
router.use('/admin', require('./admin.routes'));

// Doctor routes - mounted at /api/doctors
router.use('/doctors', require('./doctor.routes'));

// Booking routes - mounted at /api/bookings
router.use('/bookings', require('./bookings.routes'));

// Slots/Booking routes - mounted at /api/slots
router.use('/slots', require('./booking.routes'));

module.exports = router;

