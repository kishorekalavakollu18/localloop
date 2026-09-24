const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/localloop';
  const fallbackURI = 'mongodb://localhost:27017/localloop';

  try {
    const conn = await mongoose.connect(primaryURI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if Atlas IP whitelist/firewall blocks
    });
    console.log(`✅ MongoDB Connected (${primaryURI.includes('mongodb+srv') ? 'Atlas Cloud' : 'Local'}): ${conn.connection.host}`);
  } catch (primaryError) {
    console.warn(`⚠️ Primary MongoDB Connection Error: ${primaryError.message}`);
    
    // Fallback to local MongoDB if primary fails
    if (primaryURI !== fallbackURI) {
      console.log(`🔄 Attempting fallback connection to local MongoDB: ${fallbackURI}...`);
      try {
        const fallbackConn = await mongoose.connect(fallbackURI, {
          autoIndex: true,
        });
        console.log(`✅ Local MongoDB Connected Fallback: ${fallbackConn.connection.host}`);
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
