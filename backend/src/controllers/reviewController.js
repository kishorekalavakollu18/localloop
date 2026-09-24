const Review = require('../models/Review');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');

// @desc    Create a review for a provider
// @route   POST /api/reviews
// @access  Private (Customer)
exports.createReview = async (req, res) => {
  try {
    const { providerId, rating, comment, bookingId } = req.body;

    if (!providerId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide providerId, rating (1-5), and a comment',
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5',
      });
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
      });
    }

    // Check that customer isn't the provider themselves
    if (provider.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot review your own service',
      });
    }

    // Optional booking verification
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (booking && booking.customerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only review bookings associated with your account',
        });
      }
    }

    const review = await Review.create({
      providerId,
      customerId: req.user._id,
      bookingId: bookingId || null,
      rating: numRating,
      comment: comment.trim(),
    });

    const populatedReview = await Review.findById(review._id).populate(
      'customerId',
      'name email'
    );

    // Fetch updated provider rating
    const updatedProvider = await Provider.findById(providerId).select('rating');

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: populatedReview,
      providerRating: updatedProvider?.rating,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating review',
    });
  }
};

// @desc    Get all reviews for a provider
// @route   GET /api/reviews/provider/:providerId
// @access  Public
exports.getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;

    const reviews = await Review.find({ providerId })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error('Error fetching provider reviews:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching reviews',
    });
  }
};
