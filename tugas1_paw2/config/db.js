
const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Atlas berhasil terhubung!");
  } catch (error) {
    console.error("Koneksi MongoDB gagal:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
