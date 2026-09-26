const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
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
    serviceDate: {
      type: Date,
      required: [true, 'Please provide a service date'],
    },
    slot: {
      type: String,
      required: [true, 'Please provide a time slot'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
    },
    customerAddress: {
      type: String,
      default: '',
    },
    customerPincode: {
      type: String,
      default: '',
    },
    customerLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [77.5946, 12.9716],
      },
    },
    liveTracking: {
      isTrackingActive: {
        type: Boolean,
        default: false,
      },
      currentProviderLocation: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
        },
      },
      heading: {
        type: Number,
        default: 0,
      },
      speed: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
      },
      etaMinutes: {
        type: Number,
        default: 0,
      },
      distanceRemainingKm: {
        type: Number,
        default: 0,
      },
      routePolyline: [
        {
          type: [Number], // [latitude, longitude] for Leaflet
        },
      ],
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

module.exports = mongoose.model('Booking', bookingSchema);
