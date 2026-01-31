const express = require('express');
const router = express.Router();
const Decision = require('../models/Decision');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get decisions
// @route   GET /api/decisions
router.get('/', protect, async (req, res) => {
    try {
        const decisions = await Decision.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(decisions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Set decision
// @route   POST /api/decisions
router.post('/', protect, async (req, res) => {
    try {
        const { id, ...rest } = req.body;

        // Explicitly set _id if id is provided (frontend UUID)
        const decisionData = { ...rest, userId: req.user.id };
        if (id) {
            decisionData._id = id;
        }

        console.log('decisionData - ', decisionData);

        const decision = await Decision.create(decisionData);
        res.status(201).json(decision);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update decision
// @route   PUT /api/decisions/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const decision = await Decision.findById(req.params.id);

        if (!decision) {
            return res.status(404).json({ message: 'Decision not found' });
        }

        // Check for user
        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Make sure the logged in user matches the goal user
        if (decision.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        // Update fields
        const updatedDecision = await Decision.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.status(200).json(updatedDecision);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete decision
// @route   DELETE /api/decisions/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const decision = await Decision.findById(req.params.id);

        if (!decision) {
            return res.status(404).json({ message: 'Decision not found' });
        }

        // Check for user
        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Make sure the logged in user matches the goal user
        if (decision.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await decision.deleteOne();

        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
