const mongoose = require('mongoose');

let cachedUri = '';
let connectionPromise = null;

async function connectDB(uri) {
  const target = String(uri || '').trim();
  if (!target) throw new Error('MONGODB_URI is missing.');

  // Reuse the existing connection in Vercel/serverless executions.
  if (mongoose.connection.readyState === 1 && cachedUri === target) {
    return mongoose.connection;
  }

  if (connectionPromise && cachedUri === target) {
    return connectionPromise;
  }

  cachedUri = target;
  connectionPromise = mongoose.connect(target, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 20000,
    maxPoolSize: 10,
    minPoolSize: 0
  }).then(() => {
    console.log('MongoDB connected');
    return mongoose.connection;
  }).catch((error) => {
    connectionPromise = null;
    cachedUri = '';
    console.error('MongoDB connection failed:', error.message);
    throw error;
  });

  return connectionPromise;
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = connectDB;
module.exports.isConnected = isConnected;
