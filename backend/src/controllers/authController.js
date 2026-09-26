const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Provider = require('../models/Provider');
const { geocodeAddress } = require('../utils/geocoder');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'localloop_secret_fallback', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, pincode, coordinates } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    let finalCoords = coordinates;
    let finalPincode = pincode ? pincode.toString().trim() : '';
    let finalAddress = address ? address.toString().trim() : '';

    if (!finalCoords || !Array.isArray(finalCoords) || finalCoords.length !== 2) {
      if (finalAddress || finalPincode) {
        const geo = await geocodeAddress(finalAddress, finalPincode);
        finalCoords = geo.coordinates;
        if (!finalPincode && geo.pincode) finalPincode = geo.pincode;
      }
    }

    // Create user
    const userData = {
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'customer',
      phone: phone || '',
      address: finalAddress,
      pincode: finalPincode,
    };

    if (finalCoords && Array.isArray(finalCoords) && finalCoords.length === 2) {
      userData.location = {
        type: 'Point',
        coordinates: [parseFloat(finalCoords[0]), parseFloat(finalCoords[1])],
      };
    }

    const user = await User.create(userData);

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        pincode: user.pincode,
        location: user.location,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // If user is a provider, find associated provider profile
    let providerProfile = null;
    if (user.role === 'provider') {
      providerProfile = await Provider.findOne({ userId: user._id });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      provider: providerProfile,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Get current logged in user & profile
// @route   GET /api/auth/me
// @access  Private (Protected)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let providerProfile = null;
    if (user.role === 'provider') {
      providerProfile = await Provider.findOne({ userId: user._id });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address || '',
        pincode: user.pincode || '',
        location: user.location || { type: 'Point', coordinates: [77.5946, 12.9716] },
        createdAt: user.createdAt,
      },
      provider: providerProfile,
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching user profile',
    });
  }
};

// @desc    Update customer location, address, and PIN code with geocoding
// @route   PUT /api/auth/location
// @access  Private
exports.updateLocation = async (req, res) => {
  try {
    const { address, pincode, coordinates } = req.body;
    let finalCoords = coordinates;

    if (!finalCoords || !Array.isArray(finalCoords) || finalCoords.length !== 2) {
      const geo = await geocodeAddress(address, pincode);
      finalCoords = geo.coordinates;
    }

    const updateData = {};
    if (address !== undefined) updateData.address = address;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (finalCoords) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(finalCoords[0]), parseFloat(finalCoords[1])],
      };
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    }).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update location error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating location',
    });
  }
};

// @desc    Geocode an address & PIN code
// @route   POST /api/auth/geocode
// @access  Public
exports.geocodeAddressHandler = async (req, res) => {
  try {
    const { address, pincode } = req.body;
    const geo = await geocodeAddress(address, pincode);
    return res.status(200).json({
      success: true,
      data: geo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error geocoding address',
    });
  }
};
