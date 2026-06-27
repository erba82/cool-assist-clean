    /**
     * Intelligent message handler (v3.0)
     * Handles: questions, incomplete designs, recommendations
     * @param {string} userMessage - User's natural language input
     * @param {string} sessionId - Session ID for conversation tracking
     * @returns {Object} Response with intent-based content
     */
    async handleMessage(userMessage, sessionId = 'default') {
    const startTime = Date.now();

    try {
        console.log('🤖 AI Message Handler v3.0');
        console.log(`📨 Message: "${userMessage.substring(0, 100)}..."`);

        // Get or create conversation state
        let conversation = this.conversationState.get(sessionId) || {
            history: [],
            parsedInfo: {},
            awaitingInfo: false,
            awaitingConfirmation: false
        };

        // Step 1: Classify intent
        console.log('🎯 Classifying intent...');
        const classification = this.intentClassifier.classify(userMessage, {
            awaitingInfo: conversation.awaitingInfo,
            awaitingConfirmation: conversation.awaitingConfirmation
        });
        console.log(`   ✓ Intent: ${classification.intent} (confidence: ${classification.confidence})`);

        // Step 2: Extract entities
        const entities = classification.entities || {};

        // Step 3: Handle based on intent
        let response;

        switch (classification.intent) {
            case 'GREETING':
                response = this._handleGreeting(classification.language);
                break;

            case 'QUESTION':
                response = await this._handleQuestion(userMessage, classification);
                break;

            case 'CLARIFICATION':
                // User is providing additional information
                response = await this._handleClarification(userMessage, entities, conversation, classification);
                break;

            case 'CONFIRMATION':
                // User confirmed recommendations
                response = await this._handleConfirmation(conversation, classification);
                break;

            case 'MODIFICATION':
                // User wants to modify recommendations
                response = this._handleModification(conversation, classification);
                break;

            case 'DESIGN_REQUEST':
                response = await this._handleDesignRequest(userMessage, entities, classification, conversation);
                break;

            case 'UNKNOWN':
            default:
                response = this._handleUnknown(classification.language);
                break;
        }

        // Update conversation history
        conversation.history.push({
            timestamp: new Date(),
            userMessage,
            intent: classification.intent,
            response: response.type
        });
        this.conversationState.set(sessionId, conversation);

        response.executionTime = Date.now() - startTime;
        response.sessionId = sessionId;

        return response;

    } catch (error) {
        console.error('❌ Message handling error:', error);
        return {
            success: false,
            type: 'error',
            message: {
                en: 'Sorry, I encountered an error processing your message.',
                fa: 'متأسفانه در پردازش پیام شما خطایی رخ داد.',
                ar: 'عذراً، حدث خطأ في معالجة رسالتك.'
            },
            error: error.message,
            executionTime: Date.now() - startTime
        };
    }
}

_handleGreeting(language) {
    const greetings = {
        en: {
            message: '👋 Hello! I\'m your AI refrigeration design assistant.',
            help: 'I can help you design cold storage rooms, freezers, and refrigeration systems. Just describe your project!'
        },
        fa: {
            message: '👋 سلام! من دستیار هوشمند طراحی تبرید شما هستم.',
            help: 'می‌توانم در طراحی سردخانه، فریزر و سیستم‌های تبرید به شما کمک کنم. فقط پروژه خود را توضیح دهید!'
        },
        ar: {
            message: '👋 مرحباً! أنا مساعد تصميم التبريد الذكي.',
            help: 'يمكنني مساعدتك في تصميم غرف التخزين البارد والمجمدات وأنظمة التبريد.'
        }
    };

    const greeting = greetings[language] || greetings.en;

    return {
        success: true,
        type: 'greeting',
        message: greeting.message,
        help: greeting.help,
        language
    };
}

    async _handleQuestion(userMessage, classification) {
    // For questions, provide informative response (could integrate with knowledge base)
    const responses = {
        en: {
            message: 'I understand you have a question about refrigeration.',
            note: 'General knowledge base integration coming soon. For now, I can help with design calculations.',
            suggestions: [
                'Design a cold storage room',
                'Calculate cooling load',
                'Recommend refrigerant'
            ]
        },
        fa: {
            message: 'متوجه شدم که سوالی درباره تبرید دارید.',
            note: 'فعلاً می‌توانم در محاسبات طراحی به شما کمک کنم.',
            suggestions: [
                'طراحی سردخانه',
                'محاسبه بار حرارتی',
                'پیشنهاد مبرد'
            ]
        }
    };

    const lang = classification.language;
    const resp = responses[lang] || responses.en;

    return {
        success: true,
        type: 'question_response',
        message: resp.message,
        note: resp.note,
        suggestions: resp.suggestions,
        language: lang
    };
}

    async _handleClarification(userMessage, entities, conversation, classification) {
    // User is providing additional information
    console.log('📝 Processing clarification...');

    // Merge new entities with existing parsed info
    for (const [key, value] of Object.entries(entities)) {
        if (value) {
            conversation.parsedInfo[key] = value;
        }
    }

    // Re-parse the combined information
    const fullInput = conversation.history.map(h => h.userMessage).join(' ') + ' ' + userMessage;
    const parsed = await this.parser.parse(fullInput);

    // Merge parsed data
    conversation.parsedInfo = { ...conversation.parsedInfo, ...parsed };

    // Validate if we have everything
    const validation = this.infoValidator.validate(conversation.parsedInfo);

    if (validation.isComplete) {
        // We have everything! Generate recommendations
        return await this._generateRecommendations(conversation, classification);
    } else {
        // Still missing info - ask next question
        return this._askMissingInfo(validation, classification.language, conversation);
    }
}

    async _handleConfirmation(conversation, classification) {
    // User confirmed recommendations - proceed with calculation
    console.log('✅ User confirmed - running calculations...');

    if (!conversation.parsedInfo || !conversation.recommendedRefrigerant) {
        return {
            success: false,
            type: 'error',
            message: 'No recommendations to confirm. Please start a new design request.',
            language: classification.language
        };
    }

    // Set the confirmed refrigerant and materials
    conversation.parsedInfo.refrigerant = conversation.recommendedRefrigerant;
    conversation.parsedInfo.wallMaterial = conversation.recommendedMaterials;

    // Run the full calculation
    return await this.processRequest(
        JSON.stringify(conversation.parsedInfo),
        true, // skip re-parsing
        conversation.parsedInfo
    );
}

_handleModification(conversation, classification) {
    return {
        success: true,
        type: 'modification_request',
        message: {
            en: 'What would you like to change?',
            fa: 'چه چیزی را میخواهید تغییر دهید؟',
            ar: 'ماذا تريد تغييره؟'
        }[classification.language] || 'What would you like to change?',
        currentRecommendations: {
            refrigerant: conversation.recommendedRefrigerant,
            materials: conversation.recommendedMaterials
        },
        language: classification.language
    };
}

    async _handleDesignRequest(userMessage, entities, classification, conversation) {
    console.log('🏗️ Handling design request...');

    // Parse the full message
    const parsed = await this.parser.parse(userMessage);

    // Merge with existing conversation data
    conversation.parsedInfo = { ...conversation.parsedInfo, ...parsed, ...entities };

    // Validate required information
    const validation = this.infoValidator.validate(conversation.parsedInfo);

    console.log(`   ✓ Completeness: ${(validation.completenessScore * 100).toFixed(0)}%`);

    if (validation.isComplete) {
        // All required info present - generate recommendations
        return await this._generateRecommendations(conversation, classification);
    } else {
        // Missing information - ask for it
        return this._askMissingInfo(validation, classification.language, conversation);
    }
}

    async _generateRecommendations(conversation, classification) {
    console.log('💡 Generating smart recommendations...');

    const info = conversation.parsedInfo;

    // Calculate estimated cooling load for refrigerant recommendation
    let estimatedLoad = 100; // default
    if (info.dimensions) {
        const volume = (info.dimensions.length || 10) *
            (info.dimensions.width || 10) *
            (info.dimensions.height || 3);
        estimatedLoad = volume * 2; // rough estimate: 2kW per m³
    }

    const temperature = info.temperature || info.entities?.temperatures?.[0] || -20;
    const location = info.location || info.entities?.locations || 'International';

    // Get refrigerant recommendation
    const refRec = this.refrigerantRecommender.recommend({
        coolingLoad: estimatedLoad,
        temperature,
        location,
        applicationType: info.applicationType || 'cold_storage_frozen'
    });

    // Get material recommendation
    const matRec = this.materialRecommender.recommend({
        temperature,
        location,
        roomDimensions: info.dimensions,
        applicationType: info.applicationType
    });

    // Get regional standards
    const standards = getStandardsForLocation(location);

    // Store recommendations in conversation
    conversation.recommendedRefrigerant = refRec.recommended;
    conversation.recommendedMaterials = matRec;
    conversation.awaitingConfirmation = true;
    conversation.awaitingInfo = false;

    const lang = classification.language;

    return {
        success: true,
        type: 'recommendations',
        message: {
            en: '✅ I have analyzed your requirements. Here are my recommendations:',
            fa: '✅ نیازهای شما را بررسی کردم. پیشنهادات من:',
            ar: '✅ لقد قمت بتحليل متطلباتك. إليك توصياتي:'
        }[lang] || '✅ Recommendations ready',
        projectSummary: {
            location: standards.country,
            applicationType: info.applicationType,
            temperature: `${temperature}°C`,
            estimatedLoad: `${estimatedLoad} kW`,
            dimensions: info.dimensions
        },
        refrigerant: {
            recommended: refRec.recommended,
            alternatives: refRec.alternatives,
            analysis: refRec.analysis
        },
        materials: {
            panel: matRec.panel,
            door: matRec.door,
            floor: matRec.floor
        },
        standards: {
            country: standards.country,
            code: standards.refrigerationStandards?.code,
            safetyFactor: standards.refrigerationStandards?.safetyFactor
        },
        nextSteps: {
            en: [
                'Confirm to proceed with calculations',
                'Or say "change refrigerant" or "change materials" to modify'
            ],
            fa: [
                'تأیید کنید تا محاسبات انجام شود',
                'یا برای تغییر بگویید "تغییر مبرد" یا "تغییر متریال"'
            ],
            ar: [
                'تأكيد للمتابعة مع الحسابات',
                'أو قل "تغيير المبرد" أو "تغيير المواد" للتعديل'
            ]
        }[lang],
        language: lang,
        awaitingConfirmation: true
    };
}

_askMissingInfo(validation, language, conversation) {
    console.log(`❓ Asking for missing info: ${validation.missing.map(m => m.field).join(', ')}`);

    conversation.awaitingInfo = true;

    const questions = validation.missing.slice(0, 3).map(m => {
        return this.infoValidator.generateQuestion(m.field, language);
    });

    const messages = {
        en: '📋 I need a bit more information to design your system:',
        fa: '📋 برای طراحی سیستم، نیاز به اطلاعات بیشتری دارم:',
        ar: '📋 أحتاج إلى مزيد من المعلومات لتصميم نظامك:'
    };

    return {
        success: true,
        type: 'info_request',
        message: messages[language] || messages.en,
        completeness: `${(validation.completenessScore * 100).toFixed(0)}%`,
        filled: validation.filled.map(f => f.field),
        questions,
        language
    };
}

_handleUnknown(language) {
    const messages = {
        en: {
            message: 'I\'m not sure I understood that.',
            help: 'You can ask me to design a cold storage, or ask questions about refrigeration.'
        },
        fa: {
            message: 'متأسفانه متوجه نشدم.',
            help: 'می‌توانید از من بخواهید سردخانه طراحی کنم یا سوالات تبرید بپرسید.'
        },
        ar: {
            message: 'لم أفهم ذلك.',
            help: 'يمكنك أن تطلب مني تصميم تخزين بارد أو طرح أسئلة حول التبريد.'
        }
    };

    const resp = messages[language] || messages.en;

    return {
        success: true,
        type: 'unknown',
        message: resp.message,
        help: resp.help,
        language
    };
}
