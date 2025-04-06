// ---> FILE: ./novel-editor-backend/models/Character.js <---
// models/Character.js
const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Character name is required.'],
            trim: true,
        },
        novel: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Novel',
            index: true, // Index for faster querying by novel
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
            index: true, // Index for faster querying by owner
        },
        // ---> CHANGE START <---
        // Removed imageUrl field
        // imageUrl: {
        //   type: String,
        //   trim: true,
        //   default: '',
        //   match: [
        //     /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        //     'Please provide a valid image URL',
        //   ],
        // },
        // ---> CHANGE END <---
        description: {
            // Short tagline or overview
            type: String,
            trim: true,
            default: '',
        },
        role: {
            // e.g., Protagonist, Antagonist, Supporting
            type: String,
            trim: true,
            default: '',
        },
        appearance: {
            // Detailed physical description
            type: String,
            trim: true,
            default: '',
        },
        backstory: {
            type: String,
            trim: true,
            default: '',
        },
        personality: {
            type: String,
            trim: true,
            default: '',
        },
        goals: {
            type: String,
            trim: true,
            default: '',
        },
        notes: {
            // General freeform notes
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically
    }
);

// Optional: Add a compound index if you often query by novel and name
characterSchema.index({ novel: 1, name: 1 });

const Character = mongoose.model('Character', characterSchema);

module.exports = Character;