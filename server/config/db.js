const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be configured before starting BlogHub.');
  }
  const connection = await mongoose.connect(process.env.MONGO_URI);
  return connection;
};

module.exports = connectDB;
