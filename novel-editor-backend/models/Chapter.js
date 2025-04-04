// models/Chapter.js
const mongoose = require('mongoose');

// Define initial empty content for Slate
const initialSlateContent = [ { type: 'paragraph', children: [{ text: '' }], } ];

const chapterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled Chapter',
    },
    // Store Slate's content structure directly
    // Use Mixed type, or define a more specific nested structure if preferred
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: initialSlateContent,
    },
    // Order within the novel
    order: {
      type: Number,
      required: true,
    },
    // Link back to the parent novel
    novel: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Novel',
    },
    // Link to the owner (for easier querying/permissions if needed)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure chapter order is unique within a novel
chapterSchema.index({ novel: 1, order: 1 }, { unique: true });

const Chapter = mongoose.model('Chapter', chapterSchema);

module.exports = Chapter;