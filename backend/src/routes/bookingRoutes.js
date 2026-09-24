const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookingsByCustomer,
  getBookingsByProvider,
  updateBookingStatus,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createBooking);
router.get('/customer/:customerId', protect, getBookingsByCustomer);
router.get('/provider/:providerId', protect, getBookingsByProvider);
router.put('/:id/status', protect, updateBookingStatus);

module.exports = router;
