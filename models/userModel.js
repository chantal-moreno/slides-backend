const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  presentations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Presentation',
    },
  ],
});

module.exports = mongoose.model('User', UserSchema);
