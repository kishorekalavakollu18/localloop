const User = require('../models/User');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// @desc    Get platform-wide analytics and statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProviders = await Provider.countDocuments();
    const pendingVerifications = await Provider.countDocuments({ verificationStatus: 'pending' });
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const totalReviews = await Review.countDocuments();

    // Calculate revenue estimation from completed bookings
    const completedList = await Booking.find({ status: 'completed' }).populate('providerId', 'pricing');
    const totalEstimatedRevenue = completedList.reduce((acc, b) => acc + (b.providerId?.pricing?.amount || 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProviders,
        pendingVerifications,
        totalBookings,
        completedBookings,
        totalReviews,
        totalEstimatedRevenue,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching platform statistics',
    });
  }
};

// @desc    Get pending provider verification requests
// @route   GET /api/admin/providers/pending
// @access  Private (Admin only)
exports.getPendingVerifications = async (req, res) => {
  try {
    const pendingProviders = await Provider.find({
      $or: [{ verificationStatus: 'pending' }, { isVerified: false }],
    }).populate('userId', 'name email phone createdAt');

    return res.status(200).json({
      success: true,
      count: pendingProviders.length,
      providers: pendingProviders,
    });
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching verification requests',
    });
  }
};

// @desc    Approve or reject provider verification
// @route   PUT /api/admin/providers/:id/verify
// @access  Private (Admin only)
exports.updateVerificationStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected',
      });
    }

    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found',
      });
    }

    provider.verificationStatus = status;
    provider.isVerified = status === 'approved';
    await provider.save();

    return res.status(200).json({
      success: true,
      message: `Provider verification status updated to ${status}`,
      provider,
    });
  } catch (error) {
    console.error('Error updating provider verification:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating verification',
    });
  }
};

// @desc    Ban or unban user account
// @route   PUT /api/admin/users/:id/ban
// @access  Private (Admin only)
exports.toggleUserBan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.name} has been ${user.isBanned ? 'banned' : 'unbanned'}`,
      isBanned: user.isBanned,
    });
  } catch (error) {
    console.error('Error toggling user ban:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error toggling ban status',
    });
  }
};

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching users list',
    });
  }
};
