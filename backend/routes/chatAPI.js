/**
 * Intelligent Chat API Route
 * Uses handleMessage for smart conversation
 */

const express = require('express');
const router = express.Router();
const DesignOrchestrator = require('../core/ai/DesignOrchestrator');
const GeminiService = require('../services/GeminiService');
 
const AIServiceRouter = require('../services/AIServiceRouter'); // local fallback
const AIModelRouter = require('../services/AIModelRouter');

// Create orchestrator instance
const orchestrator = new DesignOrchestrator();

// Create Gemini service for general chat
const geminiService = new GeminiService();
const generalModelRouter = new AIModelRouter({ geminiService });



// 🌟 ساخت نمونه از روتر لوکال برای هندل کردن چت‌ها
const aiRouter = new AIServiceRouter();

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

        // General chat is read-only: it does not call project parsing, design execution,
        // learning mutation or rule updates. Provider provenance is retained in the response.
        const routed = await generalModelRouter.complete({
            purpose: 'general-chat',
            temperature: 0.3,
            maxTokens: 1200,
            messages: [
                { role: 'system', content: 'Answer the user directly and professionally. Do not claim to have changed a project, created engineering data, standards compliance, prices or files. For requests that affect a design, explain that the user must use Design & Calculations Mode and confirm a reviewable proposal.' },
                { role: 'user', content: String(message) }
            ]
        });
        let response = routed.success
            ? { success: true, message: routed.text, sessionId: sessionId || 'default', provider: routed.provider, model: routed.model }
            : { success: false, fallback: true, error: routed.error };

        // مرحله دوم: اگر جمنای نبود یا ارور داد، از روتر قدرتمند لوکال استفاده کن!
        if (!response.success || response.fallback) {
            console.log('🚀 Redirecting to Advanced Local AI Router...');
            
            const localResponse = await aiRouter.chatWithHistory(
                message,
                sessionId || 'default',
                'general_qa', // هدایت به تسک چت عمومی
                language
            );

            if (localResponse && localResponse.success) {
                response = localResponse;
            } else {
                response = { success: false, fallback: true, error: localResponse?.error };
            }
        }

        // اگر حتی تمام مدل‌های لوکال ما هم کِرَش کردند:
        if (!response.success && response.fallback) {
            const fallbackMessages = {
                en: "I'm currently unable to connect to the AI models. If running locally, please ensure Ollama is open and your PC has enough RAM.",
                fa: "در حال حاضر امکان اتصال به هوش مصنوعی وجود ندارد. لطفاً مطمئن شوید Ollama در حال اجراست و سیستم شما رم کافی دارد.",
                ar: "لا يمكنني الاتصال بخدمة الذكاء الاصطناعي حالياً."
            };

            return res.json({
                success: true, 
                type: 'general_response',
                message: fallbackMessages[language] || fallbackMessages.en,
                language,
                fallback: true
            });
        }

        res.json({
            success: true,
            type: 'general_response',
            message: response.message,
            language,
                sessionId: response.sessionId || sessionId || 'default',
                provenance: response.provider ? { provider: response.provider, model: response.model || null, purpose: 'general-chat', reviewRequired: false } : null
            });

    } catch (error) {
        console.error('❌ General chat error:', error);
        res.status(500).json({ success: false, error: error.message, type: 'error' });
    }
});

module.exports = router;