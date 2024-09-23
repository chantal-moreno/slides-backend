// models/Presentation.js
const mongoose = require('mongoose');

const SlideSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
});

const PresentationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: String,
      required: true,
    },
    permissions: [
      {
        nickname: {
          type: String,
          required: true,
        },
        canEdit: {
          type: Boolean,
          default: false,
        },
      },
    ],
    slides: [SlideSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Presentation', PresentationSchema);
