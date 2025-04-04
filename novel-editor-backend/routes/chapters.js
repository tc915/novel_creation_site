// routes/chapters.js
const express = require('express');
// Use mergeParams: true to access :novelId from the parent router (novels.js)
const router = express.Router({ mergeParams: true });
const Novel = require('../models/Novel');
const Chapter = require('../models/Chapter');
const { protect } = require('../middleware/authMiddleware'); // Assuming path

// --- GET /api/novels/:novelId/chapters ---
// @desc    Get all chapters for a specific novel owned by the user
// @access  Private
router.get('/', protect, async (req, res) => {
    const { novelId } = req.params;
    const userId = req.user._id;

    try {
        // First, verify the user owns the parent novel
        const parentNovel = await Novel.findOne({ _id: novelId, owner: userId });
        if (!parentNovel) {
            return res.status(404).json({ message: 'Novel not found or not authorized.' });
        }

        // Find chapters belonging to this novel and owner, sort by order
        const chapters = await Chapter.find({ novel: novelId, owner: userId })
                                       .sort({ order: 1 }) // Sort chapters by order field
                                       .select('title order _id createdAt updatedAt'); // Select only needed fields for list view

        res.status(200).json(chapters);

    } catch (error) {
        console.error(`Error fetching chapters for novel ${novelId}:`, error);
         if (error.name === 'CastError') {
             return res.status(400).json({ message: 'Invalid novel ID format.' });
         }
        res.status(500).json({ message: 'Server error fetching chapters.' });
    }
});

// --- POST /api/novels/:novelId/chapters ---
// @desc    Create a new chapter for a specific novel
// @access  Private
router.post('/', protect, async (req, res) => {
    const { novelId } = req.params;
    const userId = req.user._id;

    try {
         // Verify user owns the parent novel
        const parentNovel = await Novel.findById(novelId);
        if (!parentNovel || parentNovel.owner.toString() !== userId.toString()) {
            return res.status(404).json({ message: 'Novel not found or not authorized.' });
        }

        // Determine the order for the new chapter (e.g., append at the end)
        const existingChapterCount = await Chapter.countDocuments({ novel: novelId });
        const newOrder = existingChapterCount; // Simple 0-based index appending

        // Create the new chapter
        const newChapter = new Chapter({
            title: `Chapter ${newOrder + 1}`, // Default title
            // content: initialSlateContent, // Default content from model
            order: newOrder,
            novel: novelId,
            owner: userId,
        });

        const savedChapter = await newChapter.save();

        // Add chapter reference to the parent novel's chapters array
        parentNovel.chapters.push(savedChapter._id);
        await parentNovel.save();

        console.log(`New chapter created for novel ${novelId}: ${savedChapter._id}`);
        // Return only essential data for the list view
        res.status(201).json({
             _id: savedChapter._id,
             title: savedChapter.title,
             order: savedChapter.order,
             createdAt: savedChapter.createdAt,
             updatedAt: savedChapter.updatedAt
            });

    } catch (error) {
        console.error(`Error creating chapter for novel ${novelId}:`, error);
        res.status(500).json({ message: 'Server error creating chapter.' });
    }
});

// --- Add routes for GET /:chapterId, PUT /:chapterId, DELETE /:chapterId later ---

module.exports = router;