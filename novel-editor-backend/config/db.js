// config/db.js
const mongoose = require('mongoose');
require('dotenv').config(); // Ensure dotenv is configured to read .env

const connectDB = async () => {
  try {
    // Use the MONGO_URI from your .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;