// models/Novel.js
const mongoose = require('mongoose');

const novelSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Novel title is required.'],
      trim: true,
      default: 'Untitled Novel', // Keep default for initial creation
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // --- Added Fields ---
    author: { // Let's store author explicitly, might differ from owner
      type: String,
      trim: true,
      default: '', // Default to empty, frontend can prefill with user name
    },
    genres: { // Array of strings for genres
      type: [String],
      default: [],
    },
    description: { // Synopsis or description
      type: String,
      trim: true,
      default: '',
    },
    // --- End Added Fields ---
    // --- Add Chapters Array ---
    chapters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter'
    }],
    // --- End Added Field ---
    // characters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Character' }],
    // worldItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorldItem' }],
    // outline: { type: Object },
    // notes: { type: String },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

const Novel = mongoose.model('Novel', novelSchema);

module.exports = Novel;