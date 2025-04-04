// routes/novels.js
const express = require('express');
const router = express.Router();
const Novel = require('../models/Novel');
const { protect } = require('../middleware/authMiddleware');

// --- GET /api/novels ---
// @desc    Get all novels for the logged-in user
// @access  Private
// (Keep existing GET route as is)
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
// @desc    Create a new minimal novel shell for the logged-in user
// @access  Private
// (Keep existing POST route - it already sets owner and default title)
router.post('/', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Not authorized, user data missing.' });
    }
    // Title is optional here, uses default from schema if not provided
    const { title } = req.body;

    const newNovel = new Novel({
      title: title || undefined, // Use schema default if title not sent
      owner: req.user._id,
      author: req.user.name || '', // Pre-fill author with user's name if available
    });

    const savedNovel = await newNovel.save();
    res.status(201).json(savedNovel); // Send back the created novel object

  } catch (error) {
    console.error('Error creating novel:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: `Novel validation failed: ${error.message}` });
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
// @desc    Update a specific novel by ID for the logged-in user
// @access  Private
router.put('/:id', protect, async (req, res) => {
    const { title, author, genres, description } = req.body;

    // Basic validation
    if (!title) { // Title becomes mandatory on update/save
        return res.status(400).json({ message: 'Novel title cannot be empty.' });
    }

    try {
        // Find the novel ensuring the user owns it
        const novel = await Novel.findOne({
             _id: req.params.id,
             owner: req.user._id
        });

        if (!novel) {
            return res.status(404).json({ message: 'Novel not found or not authorized.' });
        }

        // Update fields
        novel.title = title;
        novel.author = author || req.user.name || ''; // Use provided author, fallback to user name, then empty
        novel.genres = Array.isArray(genres) ? genres : []; // Ensure genres is an array
        novel.description = description || '';

        const updatedNovel = await novel.save(); // Mongoose validation runs here

        res.status(200).json(updatedNovel);

    } catch (error) {
         console.error(`Error updating novel ${req.params.id}:`, error);
         if (error.name === 'ValidationError') {
            return res.status(400).json({ message: `Novel validation failed: ${error.message}` });
         }
         if (error.name === 'CastError') {
             return res.status(400).json({ message: 'Invalid novel ID format.' });
         }
        res.status(500).json({ message: 'Server error updating novel.' });
    }
});


// --- Add DELETE Route ---
// DELETE /api/novels/:id
// @desc    Delete a novel owned by the user
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        // Find the novel first to ensure it exists and belongs to the user
        const novel = await Novel.findOne({
             _id: req.params.id,
             owner: req.user._id // Check ownership
        });

        if (!novel) {
            // Even if not found, might return 200 or 204 for idempotency, or 404
            return res.status(404).json({ message: 'Novel not found or not authorized.' });
        }

        // Use deleteOne method on the model, ensuring ownership again for safety
        const result = await Novel.deleteOne({ _id: req.params.id, owner: req.user._id });

        if (result.deletedCount === 0) {
             // Should not happen if findOne succeeded, but good check
             return res.status(404).json({ message: 'Novel not found or not authorized.' });
        }

        console.log(`Novel ${req.params.id} deleted by user ${req.user._id}`);
        res.status(200).json({ message: 'Novel successfully deleted.' });

    } catch (error) {
        console.error(`Error deleting novel ${req.params.id}:`, error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid novel ID format.' });
        }
        res.status(500).json({ message: 'Server error deleting novel.' });
    }
});

// --- Mount Chapter Routes ---
// Any request to /api/novels/:novelId/chapters will be handled by chapterRouter
const chapterRouter = require('./chapters'); // Assuming chapters.js is in the same directory
router.use('/:novelId/chapters', chapterRouter);
// --- End Mount Chapter Routes ---
// --- End Added Route ---

module.exports = router;