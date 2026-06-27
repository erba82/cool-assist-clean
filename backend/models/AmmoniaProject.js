const mongoose = require('mongoose');

const AmmoniaProjectSchema = new mongoose.Schema({
    // Basic project information
    projectInfo: {
        name: { type: String, required: true },
        client: String,
        location: {
            city: String,
            country: String,
            coordinates: {
                lat: Number,
                lng: Number
            }
        },
        designer: String,
        date: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ['draft', 'in_progress', 'review', 'approved', 'completed'],
            default: 'draft'
        }
    },

    // Current phase of the project
    currentPhase: {
        type: String,
        enum: [
            'data_collection',
            'load_calculation',
            'equipment_selection',
            'calculation_book',
            'pid_drawing',
            'wiring_diagram',
            'plc_programming',
            'completed'
        ],
        default: 'data_collection'
    },

    // Phase completion status
    phaseCompletion: {
        dataCollection: { type: Boolean, default: false },
        loadCalculation: { type: Boolean, default: false },
        equipmentSelection: { type: Boolean, default: false },
        calculationBook: { type: Boolean, default: false },
        pidDrawing: { type: Boolean, default: false },
        wiringDiagram: { type: Boolean, default: false },
        plcProgramming: { type: Boolean, default: false }
    },

    // Design data collected from user
    designData: {
        // Ambient conditions
        ambient: {
            summerTemp: Number,
            winterTemp: Number,
            humidity: Number,
            elevation: Number
        },

        // Cold storage rooms
        rooms: [{
            id: String,
            name: String,
            dimensions: {
                length: Number, // meters
                width: Number,
                height: Number,
                volume: Number
            },
            temperature: Number, // °C
            usage: {
                type: String,
                enum: ['storage', 'processing', 'distribution', 'quickFreeze']
            },
            insulation: {
                walls: Number, // U-value W/m²·K
                floor: Number,
                ceiling: Number,
                type: String
            },
            product: {
                type: String,
                mass: Number, // kg/day
                initialTemp: Number,
                finalTemp: Number,
                specificHeat: Number,
                freezingPoint: Number,
                latentHeat: Number,
                timeHours: Number
            },
            equipment: [{
                name: String,
                power: Number, // kW
                quantity: Number
            }]
        }],

        // Temperature levels required
        temperatures: [Number],

        // Special requirements
        special: {
            quickFreeze: Boolean,
            multiTemp: Boolean,
            heatRecovery: Boolean,
            co2Cascade: Boolean,
            iqf: Boolean,
            blastFreeze: Boolean
        }
    },

    // Calculated loads
    calculations: {
        timestamp: Date,
        rooms: [{
            roomId: String,
            dimensions: Object,
            temperature: Number,
            transmission: Number, // kW
            product: Number,
            infiltration: Number,
            internal: Number,
            subtotal: Number
        }],
        transmissionLoad: Number,
        productLoad: Number,
        infiltrationLoad: Number,
        internalLoad: Number,
        safetyFactor: Number,
        totalLoad: Number, // kW
        peakLoad: Number,
        averageLoad: Number
    },

    // Selected equipment with pricing tiers
    equipmentSelection: {
        selectedTier: {
            type: String,
            enum: ['economic', 'best', 'premium'],
            default: 'best'
        },
        economic: {
            total: Number,
            items: [{
                category: String,
                equipment: Object,
                price: Number,
                quantity: Number
            }]
        },
        best: {
            total: Number,
            items: [{
                category: String,
                equipment: Object,
                price: Number,
                quantity: Number
            }]
        },
        premium: {
            total: Number,
            items: [{
                category: String,
                equipment: Object,
                price: Number,
                quantity: Number
            }]
        }
    },

    // Calculation book
    calculationBook: {
        generated: Boolean,
        generatedDate: Date,
        sections: [{
            number: Number,
            title: String,
            content: Object
        }],
        pdfPath: String
    },

    // P&ID drawing
    pidDrawing: {
        generated: Boolean,
        generatedDate: Date,
        equipment: [{
            tag: String,
            type: String,
            spec: String,
            position: {
                x: Number,
                y: Number
            }
        }],
        pipingLines: [{
            number: String,
            service: String,
            temperature: Number,
            from: String,
            to: String,
            size: String,
            material: String,
            insulation: String
        }],
        instruments: [{
            tag: String,
            type: String,
            location: String,
            range: String,
            position: {
                x: Number,
                y: Number
            }
        }],
        valves: [{
            tag: String,
            type: String,
            size: String,
            location: String
        }],
        dwgPath: String,
        pdfPath: String
    },

    // Wiring diagram
    wiringDiagram: {
        generated: Boolean,
        generatedDate: Date,
        powerDistribution: [{
            equipment: String,
            tag: String,
            motor: String,
            starter: String,
            protection: String,
            cable: String
        }],
        controlWiring: [{
            instrument: String,
            signal: String,
            destination: String,
            cable: String
        }],
        safetyCircuits: [{
            circuit: String,
            type: String,
            category: String
        }],
        plcIO: {
            digitalInputs: Array,
            digitalOutputs: Array,
            analogInputs: Array,
            analogOutputs: Array
        },
        dwgPath: String,
        pdfPath: String
    },

    // PLC program
    plcProgram: {
        generated: Boolean,
        generatedDate: Date,
        platform: String,
        language: String,
        organization: Array,
        dataBlocks: Array,
        functions: Array,
        programPath: String
    },

    // User conversation history
    conversationHistory: [{
        timestamp: { type: Date, default: Date.now },
        role: { type: String, enum: ['user', 'assistant'] },
        message: String,
        phase: String
    }],

    // Revision history
    revisions: [{
        timestamp: { type: Date, default: Date.now },
        phase: String,
        changes: String,
        user: String
    }],

    // Owner
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes for better query performance
AmmoniaProjectSchema.index({ userId: 1, 'projectInfo.name': 1 });
AmmoniaProjectSchema.index({ currentPhase: 1 });
AmmoniaProjectSchema.index({ 'projectInfo.status': 1 });

// Virtual for project completeness percentage
AmmoniaProjectSchema.virtual('completeness').get(function() {
    const phases = Object.values(this.phaseCompletion);
    const completed = phases.filter(p => p === true).length;
    return Math.round((completed / phases.length) * 100);
});

// Method to advance to next phase
AmmoniaProjectSchema.methods.advancePhase = function() {
    const phases = [
        'data_collection',
        'load_calculation',
        'equipment_selection',
        'calculation_book',
        'pid_drawing',
        'wiring_diagram',
        'plc_programming',
        'completed'
    ];

    const currentIndex = phases.indexOf(this.currentPhase);
    if (currentIndex < phases.length - 1) {
        // Mark current phase as complete
        const phaseKey = this.currentPhase.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        this.phaseCompletion[phaseKey] = true;

        // Advance to next phase
        this.currentPhase = phases[currentIndex + 1];
    }
};

// Method to go back to a previous phase
AmmoniaProjectSchema.methods.goToPhase = function(phase) {
    const phases = [
        'data_collection',
        'load_calculation',
        'equipment_selection',
        'calculation_book',
        'pid_drawing',
        'wiring_diagram',
        'plc_programming'
    ];

    if (phases.includes(phase)) {
        this.currentPhase = phase;
    }
};

// Method to add conversation message
AmmoniaProjectSchema.methods.addMessage = function(role, message) {
    this.conversationHistory.push({
        role,
        message,
        phase: this.currentPhase
    });
};

// Method to add revision
AmmoniaProjectSchema.methods.addRevision = function(changes, user) {
    this.revisions.push({
        phase: this.currentPhase,
        changes,
        user
    });
};

module.exports = mongoose.model('AmmoniaProject', AmmoniaProjectSchema);
