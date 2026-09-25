const express = require('express');
const router = express.Router();
const {
  getBookingMessages,
  sendMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:bookingId', protect, getBookingMessages);
router.post('/', protect, sendMessage);

module.exports = router;
