/**
 * Intelligent Chat API Route
 * Uses handleMessage for smart conversation
 */

const express = require('express');
const router = express.Router();
const DesignOrchestrator = require('../core/ai/DesignOrchestrator');
const GeminiService = require('../services/GeminiService');
const SelfLearningAI = require('../services/SelfLearningAI'); 
const AIServiceRouter = require('../services/AIServiceRouter'); // 🌟 وارد کردن روتر پیشرفته لوکال

// Create orchestrator instance
const orchestrator = new DesignOrchestrator();

// Create Gemini service for general chat
const geminiService = new GeminiService();

// Initialize SelfLearningAI for enhanced intelligence
const selfLearningAI = new SelfLearningAI();

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

        if (message.toLowerCase().includes('learn') || message.toLowerCase().includes('improve') || 
            message.toLowerCase().includes('teach') || message.toLowerCase().includes('better')) {
            
            const learningResult = await selfLearningAI.processQuery(message, { sessionId }, sessionId || 'default');
            
            if (learningResult.learned || learningResult.source !== 'error') {
                return res.json({
                    success: true,
                    type: 'learning_response',
                    message: learningResult.response,
                    source: learningResult.source,
                    confidence: learningResult.confidence,
                    sessionId: sessionId || 'default'
                });
            }
        }

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

        // Try SelfLearning AI first
        const learningResult = await selfLearningAI.processQuery(message, { 
            sessionId, language, context: 'general_chat'
        }, sessionId || 'default');

        if (learningResult.success && learningResult.source !== 'error') {
            return res.json({
                success: true, type: 'general_response',
                message: learningResult.response,
                language, sessionId: sessionId || 'default', enhanced: true
            });
        }

        // 🌟 بخش کلیدی: مسیریابی هوشمند درخواست‌ها 🌟
        
        // مرحله اول: تلاش برای اتصال به جمنای (در صورت وجود API Key)
        let response = await geminiService.chatWithHistory(message, sessionId || 'default', language);

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
            sessionId: response.sessionId || sessionId || 'default'
        });

    } catch (error) {
        console.error('❌ General chat error:', error);
        res.status(500).json({ success: false, error: error.message, type: 'error' });
    }
});

module.exports = router;