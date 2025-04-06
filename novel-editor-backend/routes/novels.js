// ---> FILE: ./novel-editor-backend/routes/novels.js <---

// routes/novels.js
const express = require('express');
const router = express.Router();
const Novel = require('../models/Novel');
const Chapter = require('../models/Chapter'); // Import Chapter for delete cascade
// ---> CHANGE START <---
const Character = require('../models/Character'); // Import Character for delete cascade
// ---> CHANGE END <---
const { protect } = require('../middleware/authMiddleware');

// --- GET /api/novels ---
// @desc    Get all novels for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const novels = await Novel.find({ owner: req.user._id }).sort({ updatedAt: -1 });
        res.status(200).json(novels);
    } catch (error) {
        console.error('Error fetching novels:', error);
        res.status(500).json({ message: 'Server error fetching novels.' });
    }
});

// --- POST /api/novels ---
// @desc    Create a new novel with initial details
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Not authorized, user data missing.' });
        }

        const { title, author, genres, description } = req.body;

        // Validate incoming genres array structure (optional but good practice)
        let processedGenres = [];
        if (Array.isArray(genres)) {
            processedGenres = genres
                .filter(g => g && typeof g.name === 'string' && g.name.trim() !== '') // Basic filter
                .map(g => ({
                    name: g.name.trim(),
                    isCustom: typeof g.isCustom === 'boolean' ? g.isCustom : false // Default isCustom if missing
                }));
            // Optional: Check for duplicate names within the submitted array
            const names = new Set();
            processedGenres = processedGenres.filter(g => {
                const lowerName = g.name.toLowerCase();
                if (names.has(lowerName)) return false; // Reject duplicate name
                names.add(lowerName);
                return true;
            });
        }


        const novelData = {
            title: title || undefined,
            owner: req.user._id,
            author: author?.trim() || req.user.name || '',
            genres: processedGenres, // Use the processed array of objects
            description: description?.trim() || '',
            // Schema defaults handle font settings
        };

        const newNovel = new Novel(novelData);
        const savedNovel = await newNovel.save(); // Mongoose validation runs here
        res.status(201).json(savedNovel);

    } catch (error) {
        console.error('Error creating novel:', error);
        if (error.name === 'ValidationError') {
            // Extract more specific messages if possible, including nested errors for genres
            let messages = Object.values(error.errors).map(val => {
                // Handle nested errors within the genres array
                if (val.path?.startsWith('genres.') && val.properties) {
                    return `${val.path}: ${val.properties.message}`;
                }
                return val.message;
            });
            return res.status(400).json({ message: messages.join('. ') || 'Novel validation failed.' });
        }
        res.status(500).json({ message: 'Server error creating novel.' });
    }
});

// --- GET /api/novels/:id ---
// @desc    Get a specific novel by ID for the logged-in user
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const novel = await Novel.findOne({
            _id: req.params.id,
            owner: req.user._id // Ensure the logged-in user owns this novel
        });

        if (!novel) {
            return res.status(404).json({ message: 'Novel not found or not authorized.' });
        }

        res.status(200).json(novel);

    } catch (error) {
        console.error(`Error fetching novel ${req.params.id}:`, error);
        // Handle CastError if ID format is invalid
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid novel ID format.' });
        }
        res.status(500).json({ message: 'Server error fetching novel.' });
    }
});


// --- PUT /api/novels/:id ---
// @desc    Update a specific novel by ID (Handles FULL and PARTIAL updates)
// @access  Private
router.put('/:id', protect, async (req, res) => {
    // Destructure potentially updated fields
    const { title, author, genres, description, defaultFontFamily, defaultFontSize } = req.body;
    const novelId = req.params.id;
    const userId = req.user._id;

    const fieldsToUpdate = {};

    if (title !== undefined) fieldsToUpdate.title = title.trim();
    if (author !== undefined) fieldsToUpdate.author = author.trim();
    if (description !== undefined) fieldsToUpdate.description = description.trim();
    if (defaultFontFamily !== undefined) fieldsToUpdate.defaultFontFamily = defaultFontFamily.trim();
    if (defaultFontSize !== undefined) fieldsToUpdate.defaultFontSize = defaultFontSize.trim();

    // Handle the genres array update specifically
    if (genres !== undefined) {
        // Validate incoming genres array structure
        if (!Array.isArray(genres)) {
            return res.status(400).json({ message: 'Genres must be an array.' });
        }
        let processedGenres = genres
            .filter(g => g && typeof g.name === 'string' && g.name.trim() !== '')
            .map(g => ({
                name: g.name.trim(),
                isCustom: typeof g.isCustom === 'boolean' ? g.isCustom : false // Default isCustom
            }));
        // Optional: Check for duplicate names within the submitted array
        const names = new Set();
        processedGenres = processedGenres.filter(g => {
            const lowerName = g.name.toLowerCase();
            if (names.has(lowerName)) return false;
            names.add(lowerName);
            return true;
        });

        fieldsToUpdate.genres = processedGenres; // Add the validated array to fieldsToUpdate
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ message: 'No update fields provided.' });
    }
    if (fieldsToUpdate.hasOwnProperty('title') && !fieldsToUpdate.title) {
        return res.status(400).json({ message: 'Novel title cannot be empty when updating it.' });
    }

    try {
        const updatedNovel = await Novel.findOneAndUpdate(
            { _id: novelId, owner: userId },
            { $set: fieldsToUpdate }, // $set will replace the entire genres array if provided
            { new: true, runValidators: true, context: 'query' }
        );

        if (!updatedNovel) {
            return res.status(404).json({ message: 'Novel not found or not authorized.' });
        }
        res.status(200).json(updatedNovel);

    } catch (error) {
        console.error(`Error updating novel ${novelId}:`, error);
        if (error.name === 'ValidationError') {
            let messages = Object.values(error.errors).map(val => {
                // Handle nested errors within the genres array
                if (val.path?.startsWith('genres.') && val.properties) {
                    return `${val.path}: ${val.properties.message}`;
                }
                return val.message;
            });
            return res.status(400).json({ message: messages.join('. ') || 'Novel validation failed.' });
        }
        if (error.name === 'CastError') { return res.status(400).json({ message: 'Invalid novel ID format.' }); }
        res.status(500).json({ message: 'Server error updating novel.' });
    }
});

// --- DELETE /api/novels/:id ---
// @desc    Delete a novel owned by the user
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    const novelId = req.params.id;
    const userId = req.user._id;
    try {
        // Find the novel first to ensure it exists and belongs to the user
        const novel = await Novel.findOne({
            _id: novelId,
            owner: userId // Check ownership
        });

        if (!novel) {
            // Even if not found, might return 200 or 204 for idempotency, or 404
            return res.status(404).json({ message: 'Novel not found or not authorized.' });
        }

        // Delete the novel itself
        const result = await Novel.deleteOne({ _id: novelId, owner: userId });

        if (result.deletedCount === 0) {
            // Should not happen if findOne succeeded, but good check
            return res.status(404).json({ message: 'Novel not found or deletion failed.' });
        }

        // ---> CHANGE START <---
        // Delete associated chapters
        console.log(`Deleting chapters associated with novel ${novelId}`);
        const chapterDeletionResult = await Chapter.deleteMany({ novel: novelId, owner: userId });
        console.log(`Deleted ${chapterDeletionResult.deletedCount} chapters.`);

        // Delete associated characters
        console.log(`Deleting characters associated with novel ${novelId}`);
        const characterDeletionResult = await Character.deleteMany({ novel: novelId, owner: userId });
        console.log(`Deleted ${characterDeletionResult.deletedCount} characters.`);
        // ---> CHANGE END <---


        console.log(`Novel ${novelId} deleted by user ${userId}`);
        res.status(200).json({ message: 'Novel and all associated data successfully deleted.' }); // Updated message

    } catch (error) {
        console.error(`Error deleting novel ${novelId}:`, error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid novel ID format.' });
        }
        res.status(500).json({ message: 'Server error deleting novel.' });
    }
});

// --- Mount Chapter Routes ---
const chapterRouter = require('./chapters');
router.use('/:novelId/chapters', chapterRouter);

// ---> CHANGE START <---
// --- Mount Character Routes ---
const characterRouter = require('./characters_api'); // Use the new file
router.use('/:novelId/characters', characterRouter); // Mount under /novels/:novelId/characters
// ---> CHANGE END <---


module.exports = router;