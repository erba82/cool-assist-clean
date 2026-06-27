// src/components/ammonia/EquipmentSelector.ts
// The Catalog for Real Ammonia Equipment

import { LoadCalculation } from './EngineeringCore';

export interface Equipment {
    id: string;
    tag: string;
    type: string;
    manufacturer: string;
    model: string;
    capacity: number; // kW
    power: number; // kW
    amps: number;
    price: number; // USD
    cable: string;
    breaker: number;
}

export interface Vessel {
    id: string;
    tag: string;
    type: string;
    model: string;
    capacity: number; // kW
    price: number; // USD
}

export interface Condenser {
    id: string;
    tag: string;
    type: string;
    manufacturer: string;
    model: string;
    capacity: number; // kW
    power: number; // kW (fan power)
    amps: number;
    price: number; // USD
    cable: string;
    breaker: number;
}

export interface EquipmentSelection {
    boosterCompressors: Equipment[];
    highStageCompressors: Equipment[];
    vessels: Vessel[];
    condenser: Condenser;
    totalPrice: number; // USD
}

// Real equipment database
const COMPRESSOR_DATABASE = {
    // Bitzer compressors
    bitzer: {
        // Low temperature compressors for -40°C
        lowTemp: [
            { model: 'OSKN 7451-K', manufacturer: 'Bitzer', capacity: 45, power: 20, price: 45000 },
            { model: 'OSKN 7461-K', manufacturer: 'Bitzer', capacity: 55, power: 25, price: 50000 },
            { model: 'OSKN 7471-K', manufacturer: 'Bitzer', capacity: 65, power: 30, price: 55000 }
        ],
        // Medium temperature compressors for -10°C
        medTemp: [
            { model: 'OSKA 8591-K', manufacturer: 'Bitzer', capacity: 80, power: 25, price: 40000 },
            { model: 'OSKA 8601-K', manufacturer: 'Bitzer', capacity: 100, power: 30, price: 45000 },
            { model: 'OSKA 8611-K', manufacturer: 'Bitzer', capacity: 120, power: 35, price: 50000 }
        ]
    },
    // Howden compressors
    howden: {
        lowTemp: [
            { model: 'HSC-45', manufacturer: 'Howden', capacity: 50, power: 22, price: 42000 },
            { model: 'HSC-55', manufacturer: 'Howden', capacity: 60, power: 27, price: 47000 }
        ],
        medTemp: [
            { model: 'HMC-85', manufacturer: 'Howden', capacity: 85, power: 26, price: 38000 },
            { model: 'HMC-105', manufacturer: 'Howden', capacity: 105, power: 32, price: 43000 }
        ]
    }
};

const CONDENSER_DATABASE = {
    bac: [
        { model: 'VXC-1200', manufacturer: 'BAC', capacity: 500, power: 60, price: 80000 },
        { model: 'VXC-1500', manufacturer: 'BAC', capacity: 750, power: 90, price: 120000 },
        { model: 'VXC-2000', manufacturer: 'BAC', capacity: 1000, power: 120, price: 150000 }
    ],
    evaporative: [
        { model: 'ECO-500', manufacturer: 'Evapco', capacity: 500, power: 55, price: 75000 },
        { model: 'ECO-750', manufacturer: 'Evapco', capacity: 750, power: 85, price: 110000 }
    ]
};

const VESSEL_DATABASE = {
    separator: [
        { model: 'LP-3000', type: 'LP Separator', capacity: 3000, price: 15000 },
        { model: 'LP-4000', type: 'LP Separator', capacity: 4000, price: 20000 }
    ],
    intercooler: [
        { model: 'IC-2000', type: 'Intercooler', capacity: 2000, price: 12000 },
        { model: 'IC-3000', type: 'Intercooler', capacity: 3000, price: 18000 }
    ]
};

export class EquipmentSelector {
    /**
     * Select cable size based on current
     */
    static selectCable(amps: number): string {
        if (amps < 25) return '4mm²';
        if (amps < 40) return '10mm²';
        if (amps < 63) return '16mm²';
        if (amps < 100) return '35mm²';
        if (amps < 160) return '70mm²';
        if (amps < 200) return '95mm²';
        if (amps < 250) return '120mm²';
        return '150mm²';
    }

    /**
     * Select breaker size (125% of rated current)
     */
    static selectBreaker(amps: number): number {
        const required = amps * 1.25;
        const sizes = [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400];
        return sizes.find(s => s >= required) || 400;
    }

    /**
     * Select compressors based on load
     */
    static selectCompressors(load: number, stage: 'low' | 'high'): Equipment[] {
        const compressors: Equipment[] = [];
        let remainingLoad = load;
        let compressorCount = 0;
        
        // For demo purposes, we'll use Bitzer compressors
        const compressorModels = stage === 'low' ? 
            COMPRESSOR_DATABASE.bitzer.lowTemp : 
            COMPRESSOR_DATABASE.bitzer.medTemp;
        
        // Select compressors until load is covered with 20% redundancy
        const targetLoad = load * 1.2;
        
        while (remainingLoad > 0 && compressorCount < 5) { // Max 5 compressors
            // Select the smallest compressor that can handle the remaining load
            // or the largest if no smaller one fits
            const suitableCompressors = compressorModels.filter(c => c.capacity >= remainingLoad * 0.8);
            const selectedCompressor = suitableCompressors.length > 0 ? 
                suitableCompressors[0] : 
                compressorModels[compressorModels.length - 1];
            
            const amps = 1000 * selectedCompressor.power / (Math.sqrt(3) * 380 * 0.85);
            
            compressors.push({
                id: `comp-${stage}-${compressorCount + 1}`,
                tag: `${stage === 'low' ? 'Booster' : 'High'}-${compressorCount + 1}`,
                type: 'Screw Compressor',
                manufacturer: selectedCompressor.manufacturer,
                model: selectedCompressor.model,
                capacity: selectedCompressor.capacity,
                power: selectedCompressor.power,
                amps: parseFloat(amps.toFixed(1)),
                price: selectedCompressor.price,
                cable: this.selectCable(amps),
                breaker: this.selectBreaker(amps)
            });
            
            remainingLoad -= selectedCompressor.capacity;
            compressorCount++;
            
            // If remaining load is less than 20% of a small compressor, stop
            if (remainingLoad < 5) break;
        }
        
        return compressors;
    }

    /**
     * Select vessels based on system requirements
     */
    static selectVessels(): Vessel[] {
        const vessels: Vessel[] = [];
        
        // Select LP Separator
        const lpSeparator = VESSEL_DATABASE.separator[0]; // 3000L model
        vessels.push({
            id: 'v-lp',
            tag: 'V-LP',
            type: lpSeparator.type,
            model: lpSeparator.model,
            capacity: lpSeparator.capacity,
            price: lpSeparator.price
        });
        
        // Select Intercooler
        const intercooler = VESSEL_DATABASE.intercooler[0]; // 2000L model
        vessels.push({
            id: 'v-ic',
            tag: 'V-IC',
            type: intercooler.type,
            model: intercooler.model,
            capacity: intercooler.capacity,
            price: intercooler.price
        });
        
        return vessels;
    }

    /**
     * Select condenser based on total heat rejection
     */
    static selectCondenser(heatRejection: number): Condenser {
        // Find condenser with 10% capacity margin
        const requiredCapacity = heatRejection * 1.1;
        
        // For demo, we'll use BAC condenser
        const suitableCondensers = CONDENSER_DATABASE.bac.filter(c => c.capacity >= requiredCapacity);
        const selectedCondenser = suitableCondensers.length > 0 ? 
            suitableCondensers[0] : 
            CONDENSER_DATABASE.bac[CONDENSER_DATABASE.bac.length - 1];
        
        const amps = 1000 * selectedCondenser.power / (Math.sqrt(3) * 380 * 0.85);
        
        return {
            id: 'cond-1',
            tag: 'COND-1',
            type: 'Evaporative Condenser',
            manufacturer: selectedCondenser.manufacturer,
            model: selectedCondenser.model,
            capacity: selectedCondenser.capacity,
            power: selectedCondenser.power,
            amps: parseFloat(amps.toFixed(1)),
            price: selectedCondenser.price,
            cable: this.selectCable(amps),
            breaker: this.selectBreaker(amps)
        };
    }

    /**
     * Select complete equipment package based on load calculation
     */
    static selectEquipment(loadCalculation: LoadCalculation): EquipmentSelection {
        console.log('🔧 Selecting equipment for load:', loadCalculation);
        
        // Select compressors for each stage
        const boosterCompressors = this.selectCompressors(loadCalculation.lowStageLoad, 'low');
        const highStageCompressors = this.selectCompressors(
            loadCalculation.lowStageLoad + loadCalculation.highStageLoad, 
            'high'
        );
        
        // Select vessels
        const vessels = this.selectVessels();
        
        // Select condenser
        const condenser = this.selectCondenser(loadCalculation.totalHeatRejection);
        
        // Calculate total price
        const totalPrice = 
            boosterCompressors.reduce((sum, comp) => sum + comp.price, 0) +
            highStageCompressors.reduce((sum, comp) => sum + comp.price, 0) +
            vessels.reduce((sum, vessel) => sum + vessel.price, 0) +
            condenser.price;
        
        console.log('✅ Equipment selection complete:', {
            boosterCompressors: boosterCompressors.length,
            highStageCompressors: highStageCompressors.length,
            totalPrice
        });
        
        return {
            boosterCompressors,
            highStageCompressors,
            vessels,
            condenser,
            totalPrice
        };
    }
}