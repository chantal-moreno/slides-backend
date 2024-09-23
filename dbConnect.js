const mongoose = require('mongoose');
require('dotenv').config();

async function dbConnect() {
  try {
    await mongoose.connect(process.env.DB_URL, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log('Successfully connected to MongoDB Atlas!');
  } catch (error) {
    console.log('Unable to connect to MongoDB Atlas!');
    console.error(error);
  }
}

module.exports = dbConnect;
