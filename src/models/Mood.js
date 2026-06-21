const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  mood: { type: String, required: true },
  note: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mood', moodSchema);
