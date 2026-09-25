const Message = require('../models/Message');
const Booking = require('../models/Booking');

// @desc    Get chat message history for a booking
// @route   GET /api/messages/:bookingId
// @access  Private
exports.getBookingMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate('providerId');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify user authorization (customer or provider)
    const isCustomer = booking.customerId.toString() === req.user._id.toString();
    const isProvider = booking.providerId?.userId?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view messages for this booking',
      });
    }

    const messages = await Message.find({ bookingId })
      .populate('senderId', 'name email role')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching messages',
    });
  }
};

// @desc    Send a new chat message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { bookingId, receiverId, message } = req.body;

    if (!bookingId || !receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bookingId, receiverId, and message content',
      });
    }

    const booking = await Booking.findById(bookingId).populate('providerId');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const newMessage = await Message.create({
      bookingId,
      senderId: req.user._id,
      receiverId,
      message: message.trim(),
    });

    const populatedMsg = await Message.findById(newMessage._id).populate(
      'senderId',
      'name email role'
    );

    // Socket.io emit if global io instance is available on app
    const io = req.app.get('io');
    if (io) {
      io.to(bookingId.toString()).emit('new_message', populatedMsg);
    }

    return res.status(201).json({
      success: true,
      message: populatedMsg,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error sending message',
    });
  }
};
