const express = require('express');
const router = express.Router();
const {
  createProvider,
  getNearbyProviders,
  getProviderById,
  updateProvider,
  uploadProviderImage,
} = require('../controllers/providerController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, createProvider);
router.get('/nearby', getNearbyProviders);
router.get('/:id', getProviderById);
router.put('/:id', protect, updateProvider);
router.post('/:id/upload', protect, upload.single('image'), uploadProviderImage);

module.exports = router;
