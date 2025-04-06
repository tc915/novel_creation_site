// ---> FILE: ./novel-editor-backend/routes/characters_api.js <---
// routes/characters_api.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable params from parent router (novels)
const Character = require('../models/Character');
const Novel = require('../models/Novel'); // To verify novel ownership
const { protect } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// --- Helper to verify novel ownership ---
// Ensures the user making the request owns the parent novel
const verifyNovelOwnership = async (novelId, userId) => {
    const novel = await Novel.findOne({ _id: novelId, owner: userId });
    if (!novel) {
        const error = new Error('Novel not found or not authorized.');
        error.status = 404; // Or 403 for forbidden
        throw error;
    }
    return novel; // Return the novel if found and owned
};

// --- GET /api/novels/:novelId/characters ---
// @desc    Get all characters for a specific novel
// @access  Private
router.get('/', protect, async (req, res, next) => {
    const { novelId } = req.params;
    const userId = req.user._id;

    try {
        await verifyNovelOwnership(novelId, userId); // Check ownership first

        const characters = await Character.find({ novel: novelId, owner: userId })
            .sort({ name: 1 }); // Sort alphabetically by name

        res.status(200).json(characters);

    } catch (error) {
        console.error(`Error fetching characters for novel ${novelId}:`, error);
        // Forward specific errors (like 404 from helper) or handle others
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid novel ID format.' });
        }
        res.status(500).json({ message: 'Server error fetching characters.' });
        // Or use next(error) if you have a central error handler
    }
});

// --- POST /api/novels/:novelId/characters ---
// @desc    Create a new character for a specific novel
// @access  Private
router.post('/', protect, async (req, res, next) => {
    const { novelId } = req.params;
    const userId = req.user._id;
    // ---> CHANGE START <---
    // Removed imageUrl from destructuring and validation
    const { name, description, role, appearance, backstory, personality, goals, notes } = req.body;
    // ---> CHANGE END <---

    try {
        await verifyNovelOwnership(novelId, userId); // Check ownership

        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Character name is required.' });
        }

        // ---> CHANGE START <---
        // Removed imageUrl validation
        // if (imageUrl && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(imageUrl)) {
        //     return res.status(400).json({ message: 'Invalid image URL format provided.' });
        // }
        // ---> CHANGE END <---

        const newCharacter = new Character({
            name: name.trim(),
            novel: novelId,
            owner: userId,
            // ---> CHANGE START <---
            // Removed imageUrl field
            // imageUrl: imageUrl?.trim() || '',
            // ---> CHANGE END <---
            description: description?.trim() || '',
            role: role?.trim() || '',
            appearance: appearance?.trim() || '',
            backstory: backstory?.trim() || '',
            personality: personality?.trim() || '',
            goals: goals?.trim() || '',
            notes: notes?.trim() || '',
        });

        const savedCharacter = await newCharacter.save();

        console.log(`New character created for novel ${novelId}: ${savedCharacter._id}`);
        res.status(201).json(savedCharacter); // Return the full new character object

    } catch (error) {
        console.error(`Error creating character for novel ${novelId}:`, error);
        if (error.name === 'ValidationError') {
            // Extract specific validation messages
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        if (error.status) { // Handle errors from verifyNovelOwnership
            return res.status(error.status).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error creating character.' });
    }
});

// --- GET /api/novels/:novelId/characters/:characterId ---
// @desc    Get a specific character's details
// @access  Private
router.get('/:characterId', protect, async (req, res, next) => {
    const { novelId, characterId } = req.params;
    const userId = req.user._id;

    try {
        await verifyNovelOwnership(novelId, userId); // Verify novel ownership

        const character = await Character.findOne({
            _id: characterId,
            novel: novelId, // Ensure character belongs to the correct novel
            owner: userId   // Ensure character belongs to the user
        });

        if (!character) {
            return res.status(404).json({ message: 'Character not found.' });
        }

        res.status(200).json(character);

    } catch (error) {
        console.error(`Error fetching character ${characterId} for novel ${novelId}:`, error);
        if (error.status) { // Handle errors from verifyNovelOwnership
            return res.status(error.status).json({ message: error.message });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format for novel or character.' });
        }
        res.status(500).json({ message: 'Server error fetching character.' });
    }
});

// --- PUT /api/novels/:novelId/characters/:characterId ---
// @desc    Update a specific character
// @access  Private
router.put('/:characterId', protect, async (req, res, next) => {
    const { novelId, characterId } = req.params;
    const userId = req.user._id;
    // ---> CHANGE START <---
    // Removed imageUrl from destructuring
    const { name, description, role, appearance, backstory, personality, goals, notes } = req.body;
    // ---> CHANGE END <---

    // Fields allowed to be updated
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    // ---> CHANGE START <---
    // Removed imageUrl from updates
    // if (imageUrl !== undefined) updates.imageUrl = imageUrl.trim();
    // ---> CHANGE END <---
    if (role !== undefined) updates.role = role.trim();
    if (appearance !== undefined) updates.appearance = appearance.trim();
    if (backstory !== undefined) updates.backstory = backstory.trim();
    if (personality !== undefined) updates.personality = personality.trim();
    if (goals !== undefined) updates.goals = goals.trim();
    if (notes !== undefined) updates.notes = notes.trim();


    // Basic Validation
    if (updates.hasOwnProperty('name') && !updates.name) {
        return res.status(400).json({ message: 'Character name cannot be empty.' });
    }
    // ---> CHANGE START <---
    // Removed imageUrl validation
    // if (updates.imageUrl && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(updates.imageUrl)) {
    //     return res.status(400).json({ message: 'Invalid image URL format provided.' });
    // }
    // ---> CHANGE END <---


    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No update fields provided.' });
    }

    try {
        await verifyNovelOwnership(novelId, userId); // Verify novel ownership

        const updatedCharacter = await Character.findOneAndUpdate(
            { _id: characterId, novel: novelId, owner: userId }, // Query conditions
            { $set: updates }, // Apply the updates
            { new: true, runValidators: true, context: 'query' } // Options: return updated doc, run schema validation
        );

        if (!updatedCharacter) {
            return res.status(404).json({ message: 'Character not found or update failed.' });
        }

        res.status(200).json(updatedCharacter); // Return the full updated character

    } catch (error) {
        console.error(`Error updating character ${characterId}:`, error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: `Character validation failed: ${messages.join('. ')}` });
        }
        if (error.status) { // Handle errors from verifyNovelOwnership
            return res.status(error.status).json({ message: error.message });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format.' });
        }
        res.status(500).json({ message: 'Server error updating character.' });
    }
});

// --- DELETE /api/novels/:novelId/characters/:characterId ---
// @desc    Delete a specific character
// @access  Private
router.delete('/:characterId', protect, async (req, res, next) => {
    const { novelId, characterId } = req.params;
    const userId = req.user._id;

    try {
        await verifyNovelOwnership(novelId, userId); // Verify novel ownership

        const result = await Character.deleteOne({
            _id: characterId,
            novel: novelId,
            owner: userId
        });

        if (result.deletedCount === 0) {
            // Character wasn't found matching the criteria
            return res.status(404).json({ message: 'Character not found or already deleted.' });
        }

        console.log(`Character ${characterId} deleted successfully by user ${userId}`);
        res.status(200).json({ message: 'Character successfully deleted.' });

    } catch (error) {
        console.error(`Error deleting character ${characterId}:`, error);
        if (error.status) { // Handle errors from verifyNovelOwnership
            return res.status(error.status).json({ message: error.message });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format.' });
        }
        res.status(500).json({ message: 'Server error deleting character.' });
    }
});


module.exports = router;