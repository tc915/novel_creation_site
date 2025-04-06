// routes/chapters.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable param merging
const Novel = require('../models/Novel');
const Chapter = require('../models/Chapter');
const { protect } = require('../middleware/authMiddleware'); // Adjust path if needed

// --- Helper to verify novel ownership ---
const verifyNovelOwnership = async (novelId, userId) => {
    const novel = await Novel.findOne({ _id: novelId, owner: userId });
    if (!novel) {
        const error = new Error('Novel not found or not authorized.');
        error.status = 404;
        throw error;
    }
    return novel; // Return the novel if found and owned
};

// --- GET /api/novels/:novelId/chapters ---
// @desc    Get all chapters for a specific novel (basic info)
// @access  Private
router.get('/', protect, async (req, res, next) => { // Use next for error handling
    const { novelId } = req.params;
    const userId = req.user._id;
    try {
        await verifyNovelOwnership(novelId, userId); // Verify ownership first
        const chapters = await Chapter.find({ novel: novelId /* Removed owner check here as novel ownership implies chapter access */ })
            .sort({ order: 1 })
            .select('title order _id createdAt updatedAt'); // Select only needed list fields

        res.status(200).json(chapters);
    } catch (error) {
        console.error(`Error fetching chapters for novel ${novelId}:`, error);
        // Pass error to Express error handler or handle specific cases
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid novel ID format.' });
        }
        next(error); // Forward other errors (like 404 from helper)
    }
});

// --- POST /api/novels/:novelId/chapters ---
// @desc    Create a new chapter for a specific novel
// @access  Private
router.post('/', protect, async (req, res, next) => {
    const { novelId } = req.params;
    const userId = req.user._id;
    const { title } = req.body; // Optional: Allow title override on creation

    try {
        const parentNovel = await verifyNovelOwnership(novelId, userId); // Verify ownership

        const existingChapterCount = await Chapter.countDocuments({ novel: novelId });
        const newOrder = existingChapterCount;

        const newChapter = new Chapter({
            title: title || `Chapter ${newOrder + 1}`, // Use provided title or default
            order: newOrder,
            novel: novelId,
            owner: userId, // Explicitly set owner on chapter too
        });

        const savedChapter = await newChapter.save();

        // --- IMPORTANT: Add chapter reference to Novel ---
        parentNovel.chapters.push(savedChapter._id);
        await parentNovel.save();
        // --- End Novel Update ---

        console.log(`New chapter created for novel ${novelId}: ${savedChapter._id}`);
        // Return essential data, including the full new chapter object
        res.status(201).json(savedChapter);

    } catch (error) {
        console.error(`Error creating chapter for novel ${novelId}:`, error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: `Chapter validation failed: ${error.message}` });
        }
        next(error);
    }
});

// --- GET /api/novels/:novelId/chapters/:chapterId ---
// @desc    Get a specific chapter's full details (including content)
// @access  Private
router.get('/:chapterId', protect, async (req, res, next) => {
    const { novelId, chapterId } = req.params;
    const userId = req.user._id;
    try {
        await verifyNovelOwnership(novelId, userId); // Verify novel ownership

        const chapter = await Chapter.findOne({ _id: chapterId, novel: novelId });

        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found within this novel.' });
        }
        // No need to check chapter.owner if novel ownership is confirmed

        res.status(200).json(chapter);

    } catch (error) {
        console.error(`Error fetching chapter ${chapterId} for novel ${novelId}:`, error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format for novel or chapter.' });
        }
        next(error);
    }
});

// --- PUT /api/novels/:novelId/chapters/:chapterId ---
// @desc    Update a specific chapter (title and content)
// @access  Private
router.put('/:chapterId', protect, async (req, res, next) => {
    const { novelId, chapterId } = req.params;
    const userId = req.user._id;
    const { title, content } = req.body;

    // Basic Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: 'Chapter title cannot be empty.' });
    }
    // Add validation for content if needed (e.g., check if it's a valid Slate structure)
    if (content === undefined) {
        return res.status(400).json({ message: 'Chapter content is required.' });
    }


    try {
        await verifyNovelOwnership(novelId, userId); // Verify novel ownership

        const chapter = await Chapter.findOne({ _id: chapterId, novel: novelId });

        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found.' });
        }

        chapter.title = title.trim();
        chapter.content = content; // Assume content is valid Slate JSON
        // Mongoose automatically updates `updatedAt`

        const updatedChapter = await chapter.save(); // Mongoose validation runs here

        res.status(200).json(updatedChapter); // Return the full updated chapter

    } catch (error) {
        console.error(`Error updating chapter ${chapterId}:`, error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: `Chapter validation failed: ${error.message}` });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format.' });
        }
        next(error);
    }
});

// --- DELETE /api/novels/:novelId/chapters/:chapterId ---
// @desc    Delete a specific chapter
// @access  Private
router.delete('/:chapterId', protect, async (req, res, next) => {
    const { novelId, chapterId } = req.params;
    const userId = req.user._id;
    try {
        const parentNovel = await verifyNovelOwnership(novelId, userId); // Verify ownership

        const chapter = await Chapter.findOne({ _id: chapterId, novel: novelId });
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found.' });
        }

        // --- IMPORTANT: Remove chapter reference from Novel ---
        parentNovel.chapters.pull(chapterId); // Mongoose helper to remove from array
        // Consider re-ordering subsequent chapters *before* deleting
        const deletedOrder = chapter.order;
        await parentNovel.save();
        // --- End Novel Update ---

        // Delete the chapter document itself
        const deleteResult = await Chapter.deleteOne({ _id: chapterId });
        if (deleteResult.deletedCount === 0) {
            // Should not happen if findOne succeeded, but safety check
            throw new Error('Chapter deletion failed unexpectedly.');
        }

        // --- Reorder subsequent chapters ---
        await Chapter.updateMany(
            { novel: novelId, order: { $gt: deletedOrder } },
            { $inc: { order: -1 } } // Decrement order for all chapters after the deleted one
        );
        // --- End Reorder ---

        console.log(`Chapter ${chapterId} deleted from novel ${novelId}`);
        res.status(200).json({ message: 'Chapter successfully deleted.' });

    } catch (error) {
        console.error(`Error deleting chapter ${chapterId}:`, error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format.' });
        }
        next(error);
    }
});

// --- POST /api/novels/:novelId/chapters/reorder ---
// @desc    Reorder chapters for a novel
// @access  Private
router.post('/reorder', protect, async (req, res, next) => {
    const { novelId } = req.params;
    const userId = req.user._id;
    const { orderedChapterIds } = req.body; // Expect an array of chapter IDs in the new desired order

    if (!Array.isArray(orderedChapterIds)) {
        return res.status(400).json({ message: 'Invalid data format: orderedChapterIds must be an array.' });
    }

    try {
        const parentNovel = await verifyNovelOwnership(novelId, userId); // Verify ownership

        // Fetch all chapters to ensure we have the correct count and IDs
        const currentChapters = await Chapter.find({ novel: novelId }).select('_id');
        if (currentChapters.length !== orderedChapterIds.length) {
            return res.status(400).json({ message: 'Mismatch in chapter count during reorder.' });
        }
        const currentIds = currentChapters.map(c => c._id.toString());
        const receivedIds = new Set(orderedChapterIds);
        if (!currentIds.every(id => receivedIds.has(id))) {
            return res.status(400).json({ message: 'Mismatch in chapter IDs during reorder.' });
        }


        // --- Update Order using bulkWrite for efficiency ---
        const bulkOps = orderedChapterIds.map((chapterId, index) => ({
            updateOne: {
                filter: { _id: chapterId, novel: novelId }, // Ensure chapter belongs to this novel
                update: { $set: { order: index } } // Set new 0-based order
            }
        }));

        if (bulkOps.length > 0) {
            await Chapter.bulkWrite(bulkOps);
        }
        // --- End Update Order ---

        // --- Update the novel's chapter array order ---
        parentNovel.chapters = orderedChapterIds; // Overwrite with the new ordered IDs
        await parentNovel.save();
        // --- End Update Novel ---


        console.log(`Chapters reordered for novel ${novelId}`);
        res.status(200).json({ message: 'Chapters reordered successfully.' });

    } catch (error) {
        console.error(`Error reordering chapters for novel ${novelId}:`, error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format.' });
        }
        next(error);
    }
});


module.exports = router;