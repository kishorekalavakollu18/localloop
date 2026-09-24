const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

const sampleUsers = [
  {
    name: 'Rahul Sharma (Customer)',
    email: 'rahul@example.com',
    password: 'password123',
    role: 'customer',
    phone: '+91 98765 43210',
  },
  {
    name: 'Priya Patel (Customer)',
    email: 'priya@example.com',
    password: 'password123',
    role: 'customer',
    phone: '+91 98765 43211',
  },
  {
    name: 'Ramesh Plumber',
    email: 'ramesh.plumbing@example.com',
    password: 'password123',
    role: 'provider',
    phone: '+91 98765 11111',
  },
  {
    name: 'Anil Spark Electricians',
    email: 'anil.spark@example.com',
    password: 'password123',
    role: 'provider',
    phone: '+91 98765 22222',
  },
  {
    name: 'Neha Math & Science Tutors',
    email: 'neha.tutor@example.com',
    password: 'password123',
    role: 'provider',
    phone: '+91 98765 33333',
  },
  {
    name: 'Annapurna Home Tiffin',
    email: 'annapurna.tiffin@example.com',
    password: 'password123',
    role: 'provider',
    phone: '+91 98765 44444',
  },
  {
    name: 'SparklePro Deep Cleaners',
    email: 'sparkle.cleaners@example.com',
    password: 'password123',
    role: 'provider',
    phone: '+91 98765 55555',
  },
  {
    name: 'QuickFix AC & Appliance Repair',
    email: 'quickfix.repair@example.com',
    password: 'password123',
    role: 'provider',
    phone: '+91 98765 66666',
  },
];

const sampleProvidersData = [
  {
    userEmail: 'ramesh.plumbing@example.com',
    businessName: 'Ramesh HydroTech & Plumbing Works',
    category: 'plumber',
    description: 'Expert residential and commercial plumbing solutions. 12+ years experience in leak detection, pipeline installation, bathroom fittings, and emergency blockages.',
    // Indiranagar, Bangalore [lng, lat]
    location: { type: 'Point', coordinates: [77.6408, 12.9784] },
    address: '100ft Road, Indiranagar, Bengaluru, Karnataka 560038',
    pricing: { type: 'per hour', amount: 350 },
    availability: [
      { day: 'Monday', slots: ['09:00 - 12:00', '14:00 - 17:00', '17:00 - 20:00'] },
      { day: 'Tuesday', slots: ['09:00 - 12:00', '14:00 - 17:00', '17:00 - 20:00'] },
      { day: 'Wednesday', slots: ['09:00 - 12:00', '14:00 - 17:00', '17:00 - 20:00'] },
      { day: 'Thursday', slots: ['09:00 - 12:00', '14:00 - 17:00'] },
      { day: 'Friday', slots: ['09:00 - 12:00', '14:00 - 17:00', '17:00 - 20:00'] },
      { day: 'Saturday', slots: ['10:00 - 15:00'] },
    ],
    rating: { avg: 4.8, count: 24 },
    images: [
      'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    ],
    isVerified: true,
  },
  {
    userEmail: 'anil.spark@example.com',
    businessName: 'Anil Spark Electricals & Wiring',
    category: 'electrician',
    description: 'Licensed certified master electrician. Short circuits, MCB replacement, chandelier hanging, appliance installation, and full house rewiring services.',
    // Koramangala [lng, lat]
    location: { type: 'Point', coordinates: [77.6245, 12.9352] },
    address: '5th Block, Koramangala, Bengaluru, Karnataka 560095',
    pricing: { type: 'per service', amount: 499 },
    availability: [
      { day: 'Monday', slots: ['08:00 - 11:00', '13:00 - 16:00', '18:00 - 21:00'] },
      { day: 'Tuesday', slots: ['08:00 - 11:00', '13:00 - 16:00'] },
      { day: 'Wednesday', slots: ['08:00 - 11:00', '13:00 - 16:00', '18:00 - 21:00'] },
      { day: 'Thursday', slots: ['08:00 - 11:00', '13:00 - 16:00'] },
      { day: 'Friday', slots: ['08:00 - 11:00', '13:00 - 16:00', '18:00 - 21:00'] },
      { day: 'Saturday', slots: ['09:00 - 14:00'] },
      { day: 'Sunday', slots: ['10:00 - 13:00'] },
    ],
    rating: { avg: 4.9, count: 38 },
    images: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600&auto=format&fit=crop&q=80',
    ],
    isVerified: true,
  },
  {
    userEmail: 'neha.tutor@example.com',
    businessName: 'Neha Personalized Tutoring (Grades 6-12)',
    category: 'tutor',
    description: 'M.Sc in Mathematics with 8 years of private tutoring. Specialized in CBSE, ICSE & IGCSE curricula. Concept-first approach with customized practice worksheets.',
    // HSR Layout [lng, lat]
    location: { type: 'Point', coordinates: [77.6387, 12.9121] },
    address: 'Sector 3, HSR Layout, Bengaluru, Karnataka 560102',
    pricing: { type: 'per hour', amount: 600 },
    availability: [
      { day: 'Monday', slots: ['16:00 - 18:00', '18:30 - 20:30'] },
      { day: 'Tuesday', slots: ['16:00 - 18:00', '18:30 - 20:30'] },
      { day: 'Wednesday', slots: ['16:00 - 18:00', '18:30 - 20:30'] },
      { day: 'Thursday', slots: ['16:00 - 18:00', '18:30 - 20:30'] },
      { day: 'Saturday', slots: ['10:00 - 12:00', '14:00 - 16:00'] },
      { day: 'Sunday', slots: ['10:00 - 12:00'] },
    ],
    rating: { avg: 5.0, count: 19 },
    images: [
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80',
    ],
    isVerified: true,
  },
  {
    userEmail: 'annapurna.tiffin@example.com',
    businessName: 'Annapurna Ghar Ka Khana Tiffin Service',
    category: 'tiffin',
    description: 'Fresh, nutritious, home-cooked North & South Indian meals delivered hot to your doorstep. Low oil, zero preservatives, changed menu every single day.',
    // BTM Layout [lng, lat]
    location: { type: 'Point', coordinates: [77.6101, 12.9165] },
    address: '2nd Stage, BTM Layout, Bengaluru, Karnataka 560076',
    pricing: { type: 'per service', amount: 120 },
    availability: [
      { day: 'Monday', slots: ['12:00 - 14:00', '19:30 - 21:30'] },
      { day: 'Tuesday', slots: ['12:00 - 14:00', '19:30 - 21:30'] },
      { day: 'Wednesday', slots: ['12:00 - 14:00', '19:30 - 21:30'] },
      { day: 'Thursday', slots: ['12:00 - 14:00', '19:30 - 21:30'] },
      { day: 'Friday', slots: ['12:00 - 14:00', '19:30 - 21:30'] },
      { day: 'Saturday', slots: ['12:00 - 14:00', '19:30 - 21:30'] },
    ],
    rating: { avg: 4.7, count: 42 },
    images: [
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80',
    ],
    isVerified: true,
  },
  {
    userEmail: 'sparkle.cleaners@example.com',
    businessName: 'SparklePro Deep Cleaners & Sanitization',
    category: 'cleaner',
    description: 'Comprehensive home & office deep cleaning. Sofa shampooing, kitchen chimney degreasing, bathroom descaling, and eco-friendly floor scrubbing.',
    // MG Road / Central Bangalore [lng, lat]
    location: { type: 'Point', coordinates: [77.6033, 12.9752] },
    address: 'MG Road, Ashok Nagar, Bengaluru, Karnataka 560001',
    pricing: { type: 'per service', amount: 1499 },
    availability: [
      { day: 'Monday', slots: ['08:30 - 13:00', '14:00 - 18:30'] },
      { day: 'Tuesday', slots: ['08:30 - 13:00', '14:00 - 18:30'] },
      { day: 'Wednesday', slots: ['08:30 - 13:00', '14:00 - 18:30'] },
      { day: 'Thursday', slots: ['08:30 - 13:00', '14:00 - 18:30'] },
      { day: 'Friday', slots: ['08:30 - 13:00', '14:00 - 18:30'] },
      { day: 'Saturday', slots: ['08:30 - 13:00', '14:00 - 18:30'] },
      { day: 'Sunday', slots: ['09:00 - 14:00'] },
    ],
    rating: { avg: 4.6, count: 16 },
    images: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600&auto=format&fit=crop&q=80',
    ],
    isVerified: true,
  },
  {
    userEmail: 'quickfix.repair@example.com',
    businessName: 'QuickFix AC & Refrigerator Specialists',
    category: 'other',
    description: 'Same-day AC gas charging, jet pump servicing, refrigerator cooling diagnostics, and washing machine drum repairs by trained technicians.',
    // Whitefield [lng, lat]
    location: { type: 'Point', coordinates: [77.7499, 12.9698] },
    address: 'ITPL Main Road, Whitefield, Bengaluru, Karnataka 560066',
    pricing: { type: 'per service', amount: 599 },
    availability: [
      { day: 'Monday', slots: ['09:00 - 12:00', '13:00 - 17:00'] },
      { day: 'Tuesday', slots: ['09:00 - 12:00', '13:00 - 17:00'] },
      { day: 'Wednesday', slots: ['09:00 - 12:00', '13:00 - 17:00'] },
      { day: 'Thursday', slots: ['09:00 - 12:00', '13:00 - 17:00'] },
      { day: 'Friday', slots: ['09:00 - 12:00', '13:00 - 17:00'] },
      { day: 'Saturday', slots: ['10:00 - 16:00'] },
    ],
    rating: { avg: 4.5, count: 12 },
    images: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop&q=80',
    ],
    isVerified: true,
  },
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/localloop';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Provider.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    console.log('🧹 Cleared existing database records');

    // Create Users
    const userMap = {};
    for (const u of sampleUsers) {
      const user = await User.create(u);
      userMap[u.email] = user;
    }
    console.log(`👤 Created ${sampleUsers.length} test users`);

    // Create Providers
    const createdProviders = [];
    for (const p of sampleProvidersData) {
      const user = userMap[p.userEmail];
      if (user) {
        const provider = await Provider.create({
          userId: user._id,
          businessName: p.businessName,
          category: p.category,
          description: p.description,
          location: p.location,
          address: p.address,
          pricing: p.pricing,
          availability: p.availability,
          rating: p.rating,
          images: p.images,
          isVerified: p.isVerified,
        });
        createdProviders.push(provider);
      }
    }
    console.log(`🛠️ Created ${createdProviders.length} service providers with 2dsphere points`);

    // Ensure 2dsphere index is built
    await Provider.collection.createIndex({ location: '2dsphere' });
    console.log('📍 2dsphere index ensured on Provider.location');

    // Create sample bookings
    const customerRahul = userMap['rahul@example.com'];
    const customerPriya = userMap['priya@example.com'];

    if (customerRahul && createdProviders[0]) {
      const b1 = await Booking.create({
        customerId: customerRahul._id,
        providerId: createdProviders[0]._id,
        serviceDate: new Date(Date.now() + 86400000), // tomorrow
        slot: '09:00 - 12:00',
        status: 'confirmed',
        notes: 'Bathroom pipe is leaking underneath the wash basin.',
      });

      // Sample review for completed booking
      const b2 = await Booking.create({
        customerId: customerRahul._id,
        providerId: createdProviders[1]._id,
        serviceDate: new Date(Date.now() - 3 * 86400000),
        slot: '13:00 - 16:00',
        status: 'completed',
        notes: 'Main board tripping frequently.',
      });

      await Review.create({
        bookingId: b2._id,
        customerId: customerRahul._id,
        providerId: createdProviders[1]._id,
        rating: 5,
        comment: 'Anil arrived within 30 minutes! Diagnosed the short circuit very quickly and replaced the faulty breaker. Excellent work.',
      });
    }

    if (customerPriya && createdProviders[2]) {
      const b3 = await Booking.create({
        customerId: customerPriya._id,
        providerId: createdProviders[2]._id,
        serviceDate: new Date(Date.now() - 7 * 86400000),
        slot: '16:00 - 18:00',
        status: 'completed',
        notes: '10th grade calculus & geometry tutoring',
      });

      await Review.create({
        bookingId: b3._id,
        customerId: customerPriya._id,
        providerId: createdProviders[2]._id,
        rating: 5,
        comment: 'Neha is such a patient teacher. My daughter’s confidence in mathematics improved dramatically in just 2 sessions!',
      });
    }

    console.log('📅 Sample bookings and reviews created');
    console.log('✨ Seed complete! You can login with:');
    console.log('   Customer: rahul@example.com / password123');
    console.log('   Provider: ramesh.plumbing@example.com / password123');
    console.log('   Provider: anil.spark@example.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedDB();
