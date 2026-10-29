const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donatur: {
      nama: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
      },
      anonim: {
        type: Boolean,
        default: false,
      },
    },
    nominal: {
      type: Number,
      required: true,
      min: 1,
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Donation", donationSchema);