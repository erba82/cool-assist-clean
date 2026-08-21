/**
 * Intelligent Chat API Route
 * Uses handleMessage for smart conversation
 */

const express = require('express');
const router = express.Router();
const DesignOrchestrator = require('../core/ai/DesignOrchestrator');
const GeminiService = require('../services/GeminiService');
const AIModelRouter = require('../services/AIModelRouter');
const AgentLearningStore = require('../core/ai/AgentLearningStore');

// Automatic observational learning is persisted to the local MongoDB service.
// It never auto-promotes engineering rules, equipment selection, safety settings or skills.
const automaticLearningStore = new AgentLearningStore();
void automaticLearningStore.initialize();

// Create orchestrator instance
const orchestrator = new DesignOrchestrator({ learningStore: automaticLearningStore });

// Create Gemini service for general chat
const geminiService = new GeminiService();
const generalModelRouter = new AIModelRouter({ geminiService, learningStore: automaticLearningStore });

/**
 * POST /api/chat/message
 * Intelligent message handler with intent detection
 */
router.post('/message', async (req, res) => {
    try {
        const { message, sessionId } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        console.log(`\n📨 Chat Message from session: ${sessionId || 'default'}`);
        console.log(`   Message: "${message.substring(0, 100)}..."`);

                // Design-mode requests remain under DesignOrchestrator governance. Learning
        // proposals are review-gated and never modify rules or skills automatically.



        // Handle message with intelligent orchestrator
        const response = await orchestrator.handleMessage(message, sessionId || 'default');

        res.json(response);

    } catch (error) {
        console.error('❌ Chat error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            type: 'error'
        });
    }
});

/**
 * POST /api/chat/design (legacy endpoint - still supports full design)
 * Direct design request without conversation
 */
router.post('/design', async (req, res) => {
    try {
        const { message, refrigerant, location } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        console.log(`\n🏗️ Direct Design Request`);
        
        let modifiedMessage = message;
        if (refrigerant || location) {
            if (refrigerant) modifiedMessage += ` (specific refrigerant: ${refrigerant})`;
            if (location) modifiedMessage += ` (location: ${JSON.stringify(location)})`;
        }
                
        const response = await orchestrator.processRequest(modifiedMessage);
        
        res.json(response);

    } catch (error) {
        console.error('❌ Design error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/chat/session/:sessionId
 */
router.get('/session/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const conversation = orchestrator.conversationState.get(sessionId);

        if (!conversation) {
            return res.json({
                success: true,
                exists: false,
                message: 'No conversation found for this session'
            });
        }

        res.json({
            success: true,
            exists: true,
            conversation: {
                messageCount: conversation.history.length,
                parsedInfo: conversation.parsedInfo,
                awaitingInfo: conversation.awaitingInfo,
                awaitingConfirmation: conversation.awaitingConfirmation,
                hasRecommendations: !!conversation.recommendedRefrigerant
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/chat/session/:sessionId
 */
router.delete('/session/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const existed = orchestrator.conversationState.has(sessionId);
        orchestrator.conversationState.delete(sessionId);
        res.json({ success: true, cleared: existed });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/chat/general
 * General purpose chat using AI services
 */
router.post('/general', async (req, res) => {
    try {
        const { message, sessionId } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        console.log(`\n💬 General Chat from session: ${sessionId || 'default'}`);

        // Detect language
        const IntentClassifier = require('../core/ai/IntentClassifier');
        const classifier = new IntentClassifier();
        const language = classifier.detectLanguage(message);

        // General chat is read-only: it does not invoke design execution or mutate engineering rules.
        // One governed router owns all provider fallback, including the local DeepSeek endpoint.
        const routed = await generalModelRouter.complete({
            purpose: 'general-chat',
            temperature: 0.3,
            maxTokens: 1200,
            messages: [
                { role: 'system', content: 'Answer the user directly and professionally. Do not claim to have changed a project, created engineering data, standards compliance, prices or files. For requests that affect a design, explain that the user must use Design & Calculations Mode and confirm a reviewable proposal.' },
                { role: 'user', content: String(message) }
            ]
        });

        if (!routed.success) {
            const fallbackMessages = {
                en: "I'm currently unable to connect to the configured AI providers. Please verify local Ollama or the provider credentials.",
                fa: "در حال حاضر اتصال به مدل‌های هوش مصنوعی پیکربندی‌شده ممکن نیست. لطفاً Ollama محلی یا کلیدهای provider را بررسی کنید.",
                ar: "لا يمكنني الاتصال بنماذج الذكاء الاصطناعي المهيأة حالياً."
            };
            return res.json({ success: true, type: 'general_response', message: fallbackMessages[language] || fallbackMessages.en, language, fallback: true, attempts: routed.attempts || [] });
        }

        res.json({
            success: true,
            type: 'general_response',
            message: routed.text,
            language,
            sessionId: sessionId || 'default',
            provenance: { provider: routed.provider, model: routed.model, profile: routed.profile, purpose: routed.purpose, routing: routed.routing, reviewRequired: true }
        });

    } catch (error) {
        console.error('❌ General chat error:', error);
        res.status(500).json({ success: false, error: error.message, type: 'error' });
    }
});

/**
 * GET /api/chat/providers
 * Secret-safe router observability. This endpoint never returns credentials or prompts.
 */
router.get('/providers', (_req, res) => {
    try {
        res.json({ success: true, router: generalModelRouter.status(), automaticLearning: automaticLearningStore.status() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;