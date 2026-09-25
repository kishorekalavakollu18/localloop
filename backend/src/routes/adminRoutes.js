const express = require('express');
const router = express.Router();
const {
  getPlatformStats,
  getPendingVerifications,
  updateVerificationStatus,
  toggleUserBan,
  getAllUsers,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getPlatformStats);
router.get('/providers/pending', getPendingVerifications);
router.put('/providers/:id/verify', updateVerificationStatus);
router.put('/users/:id/ban', toggleUserBan);
router.get('/users', getAllUsers);

module.exports = router;
