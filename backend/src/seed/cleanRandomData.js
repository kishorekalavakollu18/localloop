const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Message = require('../models/Message');

const cleanRandomData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in .env');
    }
    await mongoose.connect(mongoUri);
    console.log(' Connected to MongoDB Atlas');

    // 1. Delete all sample/dummy seed users
    const dummyEmails = [
      'rahul@example.com',
      'priya@example.com',
      'ramesh.plumbing@example.com',
      'anil.spark@example.com',
      'neha.tutor@example.com',
      'annapurna.tiffin@example.com',
      'sparkle.cleaners@example.com',
      'quickfix.repair@example.com',
      'vamsi@gmail.com',
      'muninaikjatoth@gmail.com',
      'phani@gmail.com',
      'siva1@gmail.com',
      'mani@gmail.com',
      'yohan@gmail.com',
    ];
    const userDeleteResult = await User.deleteMany({
      email: { $in: dummyEmails },
    });
    console.log(` Deleted ${userDeleteResult.deletedCount} dummy seed users`);

    // 2. Delete all sample/dummy seed providers
    const dummyBusinessNames = [
      'Ramesh HydroTech & Plumbing Works',
      'Anil Spark Electricals & Wiring',
      'Neha Personalized Tutoring (Grades 6-12)',
      'Annapurna Ghar Ka Khana Tiffin Service',
      'SparklePro Deep Cleaners & Sanitization',
      'QuickFix AC & Refrigerator Specialists',
      'coding',
      'muni',
      'Website designer',
    ];
    const providerDeleteResult = await Provider.deleteMany({
      businessName: { $in: dummyBusinessNames },
    });
    console.log(` Deleted ${providerDeleteResult.deletedCount} dummy seed providers`);

    // 3. Delete all old test bookings
    const bookingDeleteResult = await Booking.deleteMany({});
    console.log(` Deleted ${bookingDeleteResult.deletedCount} old test bookings`);

    // 4. Delete all old reviews
    const reviewDeleteResult = await Review.deleteMany({});
    console.log(` Deleted ${reviewDeleteResult.deletedCount} old reviews`);

    // 5. Delete all old chat messages
    const messageDeleteResult = await Message.deleteMany({});
    console.log(` Deleted ${messageDeleteResult.deletedCount} old chat messages`);

    // 6. Inspect remaining accounts
    const remainingUsers = await User.find({}, 'name email role address pincode');
    const remainingProviders = await Provider.find({}, 'businessName category address pincode');

    console.log('\n=== DATABASE PURGED CLEAN ===');
    console.log(`Active Users (${remainingUsers.length}):`);
    remainingUsers.forEach((u) => console.log(`  - ${u.name} (${u.email}) [${u.role}] - Address: "${u.address}" PIN: "${u.pincode}"`));

    console.log(`Active Providers (${remainingProviders.length}):`);
    remainingProviders.forEach((p) => console.log(`  - ${p.businessName} (${p.category}) - Address: "${p.address}" PIN: "${p.pincode}"`));

    process.exit(0);
  } catch (error) {
    console.error(' Error during cleanup:', error);
    process.exit(1);
  }
};

cleanRandomData();
