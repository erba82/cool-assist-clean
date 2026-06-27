/**
 * Learning AI API Route
 * Provides self-learning capabilities for the AI system
 */

const express = require('express');
const router = express.Router();
const SelfLearningAI = require('../services/SelfLearningAI');

// Initialize the self-learning AI
const selfLearningAI = new SelfLearningAI();

/**
 * POST /api/learning/query
 * Process a query using the self-learning AI system
 */
router.post('/query', async (req, res) => {
    try {
        const { query, context, userId } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required'
            });
        }

        console.log(`\n🤖 Learning AI Query from user: ${userId || 'anonymous'}`);
        console.log(`   Query: "${query.substring(0, 100)}..."`);

        // Process the query with self-learning capabilities
        const result = await selfLearningAI.processQuery(query, context || {}, userId || 'anonymous');

        res.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Learning AI error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/learning/feedback
 * Record feedback to improve the AI system
 */
router.post('/feedback', async (req, res) => {
    try {
        const { interactionId, feedback, rating } = req.body;

        if (!interactionId || !feedback) {
            return res.status(400).json({
                success: false,
                error: 'interactionId and feedback are required'
            });
        }

        console.log(`\n🎓 Recording feedback for interaction: ${interactionId}`);
        console.log(`   Rating: ${rating || 'not provided'}`);

        // Record the feedback
        const success = await selfLearningAI.recordFeedback(interactionId, feedback, rating || 0.5);

        res.json({
            success: true,
            recorded: success,
            interactionId
        });

    } catch (error) {
        console.error('❌ Learning AI feedback error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/learning/stats
 * Get learning statistics
 */
router.get('/stats', (req, res) => {
    try {
        const stats = selfLearningAI.getLearningStats();

        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Learning AI stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/learning/reset
 * Reset learning data (for testing purposes)
 */
router.post('/reset', async (req, res) => {
    try {
        await selfLearningAI.resetLearning();

        res.json({
            success: true,
            message: 'Learning data reset successfully'
        });

    } catch (error) {
        console.error('❌ Learning AI reset error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;