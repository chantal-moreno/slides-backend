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
    editors: [
      {
        editorId: {
          type: String,
          required: true,
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
