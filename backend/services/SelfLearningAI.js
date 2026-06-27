/**
 * Self-Learning AI Module
 * Enables AI to learn from interactions and improve its responses over time
 */

const fs = require('fs').promises;
const path = require('path');
const OllamaService = require('./OllamaService');
const AIServiceRouter = require('./AIServiceRouter');

class SelfLearningAI {
    constructor() {
        this.aiServiceRouter = new AIServiceRouter();
        this.ollamaService = new OllamaService();
        this.learningDataPath = path.join(__dirname, '../data/learning_data.json');
        this.feedbackDataPath = path.join(__dirname, '../data/feedback_data.json');
        
        // Learning parameters
        this.learningRate = 0.1; // How fast the system learns from feedback
        this.knowledgeThreshold = 0.7; // Threshold for considering information reliable
        this.maxKnowledgeEntries = 1000; // Maximum entries to keep
        
        // Initialize learning data structures
        this.interactionHistory = [];
        this.knowledgeBase = new Map();
        this.feedbackLog = [];
        
        // Load existing learning data
        this.loadLearningData();
        
        console.log('🤖 Self-Learning AI initialized');
    }

    /**
     * Load existing learning data from storage
     */
    async loadLearningData() {
        try {
            // Load interaction history
            try {
                const historyData = await fs.readFile(this.learningDataPath, 'utf8');
                this.interactionHistory = JSON.parse(historyData);
            } catch (error) {
                // File doesn't exist, initialize empty
                this.interactionHistory = [];
                await this.saveLearningData();
            }

            // Load feedback data
            try {
                const feedbackData = await fs.readFile(this.feedbackDataPath, 'utf8');
                this.feedbackLog = JSON.parse(feedbackData);
            } catch (error) {
                // File doesn't exist, initialize empty
                this.feedbackLog = [];
                await this.saveFeedbackData();
            }

            console.log(`✅ Loaded ${this.interactionHistory.length} interactions and ${this.feedbackLog.length} feedback entries`);
        } catch (error) {
            console.error('❌ Error loading learning data:', error.message);
        }
    }

    /**
     * Save learning data to storage
     */
    async saveLearningData() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.learningDataPath);
            await fs.mkdir(dataDir, { recursive: true });
            
            await fs.writeFile(this.learningDataPath, JSON.stringify(this.interactionHistory, null, 2));
        } catch (error) {
            console.error('❌ Error saving learning data:', error.message);
        }
    }

    /**
     * Save feedback data to storage
     */
    async saveFeedbackData() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.feedbackDataPath);
            await fs.mkdir(dataDir, { recursive: true });
            
            await fs.writeFile(this.feedbackDataPath, JSON.stringify(this.feedbackLog, null, 2));
        } catch (error) {
            console.error('❌ Error saving feedback data:', error.message);
        }
    }

    /**
     * Process a query with self-learning capabilities
     */
    async processQuery(query, context = {}, userId = 'anonymous') {
        try {
            console.log(`🤖 Processing query: "${query.substring(0, 50)}..."`);

            // Step 1: Check if we have learned similar queries before
            const learnedResponse = await this.getLearnedResponse(query, context);
            if (learnedResponse && Math.random() < 0.8) { // 80% chance to use learned response
                console.log('🔄 Using learned response');
                
                // Log the interaction
                await this.logInteraction(query, learnedResponse, context, userId, true);
                
                return {
                    response: learnedResponse,
                    source: 'learned',
                    confidence: 0.9,
                    learned: true
                };
            }

            // Step 2: Use AI service router for fresh response
            const taskType = this.determineTaskType(query);
            const aiResponse = await this.aiServiceRouter.chat(query, taskType);
            
            if (!aiResponse.success) {
                console.log('⚠️ AI service failed, using fallback');
                // Fallback to simple response
                return {
                    response: "I'm having trouble responding to your query. Could you please rephrase it?",
                    source: 'fallback',
                    confidence: 0.3,
                    learned: false
                };
            }

            // Step 3: Enhance response with learned knowledge
            const enhancedResponse = await this.enhanceWithLearnedKnowledge(aiResponse.message, query, context);

            // Step 4: Log the interaction for future learning
            await this.logInteraction(query, enhancedResponse, context, userId, false);

            return {
                response: enhancedResponse,
                source: 'ai_generated',
                confidence: 0.8,
                learned: false
            };
        } catch (error) {
            console.error('❌ Error in processQuery:', error.message);
            return {
                response: "I apologize, but I encountered an error while processing your request.",
                source: 'error',
                confidence: 0.1,
                learned: false
            };
        }
    }

    /**
     * Determine the task type from the query
     */
    determineTaskType(query) {
        const lowerQuery = query.toLowerCase();
        
        if (lowerQuery.includes('calculate') || lowerQuery.includes('calculation') || lowerQuery.includes('load') || lowerQuery.includes('capacity')) {
            return 'calculations';
        } else if (lowerQuery.includes('refrigerant') || lowerQuery.includes('equipment') || lowerQuery.includes('select')) {
            return 'equipment_selection';
        } else if (lowerQuery.includes('diagram') || lowerQuery.includes('pid') || lowerQuery.includes('draw')) {
            return 'pid_generation';
        } else if (lowerQuery.includes('explain') || lowerQuery.includes('what is') || lowerQuery.includes('how')) {
            return 'explanation';
        } else if (lowerQuery.includes('parse') || lowerQuery.includes('extract')) {
            return 'parsing';
        } else {
            return 'general_qa';
        }
    }

    /**
     * Get a learned response based on similar queries
     */
    async getLearnedResponse(query, context) {
        // Simple similarity check - could be enhanced with embeddings
        const threshold = 0.8;
        
        for (const interaction of this.interactionHistory) {
            const similarity = this.calculateSimilarity(query, interaction.query);
            if (similarity > threshold) {
                return interaction.response;
            }
        }
        
        return null;
    }

    /**
     * Calculate similarity between two texts (simple implementation)
     */
    calculateSimilarity(text1, text2) {
        const words1 = text1.toLowerCase().split(/\W+/);
        const words2 = text2.toLowerCase().split(/\W+/);
        
        const intersection = words1.filter(word => words2.includes(word));
        const union = new Set([...words1, ...words2]);
        
        return intersection.length / union.size;
    }

    /**
     * Enhance response with learned knowledge
     */
    async enhanceWithLearnedKnowledge(response, query, context) {
        // Check if there's related learned knowledge
        const relevantKnowledge = await this.getRelevantKnowledge(query, context);
        
        if (relevantKnowledge.length > 0) {
            // Append relevant knowledge to response
            const knowledgeText = relevantKnowledge
                .slice(0, 3) // Take top 3 relevant pieces
                .map(k => `Note: ${k.content}`)
                .join('\n');
            
            return `${response}\n\n${knowledgeText}`;
        }
        
        return response;
    }

    /**
     * Get relevant knowledge for the query
     */
    async getRelevantKnowledge(query, context) {
        const relevant = [];
        const queryLower = query.toLowerCase();
        
        // Simple keyword-based matching
        for (const [key, entries] of this.knowledgeBase.entries()) {
            if (queryLower.includes(key.toLowerCase())) {
                relevant.push(...entries);
            }
        }
        
        return relevant;
    }

    /**
     * Log an interaction for learning
     */
    async logInteraction(query, response, context, userId, isLearned) {
        const interaction = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            userId,
            query,
            response,
            context,
            isLearned,
            feedbackScore: 0, // Will be updated when feedback is received
            usageCount: 1
        };

        this.interactionHistory.push(interaction);
        
        // Keep only recent interactions to prevent memory issues
        if (this.interactionHistory.length > 1000) {
            this.interactionHistory = this.interactionHistory.slice(-500); // Keep last 500
        }

        await this.saveLearningData();
    }

    /**
     * Record user feedback to improve learning
     */
    async recordFeedback(interactionId, feedback, rating = 0.5) {
        try {
            const interaction = this.interactionHistory.find(i => i.id === interactionId);
            if (!interaction) {
                console.log('❌ Interaction not found for feedback');
                return false;
            }

            // Update interaction with feedback
            interaction.feedbackScore = rating;
            
            // Log feedback separately for analysis
            const feedbackEntry = {
                id: Date.now().toString(),
                interactionId,
                timestamp: new Date().toISOString(),
                feedback,
                rating,
                improvementSuggestions: this.extractImprovementSuggestions(feedback)
            };

            this.feedbackLog.push(feedbackEntry);
            
            // Learn from feedback
            await this.learnFromFeedback(feedbackEntry, interaction);

            // Save updated data
            await this.saveLearningData();
            await this.saveFeedbackData();

            console.log(`✅ Feedback recorded with rating: ${rating}`);
            return true;
        } catch (error) {
            console.error('❌ Error recording feedback:', error.message);
            return false;
        }
    }

    /**
     * Extract improvement suggestions from feedback
     */
    extractImprovementSuggestions(feedback) {
        const suggestions = [];
        const feedbackLower = feedback.toLowerCase();
        
        if (feedbackLower.includes('more detailed')) suggestions.push('provide_more_detail');
        if (feedbackLower.includes('clearer')) suggestions.push('improve_clarity');
        if (feedbackLower.includes('better')) suggestions.push('enhance_quality');
        if (feedbackLower.includes('incorrect')) suggestions.push('fix_accuracy');
        if (feedbackLower.includes('missing')) suggestions.push('add_missing_info');
        
        return suggestions;
    }

    /**
     * Learn from feedback to improve future responses
     */
    async learnFromFeedback(feedbackEntry, interaction) {
        // Update knowledge base based on positive feedback
        if (feedbackEntry.rating >= 0.7) {
            await this.addToKnowledgeBase(interaction.query, interaction.response, feedbackEntry.rating);
        }
        
        // Adjust response patterns based on negative feedback
        if (feedbackEntry.rating <= 0.3) {
            await this.adjustResponsePatterns(interaction.query, feedbackEntry.improvementSuggestions);
        }
    }

    /**
     * Add information to knowledge base
     */
    async addToKnowledgeBase(query, response, rating) {
        const keywords = this.extractKeywords(query);
        
        for (const keyword of keywords) {
            if (!this.knowledgeBase.has(keyword)) {
                this.knowledgeBase.set(keyword, []);
            }
            
            const knowledgeEntry = {
                content: response,
                sourceQuery: query,
                rating,
                timestamp: new Date().toISOString()
            };
            
            // Add to knowledge base
            this.knowledgeBase.get(keyword).push(knowledgeEntry);
            
            // Keep only high-rated entries and limit size
            const sortedEntries = this.knowledgeBase.get(keyword)
                .filter(entry => entry.rating >= this.knowledgeThreshold)
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 10); // Keep top 10
            
            this.knowledgeBase.set(keyword, sortedEntries);
        }
    }

    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        const words = text.toLowerCase().match(/\b(\w{4,})\b/g) || [];
        // Remove common stop words
        const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
        return [...new Set(words.filter(word => !stopWords.has(word)))];
    }

    /**
     * Adjust response patterns based on feedback
     */
    async adjustResponsePatterns(query, suggestions) {
        // This could involve adjusting prompts, response styles, etc.
        console.log(`🔄 Adjusting patterns for suggestions: ${suggestions.join(', ')}`);
        
        // Implementation would depend on specific adjustment needs
        // For now, we'll just log the adjustments needed
    }

    /**
     * Get learning statistics
     */
    getLearningStats() {
        return {
            totalInteractions: this.interactionHistory.length,
            totalFeedback: this.feedbackLog.length,
            knowledgeBaseSize: this.knowledgeBase.size,
            averageFeedbackRating: this.feedbackLog.length > 0 
                ? this.feedbackLog.reduce((sum, fb) => sum + fb.rating, 0) / this.feedbackLog.length 
                : 0,
            learningEnabled: true
        };
    }

    /**
     * Reset learning data (for testing purposes)
     */
    async resetLearning() {
        this.interactionHistory = [];
        this.knowledgeBase.clear();
        this.feedbackLog = [];
        
        await this.saveLearningData();
        await this.saveFeedbackData();
        
        console.log('🔄 Learning data reset');
    }
}

module.exports = SelfLearningAI;