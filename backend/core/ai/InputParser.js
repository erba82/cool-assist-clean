/**
 * InputParser - Natural Language to Structured Data
 * 
 * Parses user's natural language descriptions and extracts:
 * - Room definitions (dimensions, temperatures)
 * - Product information
 * - Location and climate
 * - Project requirements
 * 
 * @author GFDDE AI Engine
 * @version 2.0.0
 */

class InputParser {
    constructor() {
        // Room type keywords
        this.roomPatterns = {
            chilling: ['چیلینگ', 'chilling', 'خنک‌کن', 'چیل', 'chill'],
            precooler: ['پیش سردکن', 'پیش‌سردکن', 'pre-cool', 'precool', 'پیش سرد'],
            tunnel: ['تونل', 'tunnel', 'انجماد سریع', 'blast', 'iqf'],
            storage: ['نگهداری', 'storage', 'انبار', 'سردخانه', 'cold store'],
            processing: ['فرآوری', 'process', 'بسته‌بندی', 'pack']
        };

        // Temperature patterns
        this.tempPattern = /(-?\d+)\s*(?:درجه|°|degree|c|سانتی)/gi;

        // Dimension patterns (length x width x height or length * width * height)
        this.dimensionPattern = /(\d+(?:\.\d+)?)\s*[×x\*]\s*(\d+(?:\.\d+)?)\s*(?:متر|m|meter)?(?:\s*[×x\*و]\s*(?:ارتفاع\s*)?(\d+(?:\.\d+)?)\s*(?:متر|m|meter)?)?/gi;

        // City patterns for Iran
        this.iranCities = {
            'تهران': 'Tehran', 'اردبیل': 'Ardabil', 'تبریز': 'Tabriz',
            'مشهد': 'Mashhad', 'اصفهان': 'Isfahan', 'شیراز': 'Shiraz',
            'اهواز': 'Ahvaz', 'بندرعباس': 'Bandar Abbas', 'کرج': 'Tehran',
            'قم': 'Tehran', 'رشت': 'Tehran', 'کرمان': 'Isfahan'
        };

        // Refrigerant patterns - COMPREHENSIVE list with user-friendly names
        this.refrigerantPatterns = {
            'R717': ['آمونیاک', 'ammonia', 'nh3', 'r717', 'r-717', 'آمونیک'],
            'R744': ['co2', 'کربن دی اکسید', 'r744', 'r-744', 'carbon dioxide'],
            'R404A': ['r404a', 'r-404a', 'r404', '۴۰۴', 'freon', 'فریون', 'hfc'],
            'R134a': ['r134a', 'r-134a', 'r134', '۱۳۴'],
            'R410A': ['r410a', 'r-410a', 'r410', '۴۱۰'],
            'R32': ['r32', 'r-32', 'difluoromethane'],
            'R507': ['r507', 'r-507', 'r507a'],
            'R290': ['r290', 'r-290', 'propane', 'پروپان'],
            'R22': ['r22', 'r-22', 'فریون ۲۲', 'فریون22', 'hcfc']
        };

        // Product patterns
        this.productPatterns = {
            'chicken': ['مرغ', 'chicken', 'طیور', 'poultry', 'کشتارگاه مرغ'],
            'beef': ['گوشت', 'beef', 'گاو'],
            'fish': ['ماهی', 'fish', 'آبزیان', 'شیلات'],
            'fruit': ['میوه', 'fruit', 'سیب', 'پرتقال'],
            'vegetable': ['سبزی', 'vegetable', 'سبزیجات']
        };
    }

    /**
     * Parse user input into structured project data
     * @param {string} userInput - Natural language description
     * @returns {Object} Structured project data
     */
    async parse(userInput) {
        const project = {
            name: this._extractProjectName(userInput),
            location: this._extractLocation(userInput),
            refrigerant: this._extractRefrigerant(userInput),
            product: this._extractProduct(userInput),
            rooms: this._extractRooms(userInput),
            requirements: this._extractRequirements(userInput),
            designIntent: this._extractDesignIntent(userInput),
            specifiedCoolingLoadKW: this._extractCoolingLoadKW(userInput),
            operatingConditions: this._extractOperatingConditions(userInput),
            parsedAt: new Date().toISOString()
        };

        // Validate and set defaults
        project.rooms = project.rooms.length > 0 ? project.rooms : this._getDefaultRoom();
        if (Number.isFinite(project.specifiedCoolingLoadKW) && project.specifiedCoolingLoadKW > 0) {
            project.capacity = project.specifiedCoolingLoadKW;
            if (project.rooms.length === 1) {
                project.rooms[0] = {
                    ...project.rooms[0],
                    specifiedCoolingLoadKW: project.specifiedCoolingLoadKW,
                    designLoadBasis: 'user-specified'
                };
            }
        }
        // project.refrigerant = project.refrigerant || 'R717'; // Let Orchestrator handle defaults/recommendations

        return project;
    }

    _extractProjectName(input) {
        // Look for project name patterns
        const patterns = [
            /پروژه\s+([^\n,،]+)/i,
            /نام پروژه\s*:?\s*([^\n,،]+)/i,
            /project\s*:?\s*([^\n,،]+)/i,
            /کشتارگاه\s+([^\n,،]+)/i,
            /سردخانه\s+([^\n,،]+)/i
        ];

        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match) return match[1].trim();
        }

        return 'New Project';
    }

    _extractLocation(input) {
        // Check for Iranian cities
        for (const [persian, english] of Object.entries(this.iranCities)) {
            if (input.includes(persian)) {
                return { city: english, country: 'Iran' };
            }
        }

        // Check for English city names
        const cities = ['Tehran', 'Ardabil', 'Tabriz', 'Mashhad', 'Dubai', 'Berlin'];
        for (const city of cities) {
            if (input.toLowerCase().includes(city.toLowerCase())) {
                return { city: city, country: this._getCountry(city) };
            }
        }

        return { city: 'Tehran', country: 'Iran' };  // Default
    }

    _getCountry(city) {
        const cityCountry = {
            'Tehran': 'Iran', 'Ardabil': 'Iran', 'Dubai': 'UAE',
            'Berlin': 'Germany', 'New York': 'USA'
        };
        return cityCountry[city] || 'Iran';
    }

    _extractRefrigerant(input) {
        for (const [code, patterns] of Object.entries(this.refrigerantPatterns)) {
            for (const pattern of patterns) {
                if (input.toLowerCase().includes(pattern.toLowerCase())) {
                    return code;
                }
            }
        }
        return null;  // Return null if no matches found (don't default to R717 yet)
    }

    _extractProduct(input) {
        for (const [type, patterns] of Object.entries(this.productPatterns)) {
            for (const pattern of patterns) {
                if (input.toLowerCase().includes(pattern.toLowerCase())) {
                    return { type: type };
                }
            }
        }
        return { type: 'chicken' };  // Default
    }

    _extractCompactAreaRooms(input) {
        const rooms = [];
        const normalized = String(input || '');
        const heightMatch = normalized.match(/(?:each\s+)?(\d+(?:\.\d+)?)\s*(?:m|meters?)\s*(?:high|height)/i);
        const height = heightMatch ? parseFloat(heightMatch[1]) : 6;
        const roomPattern = /(?:a|an|one)?\s*(\d+(?:\.\d+)?)\s*(?:m²|m2|sqm|square\s*meters?)\s*(chilled|chill(?:ing)?|freezer|frozen|cold\s*storage)\s*(?:room)?\s*(?:at|for)?\s*([+-]?\d+)\s*(?:°\s*c|°c|c|degrees?)/gi;
        let match;
        while ((match = roomPattern.exec(normalized)) !== null) {
            const area = parseFloat(match[1]);
            const descriptor = match[2].toLowerCase();
            const length = Math.max(2, Math.round(Math.sqrt(area) * 10) / 10);
            const width = Math.max(2, Math.round((area / length) * 10) / 10);
            rooms.push({
                name: descriptor.includes('freez') || descriptor.includes('frozen') ? `Freezer ${rooms.length + 1}` : `Chilled Room ${rooms.length + 1}`,
                type: descriptor.includes('freez') || descriptor.includes('frozen') ? 'freezer' : 'chilling',
                length,
                width,
                height,
                temperature: parseInt(match[3], 10),
                area
            });
        }
        return rooms;
    }
    _extractDesignIntent(input) {
        const text = String(input || '').toLowerCase();
        const normalized = text.replace(/[\u200c\s-]+/g, ' ');
        const wordToNumber = { one: 1, two: 2, three: 3, four: 4 };
        const quantityMatch = text.match(/(?:use\s+)?(\d+|one|two|three|four)\s+(?:parallel\s+)?(?:industrial\s+)?(?:screw|reciprocating|piston)\s+compressors?/i);
        const rawCount = quantityMatch ? quantityMatch[1].toLowerCase() : null;
        const compressorCount = rawCount ? (wordToNumber[rawCount] || parseInt(rawCount, 10)) : null;
        const compressorType = /screw\s+compressor|screw\b|اسکرو/.test(normalized) ? 'screw' : /reciprocating|piston|پیستونی/.test(normalized) ? 'reciprocating' : /scroll/.test(normalized) ? 'scroll' : null;
        const condenserType = /air[\s-]*cooled|air condenser|کندانسور هوایی/.test(normalized) ? 'air_cooled_condenser' : /evaporative|تبخیری/.test(normalized) ? 'evaporative_condenser' : null;
        const feedMethod = /pumped[\s-]*(?:recirculation|recirc|overfeed)|liquid recirculation|پمپ[\s-]*(?:آمونیاک|مایع)|ریسیرکوله|سیرکولاسیون/.test(normalized) ? 'pumped_recirculated' : /gravity[\s-]*(?:fed|flooded)|ثقلی/.test(normalized) ? 'gravity_flooded' : /direct[\s-]*expansion|\bdx\b|انبساط مستقیم/.test(normalized) ? 'direct_expansion' : null;
        const thermosiphon = /thermosiphon|ترموسیفون/.test(normalized);
        const ammoniaValveStation = /danfoss[\s-]*icf|\bicf\b|valve[\s-]*station|ولو[\s-]*استیشن|ایستگاه[\s-]*شیر/.test(normalized);
        return {
            compressorType,
            compressorCount: Number.isFinite(compressorCount) ? compressorCount : null,
            parallel: /parallel\s+(?:screw|reciprocating|piston)\s+compressors?/.test(text),
            condenserType,
            feedMethod,
            thermosiphon,
            ammoniaValveStation,
            roofCondenser: condenserType === 'evaporative_condenser' && /roof|roof top|بام|سقف/.test(normalized),
            horizontalReceiver: /horizontal\s+(?:high[-\s]*pressure\s+)?receiver|رسیور افقی/.test(normalized),
            liquidPump: feedMethod === 'pumped_recirculated',
            oilSeparator: /oil\s+separator|اویل سپراتور|جداکننده روغن/.test(normalized),
            checkValves: /check\s+valves?/.test(text),
            strainers: /y[-\s]*strainers?/.test(text),
            globeValves: /globe\s+valves?/.test(text),
            expansionValves: /expansion\s+valves?/.test(text)
        };
    }    _extractRooms(input) {
        const compactAreaRooms = this._extractCompactAreaRooms(input);
        if (compactAreaRooms.length) return compactAreaRooms;
        const rooms = [];

        // ============================================================
        // PRIORITY: Check for CAPACITY-BASED INPUT FIRST!
        // Pattern: "1500 ton", "cold storage 1500 ton -18c", etc.
        // This MUST be checked BEFORE other patterns!
        // ============================================================
        const capacityMatch = input.match(/(\d+)\s*(?:ton|tons|tonne|tonnes|تن)/i);
        if (capacityMatch) {
            const capacityTons = parseInt(capacityMatch[1]);
            if (capacityTons > 0) {
                // Volume = capacity × 5.56 m³ (300 kg/m³ density, 60% utilization)
                const volumeNeeded = capacityTons * 5.56;
                const height = capacityTons > 500 ? 9 : capacityTons > 100 ? 7 : 5;
                const floorArea = volumeNeeded / height;
                const side = Math.sqrt(floorArea);
                const length = Math.ceil(side * 1.2);
                const width = Math.ceil(side / 1.2);

                // Extract temperature if available
                const tempMatch = input.match(/(-?\d+)\s*(?:°|degree|c|درجه)/i);
                const temperature = tempMatch ? parseInt(tempMatch[1]) : -18;

                console.log(`📦 CAPACITY DETECTED: ${capacityTons} tons → ${length}×${width}×${height}m = ${length * width * height}m³`);

                rooms.push({
                    name: `Cold Storage (${capacityTons} ton)`,
                    type: 'storage',
                    length: length,
                    width: width,
                    height: height,
                    temperature: temperature,
                    capacity: capacityTons,
                    dailyThroughput: Math.round(capacityTons * 0.05 * 1000)
                });

                // Return immediately - capacity-based input takes priority!
                return rooms;
            }
        }

        // Enhanced English patterns for room extraction with counts
        // Pattern: "N room_type rooms with dimensions of LxW meters and a height of H meters for ... temperature of -X degrees"
        const englishRoomPatterns = [
            // Pattern: "4 freezing tunnel rooms with dimensions of 4 x 4 meters each and a height of 4 meters for a temperature of -40 degrees"
            /(\d+)\s+(freezing\s+tunnel|blast\s+freez(?:er|ing)|iqf|tunnel)\s+rooms?\s+with\s+dimensions?\s+of\s+(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*(?:meters?)?\s*(?:each)?\s*(?:and\s+)?(?:a\s+)?height\s+of\s+(\d+(?:\.\d+)?)\s*(?:meters?)?\s*(?:for\s+)?(?:a\s+)?temperature\s+of\s+(-?\d+)/gi,

            // Pattern: "4 storage rooms with dimensions of 20 x 15 meters each and a height of 9 meters at a temperature of -18 degrees"
            /(\d+)\s+(storage|holding|cold\s+store)\s+rooms?\s+with\s+dimensions?\s+of\s+(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*(?:meters?)?\s*(?:each)?\s*(?:and\s+)?(?:a\s+)?height\s+of\s+(\d+(?:\.\d+)?)\s*(?:meters?)?\s*(?:at\s+)?(?:a\s+)?temperature\s+of\s+(-?\d+)/gi,

            // Pattern: "4 pre-cooling rooms with dimensions of 8 x 10 meters each and a height of 9 meters and a temperature of -5 degrees"
            /(\d+)\s+(pre-?cool(?:ing)?|precool)\s+rooms?\s+with\s+dimensions?\s+of\s+(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*(?:meters?)?\s*(?:each)?\s*(?:and\s+)?(?:a\s+)?height\s+of\s+(\d+(?:\.\d+)?)\s*(?:meters?)?\s*(?:and\s+)?(?:a\s+)?temperature\s+of\s+(-?\d+)/gi,

            // Pattern: "a chilling room with dimensions of 20 x 8 meters and a height of 4 meters for a temperature of -5 degrees"
            /(?:a\s+|one\s+)?(chill(?:ing)?|chill\s+room)\s+(?:room\s+)?with\s+dimensions?\s+of\s+(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*(?:meters?)?\s*(?:and\s+)?(?:a\s+)?height\s+of\s+(\d+(?:\.\d+)?)\s*(?:meters?)?\s*(?:for\s+)?(?:a\s+)?temperature\s+of\s+(-?\d+)/gi
        ];

        // Process English patterns
        for (const pattern of englishRoomPatterns) {
            let match;
            while ((match = pattern.exec(input)) !== null) {
                // Determine if this pattern has count or not
                const hasCount = match.length === 7; // 6 capture groups + full match

                let count, roomTypeName, length, width, height, temp;

                if (hasCount) {
                    count = parseInt(match[1]);
                    roomTypeName = match[2].toLowerCase();
                    length = parseFloat(match[3]);
                    width = parseFloat(match[4]);
                    height = parseFloat(match[5]);
                    temp = parseInt(match[6]);
                } else {
                    count = 1;
                    roomTypeName = match[1].toLowerCase();
                    length = parseFloat(match[2]);
                    width = parseFloat(match[3]);
                    height = parseFloat(match[4]);
                    temp = parseInt(match[5]);
                }

                // Map room type
                const roomType = this._getRoomTypeFromEnglish(roomTypeName);

                // Add rooms based on count
                for (let i = 0; i < count; i++) {
                    const roomName = count > 1
                        ? `${this._capitalizeRoomType(roomTypeName)} ${i + 1}`
                        : this._capitalizeRoomType(roomTypeName);

                    rooms.push({
                        name: roomName,
                        type: roomType,
                        length: length,
                        width: width,
                        height: height,
                        temperature: temp
                    });
                }
            }
        }

        // If no English patterns matched, try Persian patterns
        if (rooms.length === 0) {
            const lines = input.split(/[،,\n]/);
            for (const line of lines) {
                const room = this._parseRoomLine(line);
                if (room) rooms.push(room);
            }

            // Also try Persian count patterns
            const countPatterns = [
                /(\d+)\s*(?:سالن|اتاق|واحد)\s+([^\d]+?)\s*(?:با ابعاد|به ابعاد)?\s*(\d+)[×x\*](\d+)/gi,
                /(\d+)\s*(?:سالن|اتاق)\s*(نگهداری|تونل|پیش سردکن|چیلینگ)/gi
            ];

            for (const pattern of countPatterns) {
                let match;
                while ((match = pattern.exec(input)) !== null) {
                    const count = parseInt(match[1]);
                    const roomType = this._getRoomType(match[2] || '');

                    const existingCount = rooms.filter(r => r.type === roomType).length;
                    if (existingCount < count) {
                        for (let i = existingCount; i < count; i++) {
                            const dims = this._findDimensionsNear(input, match.index);
                            const temp = this._findTemperatureNear(input, match.index);
                            rooms.push({
                                name: `${match[2]} ${i + 1}`,
                                type: roomType,
                                length: dims?.length || 10,
                                width: dims?.width || 10,
                                height: dims?.height || 4,
                                temperature: temp || this._getDefaultTemp(roomType)
                            });
                        }
                    }
                }
            }
        }

        // ============================================================
        // CAPACITY-BASED INPUT (e.g., "1500 ton", "2000 تن")
        // Calculate room dimensions from storage tonnage
        // ============================================================
        if (rooms.length === 0) {
            const capacityPatterns = [
                /(\d+)\s*(?:ton|tons|tonne|tonnes|تن)/gi,
                /(?:cold\s*)?storage\s*(\d+)\s*(?:ton|tons)/gi
            ];

            for (const pattern of capacityPatterns) {
                const match = pattern.exec(input);
                if (match) {
                    const capacityTons = parseInt(match[1]);
                    if (capacityTons > 0) {
                        // Volume needed = capacity × 5.56 m³ (300 kg/m³ density, 60% utilization)
                        const volumeNeeded = capacityTons * 5.56;
                        const height = capacityTons > 500 ? 9 : capacityTons > 100 ? 7 : 5;
                        const floorArea = volumeNeeded / height;
                        const side = Math.sqrt(floorArea);
                        const length = Math.ceil(side * 1.2);
                        const width = Math.ceil(side / 1.2);

                        // Extract temperature if available
                        const tempMatch = input.match(/(-?\d+)\s*(?:°|degree|درجه|c)/i);
                        const temperature = tempMatch ? parseInt(tempMatch[1]) : -18;

                        console.log(`📦 Capacity: ${capacityTons} tons → ${length}×${width}×${height}m`);

                        rooms.push({
                            name: `Cold Storage (${capacityTons} ton)`,
                            type: 'storage',
                            length: length,
                            width: width,
                            height: height,
                            temperature: temperature,
                            capacity: capacityTons,
                            dailyThroughput: Math.round(capacityTons * 0.05 * 1000)
                        });
                        break;
                    }
                }
            }
        }

        return rooms;
    }

    _getRoomTypeFromEnglish(text) {
        const textLower = text.toLowerCase();
        if (textLower.includes('chill')) return 'chilling';
        if (textLower.includes('pre') && textLower.includes('cool')) return 'precooler';
        if (textLower.includes('tunnel') || textLower.includes('blast') || textLower.includes('freez') || textLower.includes('iqf')) return 'tunnel';
        if (textLower.includes('storage') || textLower.includes('holding') || textLower.includes('cold store')) return 'storage';
        if (textLower.includes('process')) return 'processing';
        return 'storage';
    }

    _capitalizeRoomType(text) {
        return text.split(/[\s-]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    _parseRoomLine(line) {
        // Check if line contains room info
        let roomType = null;
        for (const [type, patterns] of Object.entries(this.roomPatterns)) {
            for (const pattern of patterns) {
                if (line.toLowerCase().includes(pattern.toLowerCase())) {
                    roomType = type;
                    break;
                }
            }
            if (roomType) break;
        }

        if (!roomType) return null;

        // Extract dimensions
        const dims = this._extractDimensions(line);

        // Extract temperature
        const temp = this._extractTemperature(line);

        if (!dims && !temp) return null;

        return {
            name: this._cleanRoomName(line.substring(0, 50)),
            type: roomType,
            length: dims?.length || 10,
            width: dims?.width || 10,
            height: dims?.height || 4,
            temperature: temp || this._getDefaultTemp(roomType)
        };
    }

    _extractDimensions(text) {
        // Updated regex to support: 'and a height of', 'x', 'height'
        const match = text.match(/(\d+(?:\.\d+)?)\s*[×x\*]\s*(\d+(?:\.\d+)?)\s*(?:m|meters?|متر)?(?:(?:\s*[×x\*]|(?:\s+(?:and|with|,|a)?\s+(?:a\s+)?height(?:\s+of)?\s*)|\s+h\s+|(?:\s*[و]\s*(?:ارتفاع\s*)?))\s*(\d+(?:\.\d+)?)\s*(?:m|meters?|متر)?)?/i);

        if (match) {
            return {
                length: parseFloat(match[1]),
                width: parseFloat(match[2]),
                height: match[3] ? parseFloat(match[3]) : 4
            };
        }
        return null;
    }

    _extractTemperature(text) {
        const match = text.match(/(-?\d+)\s*(?:درجه|°|degree)/i);
        if (match) return parseInt(match[1]);

        // Look for specific patterns
        if (text.includes('-40')) return -40;
        if (text.includes('-35')) return -35;
        if (text.includes('-25')) return -25;
        if (text.includes('-18')) return -18;
        if (text.includes('-5')) return -5;

        return null;
    }

    _findDimensionsNear(text, position) {
        // Look for dimensions near this position in text
        const nearText = text.substring(Math.max(0, position - 100), position + 200);
        return this._extractDimensions(nearText);
    }

    _findTemperatureNear(text, position) {
        const nearText = text.substring(Math.max(0, position - 100), position + 200);
        return this._extractTemperature(nearText);
    }

    _getRoomType(text) {
        for (const [type, patterns] of Object.entries(this.roomPatterns)) {
            for (const pattern of patterns) {
                if (text.toLowerCase().includes(pattern.toLowerCase())) {
                    return type;
                }
            }
        }
        return 'storage';
    }

    _getDefaultTemp(roomType) {
        const defaults = {
            chilling: -5,
            precooler: -5,
            tunnel: -40,
            storage: -18,
            processing: 0
        };
        return defaults[roomType] || -18;
    }

    _cleanRoomName(text) {
        return text
            .replace(/با ابعاد.*/i, '')
            .replace(/به ابعاد.*/i, '')
            .replace(/برای دمای.*/i, '')
            .replace(/[،,]/g, '')
            .trim()
            .substring(0, 30);
    }

    _getDefaultRoom() {
        return [{
            name: 'Cold Storage',
            type: 'storage',
            length: 20,
            width: 15,
            height: 6,
            temperature: -18
        }];
    }

    _extractCoolingLoadKW(input) {
        const match = String(input || '').match(/(?:design\s*)?(?:cooling\s*)?load\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:kW|kw|kilowatts?)/i);
        const value = match ? Number(match[1]) : null;
        return Number.isFinite(value) && value > 0 ? value : null;
    }
    _extractOperatingConditions(input) {
        const text = String(input || '');
        const parseTemperature = (expression) => {
            const match = text.match(expression);
            const value = match ? Number(match[1]) : null;
            return Number.isFinite(value) ? value : null;
        };
        const evaporatingTemperatureC = parseTemperature(/(?:evaporating|evaporation|evap)\s*(?:temperature|temp)?\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:°\s*C|°C|C|degrees?\s*C)?/i);
        const condensingTemperatureC = parseTemperature(/(?:condensing|condensation|cond)\s*(?:temperature|temp)?\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:°\s*C|°C|C|degrees?\s*C)?/i);
        return {
            evaporatingTemperatureC,
            condensingTemperatureC,
            source: evaporatingTemperatureC !== null || condensingTemperatureC !== null ? 'user-specified' : null
        };
    }
    _extractRequirements(input) {
        const requirements = [];

        if (input.includes('ایمنی') || input.includes('safety')) {
            requirements.push('safety_analysis');
        }
        if (input.includes('بهینه') || input.includes('optim')) {
            requirements.push('energy_optimization');
        }
        if (input.includes('نقشه') || input.includes('P&ID') || input.includes('diagram')) {
            requirements.push('pid_diagram');
        }
        if (input.includes('دفترچه') || input.includes('گزارش') || input.includes('report')) {
            requirements.push('calculation_report');
        }

        return requirements;
    }
}

module.exports = InputParser;
