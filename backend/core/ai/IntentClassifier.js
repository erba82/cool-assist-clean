/**
 * Intent Classifier
 * Detects user intent from messages:
 * - DESIGN_REQUEST: User wants a calculation/design
 * - QUESTION: User asking for help/information
 * - CLARIFICATION: User providing additional info
 * - CONFIRMATION: User confirming a recommendation
 * - GREETING: User greeting/small talk
 */

class IntentClassifier {
    constructor() {
        // Keywords for design requests (multilingual)
        this.designKeywords = {
            en: ['design', 'calculate', 'cold storage', 'refrigeration', 'cooling', 'freezer',
                'cold room', 'chiller', 'blast freezer', 'tunnel', 'iqf', 'ice cream',
                'dairy', 'meat', 'fish', 'chicken', 'need', 'want', 'build', 'create',
                'warehouse', 'factory', 'plant', 'facility', 'slaughterhouse'],
            fa: ['طراحی', 'محاسبه', 'سردخانه', 'تبرید', 'خنک', 'فریزر', 'یخچال',
                'تونل', 'آمونیاک', 'بستنی', 'لبنیات', 'گوشت', 'ماهی', 'مرغ',
                'میخوام', 'نیاز', 'بساز', 'کارخانه', 'انبار', 'سالن', 'کشتارگاه'],
            ar: ['تصميم', 'حساب', 'تبريد', 'مبرد', 'ثلاجة', 'مجمد', 'برودة']
        };

        // Keywords for questions
        this.questionKeywords = {
            en: ['what is', 'how to', 'how do', 'why', 'explain', 'tell me', 'can you',
                'help', 'problem', 'issue', 'error', 'difference', 'which', 'recommend',
                'best', 'should i', 'advice', 'guide', 'tutorial', 'what are', 'what',
                'how', 'when', 'where', 'who', 'could you', 'would you', 'please',
                'compare', 'vs', 'versus', 'advantage', 'disadvantage', 'benefit',
                'drawback', 'mean', 'meaning', 'definition', 'define'],
            fa: ['چیست', 'چطور', 'چگونه', 'چرا', 'توضیح', 'بگو', 'میتونی', 'کمک',
                'مشکل', 'خطا', 'تفاوت', 'کدوم', 'پیشنهاد', 'بهتره', 'باید', 'راهنما',
                'معنی', 'یعنی', 'تعریف', 'مقایسه', 'مزیت', 'معایب'],
            ar: ['ما هو', 'كيف', 'لماذا', 'اشرح', 'ساعدني', 'مشكلة', 'ماذا']
        };

        // Keywords for confirmation
        this.confirmKeywords = {
            en: ['yes', 'ok', 'okay', 'confirm', 'accept', 'agree', 'correct', 'right', 'proceed', 'go ahead', 'sure'],
            fa: ['بله', 'آره', 'تایید', 'قبول', 'درسته', 'موافقم', 'ادامه'],
            ar: ['نعم', 'موافق', 'صحيح', 'تأكيد']
        };

        // Keywords for rejection/modification
        this.rejectKeywords = {
            en: ['no', 'change', 'modify', 'different', 'wrong', 'not', 'cancel', 'edit'],
            fa: ['نه', 'تغییر', 'عوض', 'اشتباه', 'نیست', 'لغو', 'ویرایش'],
            ar: ['لا', 'تغيير', 'خطأ', 'إلغاء']
        };

        // Keywords for greetings
        this.greetingKeywords = {
            en: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'thanks', 'thank you'],
            fa: ['سلام', 'درود', 'صبح بخیر', 'ممنون', 'مرسی', 'خسته نباشید'],
            ar: ['مرحبا', 'أهلا', 'صباح الخير', 'شكرا']
        };

        // Project type keywords
        this.projectTypeKeywords = {
            refrigeration: {
                en: ['cold storage', 'freezer', 'refrigeration', 'cooling', 'cold room', 'frozen', 'chilled', 'iqf', 'blast'],
                fa: ['سردخانه', 'فریزر', 'تبرید', 'خنک', 'منجمد', 'یخ']
            },
            hvac: {
                en: ['hvac', 'air conditioning', 'ac', 'ventilation', 'heating', 'cooling system'],
                fa: ['تهویه', 'کولر', 'گرمایش', 'سرمایش']
            }
        };

        // Application type keywords
        this.applicationKeywords = {
            cold_storage_frozen: {
                en: ['frozen', 'freezer', '-18', '-20', '-25', 'negative', 'below zero'],
                fa: ['منجمد', 'زیرصفر', 'فریزر']
            },
            cold_storage_chilled: {
                en: ['chilled', 'fresh', '+4', '+2', 'above zero', 'positive'],
                fa: ['خنک', 'تازه', 'بالای صفر']
            },
            dairy_factory: {
                en: ['dairy', 'milk', 'cheese', 'yogurt', 'butter'],
                fa: ['لبنیات', 'شیر', 'پنیر', 'ماست', 'کره']
            },
            ice_cream_factory: {
                en: ['ice cream', 'gelato', 'sorbet'],
                fa: ['بستنی']
            },
            iqf_frozen: {
                en: ['iqf', 'individual quick', 'quick freeze'],
                fa: ['آی کیو اف']
            },
            spiral_tunnel: {
                en: ['spiral', 'spiral tunnel', 'spiral freezer'],
                fa: ['اسپیرال', 'تونل اسپیرال']
            },
            fish_shrimp: {
                en: ['fish', 'shrimp', 'seafood', 'marine', 'tuna', 'salmon'],
                fa: ['ماهی', 'میگو', 'دریایی', 'تن']
            },
            meat_processing: {
                en: ['meat', 'beef', 'lamb', 'pork', 'chicken', 'poultry', 'slaughterhouse'],
                fa: ['گوشت', 'گاو', 'گوسفند', 'مرغ', 'طیور', 'کشتارگاه']
            },
            blast_tunnel: {
                en: ['blast', 'tunnel', 'shock freezer', 'quick freeze'],
                fa: ['تونل', 'انجماد سریع', 'بلست']
            }
        };
    }

    /**
     * Convert Persian/Arabic digits to English digits
     * ۰۱۲۳۴۵۶۷۸۹ → 0123456789
     * ٠١٢٣٤٥٦٧٨٩ → 0123456789
     */
    _convertPersianDigits(str) {
        if (!str) return str;

        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

        let result = str;

        // Convert Persian digits
        for (let i = 0; i < 10; i++) {
            result = result.replace(new RegExp(persianDigits[i], 'g'), i.toString());
        }

        // Convert Arabic digits
        for (let i = 0; i < 10; i++) {
            result = result.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
        }

        return result;
    }

    /**
     * Detect the language of the message
     */
    detectLanguage(message) {
        const persianPattern = /[\u0600-\u06FF]/;

        if (persianPattern.test(message)) {
            // Persian-specific characters (چ، ژ، پ، گ، ک، ی with two dots)
            const persianSpecific = /[چژپگکی]/;

            // Persian-specific words (not used in Arabic)
            const persianWords = /سردخانه|تهران|متر|درجه|میخوام|بله|آره|سلام|درود/;

            // Persian digits
            const persianDigits = /[۰-۹]/;

            if (persianSpecific.test(message) || persianWords.test(message) || persianDigits.test(message)) {
                return 'fa';
            }
            return 'ar';
        }
        return 'en';
    }

    /**
     * Check if message contains keywords from a category
     */
    containsKeywords(message, keywordDict) {
        const msgLower = message.toLowerCase();

        for (const lang of Object.keys(keywordDict)) {
            for (const keyword of keywordDict[lang]) {
                if (msgLower.includes(keyword.toLowerCase())) {
                    return { found: true, keyword, language: lang };
                }
            }
        }
        return { found: false };
    }

    /**
     * Extract entities from message
     */
    extractEntities(message) {
        const entities = {
            dimensions: this._extractDimensions(message),
            temperatures: this._extractTemperatures(message),
            locations: this._extractLocations(message),
            products: this._extractProducts(message),
            projectType: this._extractProjectType(message),
            applicationType: this._extractApplicationType(message)
        };

        return entities;
    }

    _extractDimensions(message) {
        // Convert Persian/Arabic digits to English first
        const normalizedMsg = this._convertPersianDigits(message);

        // Match patterns like "10x15x5m", "10m x 15m x 5m", "10 متر", "۱۵×۲۰"
        const patterns = [
            /(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(?:m|متر|meter)?/i,
            /(\d+(?:\.\d+)?)\s*(?:m|متر)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(?:m|متر)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(?:m|متر)?/i,
            /length[:\s]*(\d+(?:\.\d+)?)\s*(?:m|متر)?.*width[:\s]*(\d+(?:\.\d+)?)\s*(?:m|متر)?.*height[:\s]*(\d+(?:\.\d+)?)\s*(?:m|متر)?/i,
            // 2D pattern with default height
            /(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(?:m|متر|meter)?/i
        ];

        for (let i = 0; i < patterns.length; i++) {
            const pattern = patterns[i];
            const match = normalizedMsg.match(pattern);
            if (match) {
                // Last pattern is 2D, use default height of 5m
                const is2D = (i === patterns.length - 1);
                return {
                    length: parseFloat(match[1]),
                    width: parseFloat(match[2]),
                    height: is2D ? 5 : parseFloat(match[3]),
                    raw: match[0]
                };
            }
        }
        return null;
    }

    _extractTemperatures(message) {
        // Convert Persian/Arabic digits to English first
        const normalizedMsg = this._convertPersianDigits(message);

        // Match patterns like "-18C", "-18°C", "-18 درجه", "-۲۵ درجه"
        const patterns = [
            /(-?\d+(?:\.\d+)?)\s*(?:°?[CcFf]|درجه|degree)/g,
            /temp(?:erature)?[:\s]*(-?\d+(?:\.\d+)?)/gi
        ];

        const temps = [];
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(normalizedMsg)) !== null) {
                temps.push(parseFloat(match[1]));
            }
        }
        return temps.length > 0 ? temps : null;
    }

    _extractLocations(message) {
        // City to country mapping
        const cityToCountry = {
            'tehran': 'Iran', 'تهران': 'Iran', 'mashhad': 'Iran', 'مشهد': 'Iran',
            'isfahan': 'Iran', 'اصفهان': 'Iran', 'shiraz': 'Iran', 'شیراز': 'Iran',
            'tabriz': 'Iran', 'تبریز': 'Iran', 'iran': 'Iran', 'ایران': 'Iran',
            'dubai': 'UAE', 'دبی': 'UAE', 'abu dhabi': 'UAE', 'uae': 'UAE',
            'riyadh': 'Saudi Arabia', 'ریاض': 'Saudi Arabia', 'jeddah': 'Saudi Arabia',
            'doha': 'Qatar', 'qatar': 'Qatar', 'kuwait': 'Kuwait', 'bahrain': 'Bahrain',
            'berlin': 'Germany', 'munich': 'Germany', 'germany': 'Germany',
            'london': 'UK', 'manchester': 'UK', 'uk': 'UK', 'england': 'UK',
            'new york': 'USA', 'los angeles': 'USA', 'usa': 'USA', 'america': 'USA',
            'shanghai': 'China', 'beijing': 'China', 'china': 'China',
            'tokyo': 'Japan', 'osaka': 'Japan', 'japan': 'Japan',
            'sydney': 'Australia', 'melbourne': 'Australia', 'australia': 'Australia'
        };

        // Common location patterns
        const locationPatterns = [
            /(?:in|at|location|city|country|محل|شهر|کشور)[:\s]+([A-Za-z\u0600-\u06FF]+(?:\s+[A-Za-z\u0600-\u06FF]+)?)/i,
            /(Tehran|Dubai|Riyadh|London|Berlin|New York|Shanghai|Tokyo|Sydney|تهران|دبی|ریاض|مشهد|اصفهان|تبریز|شیراز|ایران)/i
        ];

        for (const pattern of locationPatterns) {
            const match = message.match(pattern);
            if (match) {
                const city = match[1].toLowerCase().trim();
                // Return country if mapped, otherwise return as-is
                return cityToCountry[city] || cityToCountry[match[1]] || match[1];
            }
        }
        return null;
    }

    _extractProducts(message) {
        const productKeywords = {
            chicken: ['chicken', 'poultry', 'مرغ', 'طیور'],
            beef: ['beef', 'meat', 'گوشت گاو'],
            fish: ['fish', 'seafood', 'ماهی'],
            dairy: ['milk', 'dairy', 'شیر', 'لبنیات'],
            vegetables: ['vegetable', 'fruit', 'سبزیجات', 'میوه'],
            ice_cream: ['ice cream', 'بستنی']
        };

        const msgLower = message.toLowerCase();
        const found = [];

        for (const [product, keywords] of Object.entries(productKeywords)) {
            for (const keyword of keywords) {
                if (msgLower.includes(keyword)) {
                    found.push(product);
                    break;
                }
            }
        }

        return found.length > 0 ? found : null;
    }

    _extractProjectType(message) {
        for (const [type, langs] of Object.entries(this.projectTypeKeywords)) {
            for (const keywords of Object.values(langs)) {
                for (const keyword of keywords) {
                    if (message.toLowerCase().includes(keyword)) {
                        return type;
                    }
                }
            }
        }
        return null;
    }

    _extractApplicationType(message) {
        for (const [appType, langs] of Object.entries(this.applicationKeywords)) {
            for (const keywords of Object.values(langs)) {
                for (const keyword of keywords) {
                    if (message.toLowerCase().includes(keyword)) {
                        return appType;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Main classification method
     */
    classify(message, conversationContext = {}) {
        const language = this.detectLanguage(message);
        const entities = this.extractEntities(message);

        // Check for confirmation/rejection FIRST if awaiting
        if (conversationContext.awaitingConfirmation) {
            const confirm = this.containsKeywords(message, this.confirmKeywords);
            if (confirm.found) {
                return {
                    intent: 'CONFIRMATION',
                    confidence: 0.95,
                    language,
                    entities,
                    confirmed: true
                };
            }

            const reject = this.containsKeywords(message, this.rejectKeywords);
            if (reject.found) {
                return {
                    intent: 'MODIFICATION',
                    confidence: 0.9,
                    language,
                    entities,
                    confirmed: false
                };
            }
        }

        // Check for greetings (short messages WITHOUT design entities)
        if (message.length < 30) {
            const greeting = this.containsKeywords(message, this.greetingKeywords);
            // ONLY treat as greeting if:
            // 1. Has greeting keywords
            // 2. Does NOT have design entities (dimensions, temps)
            if (greeting.found && !entities.dimensions && !entities.temperatures) {
                return {
                    intent: 'GREETING',
                    confidence: 0.9,
                    language,
                    entities,
                    requiresResponse: true
                };
            }
        }

        // Check if awaiting info - treat as clarification
        if (conversationContext.awaitingInfo) {
            // If message has entities, it's providing info
            const hasEntities = entities.dimensions || entities.temperatures ||
                entities.locations || entities.products ||
                entities.applicationType;

            if (hasEntities) {
                return {
                    intent: 'CLARIFICATION',
                    confidence: 0.85,
                    language,
                    entities,
                    providedInfo: Object.keys(entities).filter(k => entities[k] !== null)
                };
            }
        }

        // Check for design request
        const design = this.containsKeywords(message, this.designKeywords);

        // Check for question BEFORE defaulting to entity-based design detection
        // This ensures "what is R717?" is classified as QUESTION not DESIGN
        const question = this.containsKeywords(message, this.questionKeywords);

        // If has question keywords, treat as question (higher priority)
        if (question.found) {
            return {
                intent: 'QUESTION',
                confidence: 0.88,
                language,
                entities,
                matchedKeyword: question.keyword
            };
        }

        if (design.found) {
            // Calculate how complete the request is
            const completeness = this._calculateCompleteness(entities);

            return {
                intent: 'DESIGN_REQUEST',
                confidence: design.found ? 0.9 : 0.5,
                language,
                entities,
                projectType: entities.projectType || 'refrigeration',
                applicationType: entities.applicationType,
                completeness,
                matchedKeyword: design.keyword
            };
        }

        // Default: if has design-related entities, treat as design request
        // BUT check for question indicators first
        if (entities.dimensions || entities.temperatures) {
            // Check if it looks like a question despite having entities
            const questionIndicators = ['?', 'what', 'how', 'why', 'which', 'چیست', 'چطور', 'چرا'];
            const hasQuestionIndicator = questionIndicators.some(ind =>
                message.toLowerCase().includes(ind.toLowerCase())
            );

            if (hasQuestionIndicator) {
                return {
                    intent: 'QUESTION',
                    confidence: 0.75,
                    language,
                    entities,
                    inferredFromPattern: true
                };
            }

            return {
                intent: 'DESIGN_REQUEST',
                confidence: 0.6,
                language,
                entities,
                completeness: this._calculateCompleteness(entities),
                inferredFromEntities: true
            };
        }

        // Unknown intent
        return {
            intent: 'UNKNOWN',
            confidence: 0.3,
            language,
            entities,
            needsClarification: true
        };
    }

    _calculateCompleteness(entities) {
        const requiredFields = ['dimensions', 'temperatures', 'locations', 'applicationType'];
        let filled = 0;

        for (const field of requiredFields) {
            if (entities[field]) filled++;
        }

        return {
            score: filled / requiredFields.length,
            missing: requiredFields.filter(f => !entities[f]),
            filled: requiredFields.filter(f => entities[f])
        };
    }
}

module.exports = IntentClassifier;
