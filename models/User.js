const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  bmi: {
    type: Number,
    default: null,
  },
  bmr: {
    type: Number,
    default: null,
  },
  ramie: {
    type: Number,
    default: null,
  },
  udo: {
    type: Number,
    default: null,
  },
  talia: {
    type: Number,
    default: null,
  },
  klatka: {
    type: Number,
    default: null,
  },
  waga: {
    type: Number,
    default: null,
  },
  list: [String],
  dieta: [String],
  trening: [String],
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
