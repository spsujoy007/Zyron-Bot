const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  message: { type: String, required: true },
  remindAt: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reminder', reminderSchema);
