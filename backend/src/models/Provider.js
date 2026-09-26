const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, 'Please provide a business name'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: ['plumber', 'electrician', 'tutor', 'tiffin', 'cleaner', 'other'],
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    address: {
      type: String,
      required: [true, 'Please provide a physical address/location description'],
    },
    pricing: {
      type: {
        type: String,
        enum: ['per hour', 'per service', 'per day', 'per month', 'fixed'],
        default: 'per hour',
      },
      amount: {
        type: Number,
        required: [true, 'Please specify pricing amount'],
        min: 0,
      },
    },
    availability: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        slots: [{ type: String }], // e.g. ["09:00 - 11:00", "11:00 - 13:00", "14:00 - 16:00"]
      },
    ],
    rating: {
      avg: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    images: [{ type: String }],
    isVerified: {
      type: Boolean,
      default: true,
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'approved', 'rejected'],
      default: 'approved',
    },
    verificationDoc: {
      type: String,
      default: '',
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

// MongoDB 2dsphere geospatial index for geo-queries
providerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Provider', providerSchema);
