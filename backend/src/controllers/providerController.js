const Provider = require('../models/Provider');
const Review = require('../models/Review');
const User = require('../models/User');

// Helper to convert meters to kilometers
const metersToKm = (meters) => {
  return Math.round((meters / 1000) * 10) / 10;
};

// @desc    Register / Create a provider profile
// @route   POST /api/providers
// @access  Private (Provider only)
exports.createProvider = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if provider profile already exists
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

    // Default coordinates if not provided (e.g., standard city center default [lng, lat])
    let coords = [77.5946, 12.9716]; // Default Bangalore center, or user provided
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      coords = [parseFloat(coordinates[0]), parseFloat(coordinates[1])];
    }

    // Default availability if none provided
    const defaultAvailability = availability || [
      { day: 'Monday', slots: ['09:00 - 12:00', '14:00 - 18:00'] },
      { day: 'Tuesday', slots: ['09:00 - 12:00', '14:00 - 18:00'] },
      { day: 'Wednesday', slots: ['09:00 - 12:00', '14:00 - 18:00'] },
      { day: 'Thursday', slots: ['09:00 - 12:00', '14:00 - 18:00'] },
      { day: 'Friday', slots: ['09:00 - 12:00', '14:00 - 18:00'] },
      { day: 'Saturday', slots: ['10:00 - 16:00'] },
    ];

    const provider = await Provider.create({
      userId,
      businessName,
      category: category.toLowerCase(),
      description: description || '',
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
    });

    // Also ensure user role is marked as provider
    await User.findByIdAndUpdate(userId, { role: 'provider' });

    return res.status(201).json({
      success: true,
      message: 'Provider profile created successfully',
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

// @desc    Get nearby providers with 2dsphere geospatial search
// @route   GET /api/providers/nearby
// @access  Public
exports.getNearbyProviders = async (req, res) => {
  try {
    const { lat, lng, radius, category, search, sort } = req.query;

    const radiusKm = radius ? parseFloat(radius) : 25; // default 25km radius
    const maxDistanceMeters = radiusKm * 1000;

    // Build filter query
    const matchFilter = {};
    if (category && category !== 'all') {
      matchFilter.category = category.toLowerCase();
    }
    if (search) {
      matchFilter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    // If coordinates are provided, perform $geoNear aggregation
    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      const pipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            distanceField: 'distanceMeters',
            maxDistance: maxDistanceMeters,
            spherical: true,
            query: matchFilter,
          },
        },
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

      // Sorting
      if (sort === 'rating') {
        pipeline.push({ $sort: { 'rating.avg': -1, distanceMeters: 1 } });
      } else if (sort === 'price_asc') {
        pipeline.push({ $sort: { 'pricing.amount': 1 } });
      } else if (sort === 'price_desc') {
        pipeline.push({ $sort: { 'pricing.amount': -1 } });
      } else {
        // default sort by distance
        pipeline.push({ $sort: { distanceMeters: 1 } });
      }

      let providers = await Provider.aggregate(pipeline);

      // Map formatted distance in km
      providers = providers.map((p) => ({
        ...p,
        distanceKm: metersToKm(p.distanceMeters),
      }));

      return res.status(200).json({
        success: true,
        count: providers.length,
        radiusKm,
        center: { lat: latitude, lng: longitude },
        providers,
      });
    } else {
      // If coordinates not provided, return standard list with optional filters
      let query = Provider.find(matchFilter).populate('userId', 'name email phone');

      if (sort === 'rating') {
        query = query.sort({ 'rating.avg': -1 });
      } else if (sort === 'price_asc') {
        query = query.sort({ 'pricing.amount': 1 });
      } else if (sort === 'price_desc') {
        query = query.sort({ 'pricing.amount': -1 });
      } else {
        query = query.sort({ createdAt: -1 });
      }

      const providers = await query.exec();

      return res.status(200).json({
        success: true,
        count: providers.length,
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

    // Fetch reviews for this provider
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

    // Verify ownership
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
      coordinates, // [lng, lat]
      address,
      pricing,
      availability,
      images,
    } = req.body;

    if (businessName) provider.businessName = businessName;
    if (category) provider.category = category.toLowerCase();
    if (description !== undefined) provider.description = description;
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

// @desc    Upload image for provider
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

    if (
      provider.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload images for this profile',
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
