const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
