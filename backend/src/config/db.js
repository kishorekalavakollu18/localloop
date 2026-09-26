const mongoose = require('mongoose');

const ATLAS_URI = 'mongodb+srv://kishorekalavakollu18_db_user:N8u9jUuMixdLfU89@cluster0.1clxe3y.mongodb.net/localloop?retryWrites=true&w=majority';

const connectDB = async () => {
  const primaryURI = process.env.MONGODB_URI || ATLAS_URI;

  try {
    const conn = await mongoose.connect(primaryURI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected (${primaryURI.includes('mongodb+srv') ? 'Atlas Cloud' : 'Local'}): ${conn.connection.host}`);
  } catch (primaryError) {
    console.warn(`⚠️ Primary MongoDB Connection Error: ${primaryError.message}`);
    
    if (primaryURI !== ATLAS_URI) {
      console.log(`🔄 Attempting fallback connection to MongoDB Atlas Cloud...`);
      try {
        const fallbackConn = await mongoose.connect(ATLAS_URI, {
          autoIndex: true,
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`✅ Atlas MongoDB Connected Fallback: ${fallbackConn.connection.host}`);
        return;
      } catch (fallbackError) {
        console.error(`❌ Fallback MongoDB Connection Error: ${fallbackError.message}`);
      }
    }
  }

  // Handle runtime disconnects gracefully without crashing
  mongoose.connection.on('error', (err) => {
    console.error(`⚠️ MongoDB Runtime Warning: ${err.message}`);
  });
};

module.exports = connectDB;
