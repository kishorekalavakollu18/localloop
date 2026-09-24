const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Please write a review comment'],
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to recalculate average rating for a provider
reviewSchema.statics.getAverageRating = async function (providerId) {
  const stats = await this.aggregate([
    {
      $match: { providerId: new mongoose.Types.ObjectId(providerId) },
    },
    {
      $group: {
        _id: '$providerId',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  try {
    const Provider = mongoose.model('Provider');
    if (stats.length > 0) {
      await Provider.findByIdAndUpdate(providerId, {
        rating: {
          avg: Math.round(stats[0].avgRating * 10) / 10,
          count: stats[0].count,
        },
      });
    } else {
      await Provider.findByIdAndUpdate(providerId, {
        rating: {
          avg: 0,
          count: 0,
        },
      });
    }
  } catch (err) {
    console.error('Error updating provider rating:', err);
  }
};

// Recalculate average after review is saved
reviewSchema.post('save', async function () {
  await this.constructor.getAverageRating(this.providerId);
});

// Recalculate average after review is removed
reviewSchema.post('remove', async function () {
  await this.constructor.getAverageRating(this.providerId);
});

module.exports = mongoose.model('Review', reviewSchema);
