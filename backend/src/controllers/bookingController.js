const Booking = require('../models/Booking');
const Provider = require('../models/Provider');

// @desc    Create a new service booking with slot conflict check
// @route   POST /api/bookings
// @access  Private (Customer/User)
exports.createBooking = async (req, res) => {
  try {
    const { providerId, serviceDate, slot, notes } = req.body;

    if (!providerId || !serviceDate || !slot) {
      return res.status(400).json({
        success: false,
        message: 'Please provide providerId, serviceDate, and time slot',
      });
    }

    // Verify provider exists
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
      });
    }

    // Prevent provider from booking themselves
    if (provider.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own service',
      });
    }

    // Phase 3 & 5: Double-Booking Slot Conflict Check
    const targetDate = new Date(serviceDate);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const existingConflict = await Booking.findOne({
      providerId,
      slot,
      serviceDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] },
    });

    if (existingConflict) {
      return res.status(409).json({
        success: false,
        message: 'This time slot has already been booked by another customer. Please select a different slot or date.',
      });
    }

    const booking = await Booking.create({
      customerId: req.user._id,
      providerId,
      serviceDate: new Date(serviceDate),
      slot,
      notes: notes || '',
      status: 'pending',
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('providerId', 'businessName category address pricing images userId')
      .populate('customerId', 'name email phone');

    // Real-time Socket.io notification emit to provider & customer
    const io = req.app.get('io');
    if (io) {
      const providerUserId = provider.userId.toString();
      io.emit(`provider_booking_${provider.userId}`, {
        type: 'new_booking',
        booking: populatedBooking,
      });
      io.emit(`provider_notifications_${providerUserId}`, {
        type: 'new_booking_request',
        status: 'pending',
        message: `📌 New booking request received from ${req.user.name} for ${slot}`,
        booking: populatedBooking,
      });
      io.emit(`customer_notifications_${req.user._id}`, {
        type: 'booking_sent',
        status: 'pending',
        message: `🚀 Booking request sent to ${provider.businessName}`,
        booking: populatedBooking,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Booking request sent successfully!',
      booking: populatedBooking,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating booking',
    });
  }
};

// @desc    Get all bookings for a customer
// @route   GET /api/bookings/customer/:customerId
// @access  Private
exports.getBookingsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (
      req.user._id.toString() !== customerId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view bookings of other customers',
      });
    }

    const bookings = await Booking.find({ customerId })
      .populate({
        path: 'providerId',
        select: 'businessName category address pricing images rating phone location userId',
        populate: {
          path: 'userId',
          select: 'name phone email',
        },
      })
      .sort({ serviceDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching bookings',
    });
  }
};

// @desc    Get all bookings for a provider
// @route   GET /api/bookings/provider/:providerId
// @access  Private (Provider owner only)
exports.getBookingsByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
      });
    }

    if (
      provider.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view bookings for this provider',
      });
    }

    const bookings = await Booking.find({ providerId })
      .populate('customerId', 'name email phone')
      .sort({ serviceDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching provider bookings',
    });
  }
};

// @desc    Update booking status (confirm, cancel, complete) with Socket.io notification
// @route   PUT /api/bookings/:id/status
// @access  Private
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const booking = await Booking.findById(req.params.id).populate('providerId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const isProvider = booking.providerId.userId.toString() === req.user._id.toString();
    const isCustomer = booking.customerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isProvider && !isCustomer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this booking',
      });
    }

    if (isCustomer && !isProvider && !isAdmin) {
      if (status !== 'cancelled') {
        return res.status(403).json({
          success: false,
          message: 'Customers can only cancel a booking',
        });
      }
    }

    booking.status = status;
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('providerId', 'businessName category address pricing images userId')
      .populate('customerId', 'name email phone');

    // Real-time notification emit via Socket.io
    const io = req.app.get('io');
    if (io) {
      const customerUserId = booking.customerId._id ? booking.customerId._id.toString() : booking.customerId.toString();
      const providerUserId = booking.providerId?.userId ? booking.providerId.userId.toString() : '';

      const statusMsg = status === 'confirmed'
        ? `🎉 Your booking with ${updatedBooking.providerId?.businessName || 'Provider'} has been CONFIRMED!`
        : status === 'cancelled'
        ? `❌ Your booking with ${updatedBooking.providerId?.businessName || 'Provider'} was CANCELLED / REJECTED.`
        : status === 'completed'
        ? `✨ Your service appointment with ${updatedBooking.providerId?.businessName || 'Provider'} was marked COMPLETED!`
        : `Booking status updated to ${status}`;

      io.emit(`booking_status_${booking._id}`, {
        status,
        booking: updatedBooking,
      });

      if (customerUserId) {
        io.emit(`customer_notifications_${customerUserId}`, {
          type: 'booking_status_change',
          status,
          message: statusMsg,
          booking: updatedBooking,
        });
      }

      if (providerUserId) {
        io.emit(`provider_notifications_${providerUserId}`, {
          type: 'booking_status_change',
          status,
          message: `Booking with ${updatedBooking.customerId?.name || 'Customer'} was updated to ${status}.`,
          booking: updatedBooking,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating booking status',
    });
  }
};
