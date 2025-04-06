// ---> FILE: ./novel-editor-backend/models/Novel.js <---

// models/Novel.js
const mongoose = require('mongoose');

// ---> CHANGE START <---
// Define the sub-schema for a genre object
const genreObjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  isCustom: {
    type: Boolean,
    default: false, // Default to false (predefined) unless specified
    required: true,
  }
}, { _id: false }); // No separate _id for the subdocument needed
// ---> CHANGE END <---


const novelSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Novel title is required.'],
      trim: true,
      default: 'Untitled Novel',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    author: {
      type: String,
      trim: true,
      default: '',
    },
    // ---> CHANGE START <---
    // Use the new sub-schema for the genres array
    genres: {
      type: [genreObjectSchema], // Array of genre objects
      default: [],
    },
    // ---> CHANGE END <---
    description: {
      type: String,
      trim: true,
      default: '',
    },
    defaultFontFamily: {
      type: String,
      trim: true,
      default: 'Open Sans',
    },
    defaultFontSize: {
      type: String,
      trim: true,
      default: '16px',
    },
    chapters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter'
    }],
  },
  {
    timestamps: true,
  }
);

// Optional: Add an index on genre name if needed for performance, though maybe less useful with objects
// novelSchema.index({ 'genres.name': 1 });

const Novel = mongoose.model('Novel', novelSchema);

module.exports = Novel;