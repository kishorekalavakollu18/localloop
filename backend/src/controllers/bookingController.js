const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const User = require('../models/User');
const { geocodeAddress, getDrivingRoute } = require('../utils/geocoder');

// @desc    Create a new service booking with customer location, geocoding & slot conflict check
// @route   POST /api/bookings
// @access  Private (Customer/User)
exports.createBooking = async (req, res) => {
  try {
    const {
      providerId,
      serviceDate,
      slot,
      notes,
      customerAddress,
      customerPincode,
      customerCoordinates,
    } = req.body;

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

    // Double-Booking Slot Conflict Check
    const targetDate = new Date(serviceDate);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const existingConflict = await Booking.findOne({
      providerId,
      slot,
      serviceDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed', 'in_progress'] },
    });

    if (existingConflict) {
      return res.status(409).json({
        success: false,
        message: 'This time slot has already been booked by another customer. Please select a different slot or date.',
      });
    }

    // Resolve Customer Location (GPS Coordinates + Address + PIN code)
    let resolvedCoords = [77.5946, 12.9716]; // Default fallback Bengaluru center
    let finalAddress = customerAddress || req.user.address || '';
    let finalPincode = customerPincode || req.user.pincode || '';

    if (
      Array.isArray(customerCoordinates) &&
      customerCoordinates.length === 2 &&
      !isNaN(customerCoordinates[0]) &&
      !isNaN(customerCoordinates[1])
    ) {
      resolvedCoords = [parseFloat(customerCoordinates[0]), parseFloat(customerCoordinates[1])];
    } else if (finalAddress || finalPincode) {
      const geo = await geocodeAddress(finalAddress, finalPincode);
      resolvedCoords = geo.coordinates;
      if (!finalAddress) finalAddress = geo.formattedAddress;
      if (!finalPincode) finalPincode = geo.pincode;
    } else if (req.user.location?.coordinates?.length === 2) {
      resolvedCoords = req.user.location.coordinates;
    }

    // Update user's profile with address/location if not present
    if ((!req.user.address && finalAddress) || (!req.user.pincode && finalPincode)) {
      await User.findByIdAndUpdate(req.user._id, {
        address: finalAddress,
        pincode: finalPincode,
        location: { type: 'Point', coordinates: resolvedCoords },
      });
    }

    // Calculate initial driving distance and ETA from provider to customer
    let initialDistanceKm = 0;
    let initialEtaMinutes = 15;
    let initialPolyline = [];

    const providerCoords = provider.currentLocation?.coordinates || provider.location?.coordinates;
    if (providerCoords && providerCoords.length === 2) {
      const routeInfo = await getDrivingRoute(providerCoords, resolvedCoords);
      if (routeInfo) {
        initialDistanceKm = routeInfo.distanceKm;
        initialEtaMinutes = routeInfo.etaMinutes;
        initialPolyline = routeInfo.polyline;
      }
    }

    const booking = await Booking.create({
      customerId: req.user._id,
      providerId,
      serviceDate: new Date(serviceDate),
      slot,
      notes: notes || '',
      status: 'pending',
      customerAddress: finalAddress,
      customerPincode: finalPincode,
      customerLocation: {
        type: 'Point',
        coordinates: resolvedCoords,
      },
      liveTracking: {
        isTrackingActive: false,
        currentProviderLocation: {
          type: 'Point',
          coordinates: providerCoords || resolvedCoords,
        },
        heading: 0,
        speed: 0,
        distanceRemainingKm: initialDistanceKm,
        etaMinutes: initialEtaMinutes,
        routePolyline: initialPolyline,
      },
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('providerId', 'businessName category address pincode pricing images rating phone isOnline location userId')
      .populate('customerId', 'name email phone address pincode location');

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
      .populate('providerId', 'businessName category address pricing images userId')
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
      if (status !== 'cancelled' && status !== 'completed') {
        return res.status(403).json({
          success: false,
          message: 'Customers can only cancel or mark completion on a booking',
        });
      }
    }

    booking.status = status;
    if (status === 'completed' || status === 'cancelled') {
      if (booking.liveTracking) {
        booking.liveTracking.isTrackingActive = false;
      }
    }
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('providerId', 'businessName category address pincode pricing images rating phone isOnline location userId')
      .populate('customerId', 'name email phone address pincode location');

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

      // Broadcast to tracking room if service is finished
      if (status === 'completed' || status === 'cancelled') {
        io.to(`tracking_${booking._id}`).emit('tracking_stopped', {
          bookingId: booking._id,
          status,
          message: `Service has been marked ${status}. Live GPS tracking stopped.`,
        });
      }

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

// @desc    Get booking details by ID
// @route   GET /api/bookings/:id
// @access  Private (Customer, Provider, or Admin)
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('providerId', 'businessName category address pincode pricing images rating phone isOnline location userId')
      .populate('customerId', 'name email phone address pincode location');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isProvider = booking.providerId?.userId?.toString() === req.user._id.toString();
    const isCustomer = booking.customerId?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isProvider && !isCustomer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start live GPS tracking session for a booking
// @route   POST /api/bookings/:id/start-tracking
// @access  Private (Assigned Provider only)
exports.startTracking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('providerId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isProvider = booking.providerId?.userId?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isProvider && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the assigned provider can start GPS tracking' });
    }

    const { coordinates } = req.body;
    let providerCoords = coordinates;

    if (!providerCoords || !Array.isArray(providerCoords) || providerCoords.length !== 2) {
      providerCoords = booking.providerId.currentLocation?.coordinates || booking.providerId.location?.coordinates || [77.5946, 12.9716];
    } else {
      providerCoords = [parseFloat(providerCoords[0]), parseFloat(providerCoords[1])];
    }

    // Set tracking active and status to in_progress
    booking.liveTracking.isTrackingActive = true;
    booking.liveTracking.lastUpdated = new Date();
    booking.liveTracking.currentProviderLocation = {
      type: 'Point',
      coordinates: providerCoords,
    };
    if (booking.status === 'confirmed' || booking.status === 'pending') {
      booking.status = 'in_progress';
    }

    // Calculate initial route if customer coordinates exist
    if (booking.customerLocation?.coordinates?.length === 2) {
      const routeInfo = await getDrivingRoute(providerCoords, booking.customerLocation.coordinates);
      if (routeInfo) {
        booking.liveTracking.distanceRemainingKm = routeInfo.distanceKm;
        booking.liveTracking.etaMinutes = routeInfo.etaMinutes;
        booking.liveTracking.routePolyline = routeInfo.polyline;
      }
    }

    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('providerId', 'businessName category address pincode pricing images rating phone isOnline location userId')
      .populate('customerId', 'name email phone address pincode location');

    // Socket.io broadcast to tracking room
    const io = req.app.get('io');
    if (io) {
      io.to(`tracking_${booking._id}`).emit('tracking_started', {
        bookingId: booking._id,
        liveTracking: populated.liveTracking,
        status: populated.status,
      });
      io.emit(`booking_status_${booking._id}`, {
        status: populated.status,
        booking: populated,
      });
      if (populated.customerId?._id) {
        io.emit(`customer_notifications_${populated.customerId._id.toString()}`, {
          type: 'provider_on_the_way',
          message: `🚗 ${populated.providerId.businessName} has started live GPS navigation and is heading to your location!`,
          booking: populated,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Live GPS tracking started',
      booking: populated,
    });
  } catch (error) {
    console.error('Error starting live tracking:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update live GPS coordinates for an active booking
// @route   PUT /api/bookings/:id/live-location
// @access  Private (Assigned Provider only)
exports.updateLiveLocation = async (req, res) => {
  try {
    const { coordinates, heading, speed } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates [lng, lat]' });
    }

    const booking = await Booking.findById(req.params.id).populate('providerId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isProvider = booking.providerId?.userId?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isProvider && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the assigned provider can update live GPS location' });
    }

    const lng = parseFloat(coordinates[0]);
    const lat = parseFloat(coordinates[1]);
    const newCoords = [lng, lat];

    booking.liveTracking.isTrackingActive = true;
    booking.liveTracking.currentProviderLocation = {
      type: 'Point',
      coordinates: newCoords,
    };
    booking.liveTracking.heading = Number(heading) || 0;
    booking.liveTracking.speed = Number(speed) || 0;
    booking.liveTracking.lastUpdated = new Date();

    // Dynamically update road route, distance remaining and ETA
    if (booking.customerLocation?.coordinates?.length === 2) {
      const routeInfo = await getDrivingRoute(newCoords, booking.customerLocation.coordinates);
      if (routeInfo) {
        booking.liveTracking.distanceRemainingKm = routeInfo.distanceKm;
        booking.liveTracking.etaMinutes = routeInfo.etaMinutes;
        booking.liveTracking.routePolyline = routeInfo.polyline;
      }
    }

    await booking.save();

    // Broadcast live location to connected room without customer needing to refresh
    const io = req.app.get('io');
    if (io) {
      io.to(`tracking_${booking._id}`).emit('provider_location_changed', {
        bookingId: booking._id,
        coordinates: newCoords,
        heading: booking.liveTracking.heading,
        speed: booking.liveTracking.speed,
        distanceRemainingKm: booking.liveTracking.distanceRemainingKm,
        etaMinutes: booking.liveTracking.etaMinutes,
        routePolyline: booking.liveTracking.routePolyline,
        lastUpdated: booking.liveTracking.lastUpdated,
      });
    }

    return res.status(200).json({
      success: true,
      liveTracking: booking.liveTracking,
    });
  } catch (error) {
    console.error('Error updating live location:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Stop live GPS tracking session for a booking
// @route   POST /api/bookings/:id/stop-tracking
// @access  Private (Assigned Provider only)
exports.stopTracking = async (req, res) => {
  try {
    const { markCompleted } = req.body;
    const booking = await Booking.findById(req.params.id).populate('providerId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isProvider = booking.providerId?.userId?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isProvider && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the assigned provider can stop GPS tracking' });
    }

    booking.liveTracking.isTrackingActive = false;
    if (markCompleted) {
      booking.status = 'completed';
    }
    await booking.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`tracking_${booking._id}`).emit('tracking_stopped', {
        bookingId: booking._id,
        status: booking.status,
        message: markCompleted ? 'Service completed! GPS tracking ended.' : 'Provider stopped navigation tracking.',
      });
      io.emit(`booking_status_${booking._id}`, {
        status: booking.status,
        booking,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'GPS tracking stopped successfully',
      status: booking.status,
    });
  } catch (error) {
    console.error('Error stopping tracking:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get OSRM driving route between provider and customer
// @route   GET /api/bookings/:id/route
// @access  Private (Customer, Provider, or Admin)
exports.getBookingRoute = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('providerId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    let providerCoords =
      booking.liveTracking?.currentProviderLocation?.coordinates?.length === 2
        ? booking.liveTracking.currentProviderLocation.coordinates
        : booking.providerId?.currentLocation?.coordinates || booking.providerId?.location?.coordinates;

    let customerCoords =
      booking.customerLocation?.coordinates?.length === 2
        ? booking.customerLocation.coordinates
        : [77.5946, 12.9716];

    if (!providerCoords || providerCoords.length !== 2) {
      providerCoords = [77.6408, 12.9784];
    }

    const routeInfo = await getDrivingRoute(providerCoords, customerCoords);

    if (routeInfo) {
      booking.liveTracking.distanceRemainingKm = routeInfo.distanceKm;
      booking.liveTracking.etaMinutes = routeInfo.etaMinutes;
      booking.liveTracking.routePolyline = routeInfo.polyline;
      await booking.save();
    }

    return res.status(200).json({
      success: true,
      route: routeInfo,
      providerCoordinates: routeInfo?.originCoordinates || providerCoords,
      customerCoordinates: customerCoords,
    });
  } catch (error) {
    console.error('Error calculating booking route:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
