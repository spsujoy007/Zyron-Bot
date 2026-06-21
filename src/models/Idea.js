const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  content: { type: String, required: true },
  category: { type: String, default: 'general' },
  starred: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Idea', ideaSchema);
