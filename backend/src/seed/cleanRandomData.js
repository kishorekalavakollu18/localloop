const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

const cleanRandomData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://kishorekalavakollu18_db_user:N8u9jUuMixdLfU89@cluster0.1clxe3y.mongodb.net/localloop?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas');

    // 1. Delete random test providers
    const randomProviderNames = ['coding', 'muni', 'Website designer'];
    const deletedProviders = await Provider.deleteMany({
      businessName: { $in: randomProviderNames },
    });
    console.log(`🗑️ Deleted ${deletedProviders.deletedCount} random test providers:`, randomProviderNames);

    // 2. Delete random test user accounts
    const randomEmails = [
      'vamsi@gmail.com',
      'muninaikjatoth@gmail.com',
      'phani@gmail.com',
      'siva@gmail.com',
      'siva1@gmail.com',
      'mani@gmail.com',
      'yohan@gmail.com',
    ];
    const deletedUsers = await User.deleteMany({
      email: { $in: randomEmails },
    });
    console.log(`🗑️ Deleted ${deletedUsers.deletedCount} random test users:`, randomEmails);

    // 3. Delete orphaned or test bookings
    const validProviderIds = (await Provider.find({}, '_id')).map((p) => p._id);
    const validUserIds = (await User.find({}, '_id')).map((u) => u._id);

    const deletedBookings = await Booking.deleteMany({
      $or: [
        { providerId: { $nin: validProviderIds } },
        { customerId: { $nin: validUserIds } },
      ],
    });
    console.log(`🗑️ Deleted ${deletedBookings.deletedCount} test/orphaned bookings`);

    // 4. Delete orphaned reviews
    const validBookingIds = (await Booking.find({}, '_id')).map((b) => b._id);
    const deletedReviews = await Review.deleteMany({
      bookingId: { $nin: validBookingIds },
    });
    console.log(`🗑️ Deleted ${deletedReviews.deletedCount} orphaned reviews`);

    // 5. Reset Kishore's account role to customer (ready for clean testing)
    await User.updateOne(
      { email: 'kishorekalavakollu18@gmail.com' },
      { role: 'customer' }
    );
    console.log('👤 Kept user kishorekalavakollu18@gmail.com (role: customer, password: password123)');

    // 6. Verify final active dataset
    const remainingProviders = await Provider.find({}, 'businessName category');
    const remainingUsers = await User.find({}, 'name email role');
    const remainingBookings = await Booking.find({});

    console.log('\n=== REMAINING CLEAN DATASET ===');
    console.log(`Providers (${remainingProviders.length}):`, remainingProviders.map((p) => p.businessName));
    console.log(`Users (${remainingUsers.length}):`, remainingUsers.map((u) => `${u.name} (${u.email})`));
    console.log(`Bookings (${remainingBookings.length})`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
};

cleanRandomData();
