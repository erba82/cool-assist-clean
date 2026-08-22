/**
 * Required Information Validator
 * Validates if all required info is present for refrigeration design
 * Generates questions for missing fields in user's language
 */

class RequiredInfoValidator {
    constructor() {
        // Define required fields for refrigeration design
        this.requiredFields = {
            location: {
                required: true,
                priority: 1,
                questions: {
                    en: 'What is the project location (city/country)?',
                    fa: 'محل پروژه کجاست (شهر/کشور)؟',
                    ar: 'ما هو موقع المشروع (المدينة/الدولة)؟'
                },
                placeholder: {
                    en: 'e.g., Tehran, Iran',
                    fa: 'مثال: تهران، ایران',
                    ar: 'مثال: دبي، الإمارات'
                }
            },
            projectName: {
                required: false,
                priority: 10,
                autoGenerate: true,
                questions: {
                    en: 'What would you like to name this project?',
                    fa: 'نام پروژه چه باشد؟',
                    ar: 'ما هو اسم المشروع؟'
                }
            },
            applicationType: {
                required: true,
                priority: 2,
                questions: {
                    en: 'What type of facility is this?',
                    fa: 'نوع کاربری پروژه چیست؟',
                    ar: 'ما هو نوع المنشأة؟'
                },
                options: [
                    { id: 'cold_storage_frozen', en: 'Frozen Cold Storage (-18°C to -25°C)', fa: 'سردخانه زیرصفر (منجمد)', ar: 'تخزين مجمد' },
                    { id: 'cold_storage_chilled', en: 'Chilled Cold Storage (+2°C to +8°C)', fa: 'سردخانه بالای صفر (خنک)', ar: 'تخزين مبرد' },
                    { id: 'dairy_factory', en: 'Dairy Factory', fa: 'کارخانه لبنیات', ar: 'مصنع ألبان' },
                    { id: 'ice_cream_factory', en: 'Ice Cream Factory', fa: 'کارخانه بستنی', ar: 'مصنع آيس كريم' },
                    { id: 'iqf_frozen', en: 'IQF Frozen Products', fa: 'محصولات منجمد IQF', ar: 'منتجات IQF مجمدة' },
                    { id: 'spiral_tunnel', en: 'Spiral Tunnel Freezer', fa: 'تونل اسپیرال', ar: 'نفق حلزوني' },
                    { id: 'fish_shrimp', en: 'Fish & Seafood Storage', fa: 'سردخانه ماهی و میگو', ar: 'تخزين الأسماك' },
                    { id: 'meat_processing', en: 'Meat Processing / Slaughterhouse', fa: 'فرآوری گوشت / کشتارگاه', ar: 'تصنيع اللحوم' },
                    { id: 'blast_tunnel', en: 'Blast Freezer Tunnel', fa: 'تونل انجماد سریع', ar: 'نفق تجميد سريع' },
                    { id: 'other', en: 'Other (please specify)', fa: 'سایر (توضیح دهید)', ar: 'أخرى' }
                ]
            },
            dimensions: {
                required: true,
                priority: 3,
                questions: {
                    en: 'What are the dimensions of the cold room(s)?',
                    fa: 'ابعاد فضاها چقدر است؟',
                    ar: 'ما هي أبعاد الغرف الباردة؟'
                },
                placeholder: {
                    en: 'e.g., 10m x 15m x 5m (L x W x H)',
                    fa: 'مثال: 10 × 15 × 5 متر (طول × عرض × ارتفاع)',
                    ar: 'مثال: 10 × 15 × 5 متر'
                },
                format: 'LxWxH in meters'
            },
            temperature: {
                required: true,
                priority: 4,
                questions: {
                    en: 'What is the target storage/operating temperature?',
                    fa: 'دمای نگهداری یا عملیاتی چند درجه است؟',
                    ar: 'ما هي درجة حرارة التشغيل المطلوبة؟'
                },
                placeholder: {
                    en: 'e.g., -18°C for frozen, +4°C for chilled',
                    fa: 'مثال: -۱۸ درجه برای منجمد، +۴ درجه برای خنک',
                    ar: 'مثال: -18 درجة للمجمد'
                }
            },
            productType: {
                required: true,
                priority: 5,
                questions: {
                    en: 'What product(s) will be stored?',
                    fa: 'چه محصولی نگهداری می‌شود؟',
                    ar: 'ما هي المنتجات المخزنة؟'
                },
                placeholder: {
                    en: 'e.g., chicken, beef, dairy, vegetables',
                    fa: 'مثال: مرغ، گوشت، لبنیات، سبزیجات',
                    ar: 'مثال: دجاج، لحم، خضروات'
                }
            },
            refrigerantType: {
                required: false,
                priority: 6,
                autoRecommend: true,
                questions: {
                    en: 'Do you have a refrigerant preference?',
                    fa: 'نوع مبرد خاصی مدنظرتان هست؟',
                    ar: 'هل لديك تفضيل لمادة التبريد؟'
                },
                options: [
                    { id: 'auto', en: 'Let system recommend', fa: 'سیستم پیشنهاد دهد', ar: 'دع النظام يوصي' },
                    { id: 'ammonia', en: 'Ammonia (NH₃)', fa: 'آمونیاک (NH₃)', ar: 'أمونيا' },
                    { id: 'r404a', en: 'R-404A (HFC)', fa: 'R-404A (فریون)', ar: 'R-404A' },
                    { id: 'r134a', en: 'R-134a', fa: 'R-134a', ar: 'R-134a' },
                    { id: 'co2', en: 'CO₂ (R-744)', fa: 'CO₂ (دی‌اکسیدکربن)', ar: 'CO₂' },
                    { id: 'cascade', en: 'CO₂/NH₃ Cascade', fa: 'سیستم ترکیبی CO₂/NH₃', ar: 'نظام متعدد' }
                ]
            },
            wallMaterial: {
                required: false,
                priority: 7,
                autoRecommend: true,
                questions: {
                    en: 'What wall panel material should be used?',
                    fa: 'متریال دیواره‌ها چه باشد؟',
                    ar: 'ما هي مادة الألواح؟'
                },
                options: [
                    { id: 'auto', en: 'Let system recommend based on climate', fa: 'سیستم بر اساس آب و هوا پیشنهاد دهد', ar: 'دع النظام يوصي' },
                    { id: 'pu_80', en: 'PU Panel 80mm', fa: 'پنل پلی‌اورتان 80 میلی‌متر', ar: 'لوحة PU 80 مم' },
                    { id: 'pu_100', en: 'PU Panel 100mm', fa: 'پنل پلی‌اورتان 100 میلی‌متر', ar: 'لوحة PU 100 مم' },
                    { id: 'pu_120', en: 'PU Panel 120mm', fa: 'پنل پلی‌اورتان 120 میلی‌متر', ar: 'لوحة PU 120 مم' },
                    { id: 'pu_150', en: 'PU Panel 150mm', fa: 'پنل پلی‌اورتان 150 میلی‌متر', ar: 'لوحة PU 150 مم' }
                ]
            },
            // Room count - REQUIRED when capacity > 500 tons
            roomCount: {
                required: false,  // Dynamically becomes required based on capacity
                priority: 2.5,    // After applicationType, before dimensions
                conditionallyRequired: true,
                questions: {
                    en: 'How many cold rooms do you want to divide this capacity into?',
                    fa: 'این ظرفیت را در چند اتاق (سالن) می‌خواهید تقسیم کنید؟',
                    ar: 'كم عدد الغرف الباردة التي تريد تقسيم هذه السعة إليها؟'
                },
                placeholder: {
                    en: 'e.g., 3 rooms',
                    fa: 'مثال: 3 سالن',
                    ar: 'مثال: 3 غرف'
                }
            }
        };

        // Application type defaults
        this.applicationDefaults = {
            cold_storage_frozen: { tempRange: [-25, -18], defaultTemp: -20, loadFactor: 1.0 },
            cold_storage_chilled: { tempRange: [0, 8], defaultTemp: 4, loadFactor: 0.7 },
            dairy_factory: { tempRange: [2, 6], defaultTemp: 4, loadFactor: 1.2 },
            ice_cream_factory: { tempRange: [-30, -25], defaultTemp: -28, loadFactor: 1.3 },
            iqf_frozen: { tempRange: [-40, -35], defaultTemp: -38, loadFactor: 1.5 },
            spiral_tunnel: { tempRange: [-40, -35], defaultTemp: -35, loadFactor: 1.8 },
            fish_shrimp: { tempRange: [-25, -20], defaultTemp: -22, loadFactor: 1.1 },
            meat_processing: { tempRange: [-25, -18], defaultTemp: -20, loadFactor: 1.0 },
            blast_tunnel: { tempRange: [-40, -35], defaultTemp: -35, loadFactor: 1.4 }
        };
    }

    /**
     * Validate parsed input against required fields
     */
    validate(parsedInput) {
        const missing = [];
        const filled = [];
        const optional = [];
        const canAutoFill = [];

        for (const [field, config] of Object.entries(this.requiredFields)) {
            const value = this._getFieldValue(parsedInput, field);

            if (this._hasValue(value)) {
                filled.push({ field, value, config });
            } else if (config.required) {
                missing.push({ field, config, priority: config.priority });
            } else if (config.autoRecommend || config.autoGenerate) {
                canAutoFill.push({ field, config });
            } else {
                optional.push({ field, config });
            }
        }

        // Sort missing by priority
        missing.sort((a, b) => a.priority - b.priority);

        return {
            isComplete: missing.length === 0,
            completenessScore: filled.length / Object.values(this.requiredFields).filter((config) => config.required).length,
            missing,
            filled,
            optional,
            canAutoFill,
            nextQuestion: missing.length > 0 ? missing[0] : null
        };
    }

    _hasValue(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        return true;
    }

    _getFieldValue(input, field) {
        // Map field names to explicit parsed input. Empty arrays and default values
        // do not satisfy a required engineering intake field.
        const fieldMappings = {
            location: () => input.location || input.project?.location || input.entities?.locations,
            projectName: () => input.projectName || input.project?.name,
            applicationType: () => input.applicationType || input.entities?.applicationType,
            dimensions: () => input.dimensions || input.entities?.dimensions || (Array.isArray(input.rooms) && input.rooms.length ? input.rooms : null),
            temperature: () => input.temperature ?? input.operatingConditions?.storageTemperatureC ?? input.entities?.temperatures?.[0] ?? (Array.isArray(input.rooms) && input.rooms.length ? input.rooms[0]?.temperature : null),
            productType: () => input.productType || input.product?.type || input.entities?.products,
            refrigerantType: () => input.refrigerant || input.refrigerantType,
            wallMaterial: () => input.wallMaterial || input.panelThickness
        };

        const getter = fieldMappings[field];
        return getter ? getter() : null;
    }

    /**
     * Generate question for a missing field
     */
    generateQuestion(field, language = 'en') {
        const config = this.requiredFields[field];
        if (!config) return null;

        const question = {
            field,
            text: config.questions[language] || config.questions.en,
            type: config.options ? 'select' : 'text',
            required: config.required,
            priority: config.priority
        };

        if (config.options) {
            question.options = config.options.map(opt => ({
                id: opt.id,
                label: opt[language] || opt.en
            }));
        }

        if (config.placeholder) {
            question.placeholder = config.placeholder[language] || config.placeholder.en;
        }

        return question;
    }

    /**
     * Generate all missing questions at once
     */
    generateMissingQuestions(parsedInput, language = 'en') {
        const validation = this.validate(parsedInput);

        if (validation.isComplete) {
            return { complete: true, questions: [] };
        }

        const questions = validation.missing.map(m => this.generateQuestion(m.field, language));

        return {
            complete: false,
            completenessScore: validation.completenessScore,
            questions,
            filledFields: validation.filled.map(f => f.field),
            summary: this._generateSummary(validation.filled, language)
        };
    }

    _generateSummary(filledFields, language) {
        if (filledFields.length === 0) return null;

        const summaries = {
            en: 'Information received:',
            fa: 'اطلاعات دریافت شده:',
            ar: 'المعلومات المستلمة:'
        };

        let summary = summaries[language] || summaries.en;

        for (const item of filledFields) {
            summary += `\n• ${item.field}: ${JSON.stringify(item.value)}`;
        }

        return summary;
    }

    /**
     * Get default values for an application type
     */
    getApplicationDefaults(applicationType) {
        return this.applicationDefaults[applicationType] || this.applicationDefaults.cold_storage_frozen;
    }

    /**
     * Auto-generate project name if not provided
     */
    generateProjectName(parsedInput) {
        const location = parsedInput.location || 'Project';
        const appType = parsedInput.applicationType || 'cold_storage';
        const timestamp = new Date().toISOString().slice(0, 10);

        const appNames = {
            cold_storage_frozen: 'Frozen Storage',
            cold_storage_chilled: 'Chilled Storage',
            dairy_factory: 'Dairy',
            ice_cream_factory: 'Ice Cream',
            iqf_frozen: 'IQF',
            spiral_tunnel: 'Spiral Tunnel',
            fish_shrimp: 'Seafood',
            meat_processing: 'Meat Processing',
            blast_tunnel: 'Blast Freezer'
        };

        const appName = appNames[appType] || 'Cold Storage';
        return `${location} ${appName} - ${timestamp}`;
    }

    /**
     * Suggest optimal room count based on capacity
     * Rule: 400-600 tons per room is optimal for cold storage
     * @param {number} capacityTons - Total storage capacity in tons
     * @returns {Object} Suggestion with recommended count and options
     */
    suggestRoomCount(capacityTons) {
        if (capacityTons <= 500) {
            return {
                needsQuestion: false,
                suggestedCount: 1,
                message: null
            };
        }

        // Optimal capacity per room: 400-600 tons
        const optimalPerRoom = 500;
        const suggestedCount = Math.ceil(capacityTons / optimalPerRoom);
        const capacityPerRoom = Math.ceil(capacityTons / suggestedCount);

        return {
            needsQuestion: true,
            suggestedCount,
            capacityPerRoom,
            minRooms: Math.ceil(capacityTons / 600),
            maxRooms: Math.ceil(capacityTons / 300),
            message: {
                en: `For ${capacityTons} tons capacity, we recommend ${suggestedCount} rooms (approximately ${capacityPerRoom} tons each). How many rooms do you prefer?`,
                fa: `برای ظرفیت ${capacityTons} تن، پیشنهاد می‌کنیم ${suggestedCount} سالن (هر کدام تقریباً ${capacityPerRoom} تن). چند سالن می‌خواهید؟`,
                ar: `لسعة ${capacityTons} طن، نوصي بـ ${suggestedCount} غرف (حوالي ${capacityPerRoom} طن لكل غرفة). كم غرفة تفضل؟`
            }
        };
    }

    /**
     * Generate room count question with suggestion
     */
    generateRoomCountQuestion(capacityTons, language = 'en') {
        const suggestion = this.suggestRoomCount(capacityTons);

        if (!suggestion.needsQuestion) {
            return null;
        }

        return {
            field: 'roomCount',
            type: 'room_count_suggestion',
            text: suggestion.message[language] || suggestion.message.en,
            suggestedCount: suggestion.suggestedCount,
            capacityPerRoom: suggestion.capacityPerRoom,
            totalCapacity: capacityTons,
            options: this._generateRoomCountOptions(suggestion.suggestedCount, suggestion.minRooms, suggestion.maxRooms)
        };
    }

    _generateRoomCountOptions(suggested, min, max) {
        const options = [];
        for (let i = min; i <= max; i++) {
            options.push({
                value: i,
                isRecommended: i === suggested
            });
        }
        return options;
    }
}

module.exports = RequiredInfoValidator;
