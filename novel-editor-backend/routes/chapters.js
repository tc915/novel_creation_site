// ---> FILE: ./novel-editor-backend/routes/chapters.js <---

// routes/chapters.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable param merging
const Novel = require('../models/Novel');
const Chapter = require('../models/Chapter');
const { protect } = require('../middleware/authMiddleware'); // Adjust path if needed
const mongoose = require('mongoose'); // Keep for potential future transaction use

// --- Helper to verify novel ownership ---
const verifyNovelOwnership = async (novelId, userId, session) => { // Added session param
    // Find novel within the session if provided
    const novel = await Novel.findOne({ _id: novelId, owner: userId }).session(session);
    if (!novel) {
        const error = new Error('Novel not found or not authorized.');
        error.status = 404;
        throw error; // Throw error to be caught by transaction handler
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
        await verifyNovelOwnership(novelId, userId); // Verification without session needed here
        // Chapters should always be fetched sorted by their 'order' field
        const chapters = await Chapter.find({ novel: novelId })
            .sort({ order: 1 })
            .select('title order _id createdAt updatedAt'); // Select only needed list fields

        res.status(200).json(chapters);
    } catch (error) {
        console.error(`Error fetching chapters for novel ${novelId}:`, error);
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

    const session = await mongoose.startSession(); // Use transaction for create+update
    session.startTransaction();
    try {
        const parentNovel = await verifyNovelOwnership(novelId, userId, session);
        const existingChapterCount = await Chapter.countDocuments({ novel: novelId }).session(session);
        const newOrder = existingChapterCount; // Order is 0-based index

        const newChapter = new Chapter({
            title: title || `Chapter ${newOrder + 1}`, // Use provided title or default
            order: newOrder,
            novel: novelId,
            owner: userId, // Explicitly set owner on chapter too
        });

        const savedChapter = await newChapter.save({ session });

        // Add chapter reference to Novel's chapter array (maintains order implicitly if pushed)
        parentNovel.chapters.push(savedChapter._id);
        await parentNovel.save({ session });

        await session.commitTransaction(); // Commit successful transaction

        console.log(`New chapter created for novel ${novelId}: ${savedChapter._id} with order ${newOrder}`);
        // Return essential data, including the full new chapter object
        res.status(201).json(savedChapter);

    } catch (error) {
        await session.abortTransaction(); // Abort transaction on error
        console.error(`Error creating chapter for novel ${novelId}:`, error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: `Chapter validation failed: ${error.message}` });
        }
        next(error);
    } finally {
        session.endSession(); // Always end the session
    }
});

// ---> CHANGE START <---
// --- DELETE /api/novels/:novelId/chapters/all ---
// @desc    Delete ALL chapters for a specific novel
// @access  Private
// !!! DEFINE THIS ROUTE *BEFORE* /:chapterId routes that use DELETE !!!
router.delete('/all', protect, async (req, res, next) => {
    const { novelId } = req.params;
    const userId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Verify ownership and get the novel
        const novel = await verifyNovelOwnership(novelId, userId, session);

        // 2. Delete all chapters associated with this novel
        console.log(`Attempting to delete all chapters for novel ${novelId}`);
        const deleteResult = await Chapter.deleteMany({ novel: novelId, owner: userId }).session(session);
        console.log(`Deleted ${deleteResult.deletedCount} chapters for novel ${novelId}`);

        // 3. Clear the chapters array in the parent novel
        novel.chapters = [];
        await novel.save({ session });
        console.log(`Cleared chapters array for novel ${novelId}`);

        // 4. Commit transaction
        await session.commitTransaction();

        res.status(200).json({ message: `Successfully deleted ${deleteResult.deletedCount} chapters.` });

    } catch (error) {
        // Abort transaction on any error
        await session.abortTransaction();
        console.error(`Error deleting all chapters for novel ${novelId}:`, error);

        if (error.status === 404) { // Specific error from verifyNovelOwnership
            return res.status(404).json({ message: error.message });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid novel ID format.' });
        }
        // Generic server error for other issues
        res.status(500).json({ message: 'Server error during bulk chapter deletion.' });
        // Optionally use next(error) if you have a central error handler
        // next(error);
    } finally {
        // End the session
        session.endSession();
    }
});
// ---> CHANGE END <---


// --- GET /api/novels/:novelId/chapters/:chapterId ---
// @desc    Get a specific chapter's full details (including content)
// @access  Private
router.get('/:chapterId', protect, async (req, res, next) => {
    const { novelId, chapterId } = req.params;
    const userId = req.user._id;
    try {
        await verifyNovelOwnership(novelId, userId); // No session needed for read-only
        const chapter = await Chapter.findOne({ _id: chapterId, novel: novelId });
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found within this novel.' });
        }
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
// @desc    Update a specific chapter (title and content only, order not updatable here)
// @access  Private
router.put('/:chapterId', protect, async (req, res, next) => {
    const { novelId, chapterId } = req.params;
    const userId = req.user._id;
    const { title, content } = req.body; // Only accept title and content

    // Basic Validation
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
        // Only validate title if it's actually being sent for update
        return res.status(400).json({ message: 'Chapter title cannot be empty when provided.' });
    }
    if (content === undefined && title === undefined) {
        return res.status(400).json({ message: 'No update fields (title or content) provided.' });
    }

    try {
        await verifyNovelOwnership(novelId, userId); // No session needed if only updating one chapter

        const chapter = await Chapter.findOne({ _id: chapterId, novel: novelId });

        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found.' });
        }

        // Update only provided fields
        if (title !== undefined) {
            chapter.title = title.trim();
        }
        if (content !== undefined) {
            chapter.content = content; // Assume content is valid Slate JSON
        }
        // chapter.order is NOT updated here

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
// @desc    Delete a specific chapter and re-order subsequent ones
// @access  Private
router.delete('/:chapterId', protect, async (req, res, next) => {
    const { novelId, chapterId } = req.params;
    const userId = req.user._id;
    // Optional: Use a transaction for atomicity
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const parentNovel = await Novel.findOne({ _id: novelId, owner: userId }).session(session);
        if (!parentNovel) {
            throw new Error('Novel not found or not authorized.');
        }

        const chapter = await Chapter.findOne({ _id: chapterId, novel: novelId }).session(session);
        if (!chapter) {
            // Important: Abort transaction before sending response if chapter not found
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Chapter not found.' });
        }
        const deletedOrder = chapter.order;

        // Remove chapter reference from Novel
        parentNovel.chapters.pull(chapterId);
        await parentNovel.save({ session });

        // Delete the chapter document itself
        const deleteResult = await Chapter.deleteOne({ _id: chapterId }).session(session);
        if (deleteResult.deletedCount === 0) {
            // Should not happen if findOne succeeded, but safety check
            throw new Error('Chapter deletion failed unexpectedly.');
        }

        // Reorder subsequent chapters
        await Chapter.updateMany(
            { novel: novelId, order: { $gt: deletedOrder } },
            { $inc: { order: -1 } } // Decrement order for all chapters after the deleted one
        ).session(session);

        // Commit Transaction
        await session.commitTransaction();
        console.log(`Chapter ${chapterId} deleted and subsequent chapters reordered for novel ${novelId}`);
        res.status(200).json({ message: 'Chapter successfully deleted.' });

    } catch (error) {
        // Abort Transaction on Error
        await session.abortTransaction();
        console.error(`Error during chapter deletion transaction for chapter ${chapterId}:`, error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format.' });
        }
        // Send specific validation error messages or a generic one
        res.status(500).json({ message: error.message || 'Server error during chapter deletion.' });
        // No next(error) here as we handled the transaction and response

    } finally {
        // End Session
        session.endSession();
    }
});


module.exports = router;