const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookingsByCustomer,
  getBookingsByProvider,
  updateBookingStatus,
  getBookingById,
  startTracking,
  updateLiveLocation,
  stopTracking,
  getBookingRoute,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createBooking);
router.get('/customer/:customerId', protect, getBookingsByCustomer);
router.get('/provider/:providerId', protect, getBookingsByProvider);
router.get('/:id', protect, getBookingById);
router.put('/:id/status', protect, updateBookingStatus);
router.post('/:id/start-tracking', protect, startTracking);
router.put('/:id/live-location', protect, updateLiveLocation);
router.post('/:id/stop-tracking', protect, stopTracking);
router.get('/:id/route', protect, getBookingRoute);

module.exports = router;
