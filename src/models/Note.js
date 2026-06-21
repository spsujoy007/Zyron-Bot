const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  content: { type: String, required: true },
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Note', noteSchema);
