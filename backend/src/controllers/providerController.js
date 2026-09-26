const Provider = require('../models/Provider');
const Review = require('../models/Review');
const User = require('../models/User');

const metersToKm = (meters) => {
  return Math.round((meters / 1000) * 10) / 10;
};

// Calculate travel fee logic: free up to 3km, +₹50 for every additional 3km block
const calculateTravelFee = (distanceKm) => {
  if (!distanceKm || distanceKm <= 3) return 0;
  const extraKm = distanceKm - 3;
  const blocks = Math.ceil(extraKm / 3);
  return blocks * 50;
};

// @desc    Register / Create a provider profile
// @route   POST /api/providers
// @access  Private (Provider only)
exports.createProvider = async (req, res) => {
  try {
    const userId = req.user._id;

    const existingProvider = await Provider.findOne({ userId });
    if (existingProvider) {
      return res.status(400).json({
        success: false,
        message: 'A provider profile already exists for this account',
        providerId: existingProvider._id,
      });
    }

    const {
      businessName,
      category,
      description,
      phone,
      coordinates, // [lng, lat]
      address,
      pricing,
      availability,
      images,
    } = req.body;

    if (!businessName || !category || !address || !pricing?.amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide businessName, category, address, and pricing amount',
      });
    }

    let coords = [77.5946, 12.9716];
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      coords = [parseFloat(coordinates[0]), parseFloat(coordinates[1])];
    }

    const defaultAvailability = availability || [
      { day: 'Monday', slots: ['09:00 - 12:00', '14:00 - 17:00'] },
      { day: 'Tuesday', slots: ['09:00 - 12:00', '14:00 - 17:00'] },
      { day: 'Wednesday', slots: ['09:00 - 12:00', '14:00 - 17:00'] },
      { day: 'Thursday', slots: ['09:00 - 12:00', '14:00 - 17:00'] },
      { day: 'Friday', slots: ['09:00 - 12:00', '14:00 - 17:00'] },
      { day: 'Saturday', slots: ['10:00 - 15:00'] },
    ];

    const provider = await Provider.create({
      userId,
      businessName,
      category: category.toLowerCase(),
      description: description || '',
      phone: phone || req.user.phone || '',
      location: {
        type: 'Point',
        coordinates: coords,
      },
      address,
      pricing: {
        type: pricing.type || 'per hour',
        amount: Number(pricing.amount),
      },
      availability: defaultAvailability,
      images: images || [],
      verificationStatus: 'pending',
      isVerified: false,
    });

    const userUpdate = { role: 'provider' };
    if (phone) userUpdate.phone = phone;
    await User.findByIdAndUpdate(userId, userUpdate);

    return res.status(201).json({
      success: true,
      message: 'Provider profile created successfully. Verification pending.',
      provider,
    });
  } catch (error) {
    console.error('Error creating provider:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating provider profile',
    });
  }
};

// @desc    Get nearby providers with 2dsphere geospatial search, travel fees, and relevance ranking
// @route   GET /api/providers/nearby
// @access  Public
// @desc    Get nearby providers with 2dsphere geospatial search, travel fees, and smart fallback for 100% visibility
// @route   GET /api/providers/nearby
// @access  Public
exports.getNearbyProviders = async (req, res) => {
  try {
    const { lat, lng, radius, category, search, sort } = req.query;

    const radiusKm = radius ? parseFloat(radius) : 50;
    const maxDistanceMeters = radiusKm * 1000;

    const matchFilter = {};
    if (category && category !== 'all') {
      matchFilter.category = category.toLowerCase();
    }
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      matchFilter.$or = [
        { businessName: searchRegex },
        { description: searchRegex },
        { address: searchRegex },
        { category: searchRegex },
      ];
    }

    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      const buildPipeline = (applyDistanceCap = true, applyCategory = true, applySearch = true) => {
        const currentMatch = {};
        if (applyCategory && category && category !== 'all') {
          currentMatch.category = category.toLowerCase();
        }
        if (applySearch && search && search.trim()) {
          const searchRegex = new RegExp(search.trim(), 'i');
          currentMatch.$or = [
            { businessName: searchRegex },
            { description: searchRegex },
            { address: searchRegex },
            { category: searchRegex },
          ];
        }

        const geoNearStage = {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            distanceField: 'distanceMeters',
            spherical: true,
            query: currentMatch,
          },
        };

        if (applyDistanceCap && maxDistanceMeters > 0) {
          geoNearStage.$geoNear.maxDistance = maxDistanceMeters;
        }

        const pipeline = [
          geoNearStage,
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
            },
          },
          {
            $unwind: {
              path: '$user',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              'user.password': 0,
            },
          },
        ];

        if (sort === 'rating') {
          pipeline.push({ $sort: { 'rating.avg': -1, distanceMeters: 1 } });
        } else if (sort === 'price_asc') {
          pipeline.push({ $sort: { 'pricing.amount': 1 } });
        } else if (sort === 'price_desc') {
          pipeline.push({ $sort: { 'pricing.amount': -1 } });
        } else {
          pipeline.push({ $sort: { distanceMeters: 1 } });
        }

        return pipeline;
      };

      // Attempt 1: Strict distance cap with search & category
      let providers = await Provider.aggregate(buildPipeline(true, true, true));
      let isFallback = false;
      let fallbackMessage = '';

      // Attempt 2: If 0 providers within distance cap, expand to ALL distances (no distance cap)
      if (providers.length === 0) {
        providers = await Provider.aggregate(buildPipeline(false, true, true));
        if (providers.length > 0) {
          isFallback = true;
          fallbackMessage = `Expanded search beyond ${radiusKm} km to show all matching neighborhood providers.`;
        }
      }

      // Attempt 3: If still 0 providers (e.g., search keyword yielded no direct match), show ALL available providers sorted by distance!
      if (providers.length === 0) {
        providers = await Provider.aggregate(buildPipeline(false, false, false));
        if (providers.length > 0) {
          isFallback = true;
          fallbackMessage = `No exact matches for "${search || category}". Showing all available neighborhood providers.`;
        }
      }

      // Map distance in km, calculate travel fee & relevance score
      providers = providers.map((p) => {
        const distKm = metersToKm(p.distanceMeters);
        const travelFee = calculateTravelFee(distKm);
        const etaMinutes = Math.max(5, Math.round((distKm / 25) * 60) + 5);
        const relevanceScore = Math.round(
          (p.rating?.avg || 0) * 20 + Math.max(0, 100 - distKm * 2) + (p.rating?.count || 0) * 0.5
        );

        return {
          ...p,
          distanceKm: distKm,
          etaMinutes,
          travelFee,
          relevanceScore,
          isOnline: p.isOnline !== false,
          pincode: p.pincode || (p.address ? p.address.match(/\b[1-9][0-9]{5}\b/)?.[0] : ''),
        };
      });

      return res.status(200).json({
        success: true,
        count: providers.length,
        radiusKm,
        isFallback,
        fallbackMessage,
        center: { lat: latitude, lng: longitude },
        providers,
      });
    } else {
      // No coordinates passed: standard query with fallback
      let queryMatch = { ...matchFilter };
      let providers = await Provider.find(queryMatch).populate('userId', 'name email phone');

      let isFallback = false;
      let fallbackMessage = '';

      // If search yielded 0 results, return ALL providers as fallback
      if (providers.length === 0) {
        providers = await Provider.find({}).populate('userId', 'name email phone');
        isFallback = true;
        fallbackMessage = `Showing all available neighborhood service providers.`;
      }

      if (sort === 'rating') {
        providers.sort((a, b) => (b.rating?.avg || 0) - (a.rating?.avg || 0));
      } else if (sort === 'price_asc') {
        providers.sort((a, b) => (a.pricing?.amount || 0) - (b.pricing?.amount || 0));
      } else if (sort === 'price_desc') {
        providers.sort((a, b) => (b.pricing?.amount || 0) - (a.pricing?.amount || 0));
      }

      return res.status(200).json({
        success: true,
        count: providers.length,
        isFallback,
        fallbackMessage,
        providers,
      });
    }
  } catch (error) {
    console.error('Error fetching nearby providers:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error searching providers',
    });
  }
};

// @desc    Search autocomplete suggestions
// @route   GET /api/providers/autocomplete
// @access  Public
exports.getAutocompleteSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(200).json({ success: true, suggestions: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    const matches = await Provider.find({
      $or: [
        { businessName: regex },
        { category: regex },
        { address: regex },
        { description: regex },
      ],
    })
      .select('businessName category address')
      .limit(6);

    const suggestions = matches.map((m) => ({
      id: m._id,
      title: m.businessName,
      category: m.category,
      subtitle: m.address,
    }));

    return res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('Error in autocomplete:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching suggestions',
    });
  }
};

// @desc    Get provider by ID with populated details and reviews
// @route   GET /api/providers/:id
// @access  Public
exports.getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id).populate(
      'userId',
      'name email phone createdAt'
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
      });
    }

    const reviews = await Review.find({ providerId: provider._id })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      provider,
      reviews,
    });
  } catch (error) {
    console.error('Error fetching provider by ID:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching provider details',
    });
  }
};

// @desc    Update provider profile
// @route   PUT /api/providers/:id
// @access  Private (Provider only)
exports.updateProvider = async (req, res) => {
  try {
    let provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found',
      });
    }

    if (
      provider.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this provider profile',
      });
    }

    const {
      businessName,
      category,
      description,
      phone,
      coordinates,
      address,
      pricing,
      availability,
      images,
    } = req.body;

    if (businessName) provider.businessName = businessName;
    if (category) provider.category = category.toLowerCase();
    if (description !== undefined) provider.description = description;
    if (phone !== undefined) provider.phone = phone;
    if (address) provider.address = address;
    if (pricing) {
      provider.pricing = {
        type: pricing.type || provider.pricing.type,
        amount: pricing.amount !== undefined ? Number(pricing.amount) : provider.pricing.amount,
      };
    }
    if (availability) provider.availability = availability;
    if (images) provider.images = images;

    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      provider.location = {
        type: 'Point',
        coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])],
      };
    }

    await provider.save();
    if (phone && provider.userId) {
      await User.findByIdAndUpdate(provider.userId, { phone });
    }

    return res.status(200).json({
      success: true,
      message: 'Provider profile updated successfully',
      provider,
    });
  } catch (error) {
    console.error('Error updating provider:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating provider profile',
    });
  }
};

// @desc    Upload image for provider profile
// @route   POST /api/providers/:id/upload
// @access  Private (Provider only)
exports.uploadProviderImage = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image file to upload',
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    provider.images.push(fileUrl);
    await provider.save();

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: fileUrl,
      images: provider.images,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error uploading file',
    });
  }
};

// @desc    Upload ID / verification document for provider
// @route   POST /api/providers/:id/verify-document
// @access  Private (Provider only)
exports.uploadVerificationDoc = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a document file to upload',
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    provider.verificationDoc = fileUrl;
    provider.verificationStatus = 'pending';
    await provider.save();

    return res.status(200).json({
      success: true,
      message: 'Verification document uploaded successfully. Submitted for admin review.',
      verificationDoc: fileUrl,
      verificationStatus: 'pending',
    });
  } catch (error) {
    console.error('Error uploading verification doc:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error uploading document',
    });
  }
};

// @desc    Toggle provider online/offline status
// @route   PUT /api/providers/:id/toggle-online
// @access  Private (Provider only)
exports.toggleOnline = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    if (provider.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this status' });
    }

    const { isOnline } = req.body;
    provider.isOnline = typeof isOnline === 'boolean' ? isOnline : !provider.isOnline;
    await provider.save();

    // Broadcast online status change to connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('provider_status_changed', {
        providerId: provider._id,
        isOnline: provider.isOnline,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Provider is now ${provider.isOnline ? 'Online' : 'Offline'}`,
      isOnline: provider.isOnline,
      provider,
    });
  } catch (error) {
    console.error('Error toggling online status:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update provider live location
// @route   PUT /api/providers/:id/location
// @access  Private (Provider only)
exports.updateProviderLocation = async (req, res) => {
  try {
    const { coordinates } = req.body;
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates [lng, lat]' });
    }

    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    if (provider.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update location' });
    }

    const lng = parseFloat(coordinates[0]);
    const lat = parseFloat(coordinates[1]);
    provider.currentLocation = { type: 'Point', coordinates: [lng, lat] };
    await provider.save();

    return res.status(200).json({
      success: true,
      message: 'Location updated',
      currentLocation: provider.currentLocation,
    });
  } catch (error) {
    console.error('Error updating provider location:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
