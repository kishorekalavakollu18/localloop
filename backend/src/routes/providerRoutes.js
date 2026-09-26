const express = require('express');
const router = express.Router();
const {
  createProvider,
  getNearbyProviders,
  getProviderById,
  updateProvider,
  uploadProviderImage,
  getAutocompleteSuggestions,
  uploadVerificationDoc,
  toggleOnline,
  updateProviderLocation,
} = require('../controllers/providerController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, createProvider);
router.get('/nearby', getNearbyProviders);
router.get('/autocomplete', getAutocompleteSuggestions);
router.get('/:id', getProviderById);
router.put('/:id', protect, updateProvider);
router.put('/:id/toggle-online', protect, toggleOnline);
router.put('/:id/location', protect, updateProviderLocation);
router.post('/:id/upload', protect, upload.single('image'), uploadProviderImage);
router.post('/:id/verify-document', protect, upload.single('image'), uploadVerificationDoc);

module.exports = router;
