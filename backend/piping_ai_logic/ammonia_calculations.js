/**
 * Professional Ammonia Refrigeration System Calculations
 * For 5000-ton Cold Storage Facilities with Industrial Equipment
 */

// Professional Equipment Database - Major Manufacturers
const EQUIPMENT_DATABASE = {
    compressors: {
        bitzer: {
            screw: [
                { model: 'HSK8561-80-40P', capacity: 850, power: 280, displacement: 1450, refrigerant: 'NH3' },
                { model: 'HSK7451-75-40P', capacity: 750, power: 245, displacement: 1280, refrigerant: 'NH3' },
                { model: 'HSK6441-60-40P', capacity: 640, power: 210, displacement: 1050, refrigerant: 'NH3' },
                { model: 'HSK5591-50-40P', capacity: 550, power: 180, displacement: 890, refrigerant: 'NH3' },
                { model: 'HSK4461-40-40P', capacity: 440, power: 145, displacement: 720, refrigerant: 'NH3' }
            ]
        },
        mycom: {
            screw: [
                { model: 'N1208VSD', capacity: 1200, power: 390, displacement: 1950, refrigerant: 'NH3' },
                { model: 'N1008VSD', capacity: 1000, power: 325, displacement: 1620, refrigerant: 'NH3' },
                { model: 'N808VSD', capacity: 800, power: 260, displacement: 1300, refrigerant: 'NH3' },
                { model: 'N608VSD', capacity: 600, power: 195, displacement: 975, refrigerant: 'NH3' }
            ]
        }
    },
    
    evaporators: {
        guntner: {
            coolers: [
                { model: 'GACC RX 040.2/4', capacity: 85, area: 142, fans: 4, fanPower: 1.1, refrigerant: 'NH3' },
                { model: 'GACC RX 060.2/6', capacity: 145, area: 235, fans: 6, fanPower: 1.1, refrigerant: 'NH3' },
                { model: 'GACC RX 100.2/8', capacity: 235, area: 385, fans: 8, fanPower: 1.5, refrigerant: 'NH3' }
            ],
            freezers: [
                { model: 'GAFC RX 040.2/4', capacity: 65, area: 142, fans: 4, fanPower: 1.1, refrigerant: 'NH3' },
                { model: 'GAFC RX 060.2/6', capacity: 110, area: 235, fans: 6, fanPower: 1.1, refrigerant: 'NH3' },
                { model: 'GAFC RX 100.2/8', capacity: 180, area: 385, fans: 8, fanPower: 1.5, refrigerant: 'NH3' }
            ]
        }
    },
    
    condensers: {
        baltimore: {
            evaporative: [
                { model: 'VXT-1500', capacity: 1500, power: 45, fans: 6, waterFlow: 285, refrigerant: 'NH3' },
                { model: 'VXT-2200', capacity: 2200, power: 67, fans: 10, waterFlow: 415, refrigerant: 'NH3' },
                { model: 'VXT-3000', capacity: 3000, power: 90, fans: 14, waterFlow: 565, refrigerant: 'NH3' },
                { model: 'VXT-3500', capacity: 3500, power: 105, fans: 16, waterFlow: 660, refrigerant: 'NH3' }
            ]
        }
    },
    
    vessels: {
        receivers: [
            { volume: 1000, diameter: 1000, length: 1300, pressure: 18, temperature: 40, refrigerant: 'NH3' },
            { volume: 1500, diameter: 1200, length: 1400, pressure: 18, temperature: 40, refrigerant: 'NH3' },
            { volume: 2000, diameter: 1300, length: 1500, pressure: 18, temperature: 40, refrigerant: 'NH3' },
            { volume: 3000, diameter: 1500, length: 1700, pressure: 18, temperature: 40, refrigerant: 'NH3' }
        ],
        separators: [
            { volume: 500, diameter: 800, length: 1000, pressure: 18, temperature: -10, refrigerant: 'NH3' },
            { volume: 1000, diameter: 1000, length: 1300, pressure: 18, temperature: -10, refrigerant: 'NH3' },
            { volume: 1500, diameter: 1200, length: 1400, pressure: 18, temperature: -10, refrigerant: 'NH3' }
        ]
    },
    
    valves: {
        danfoss: {
            expansion: [
                { model: 'TE55-40', capacity: 40, inlet: '5/8"', outlet: '3/4"', refrigerant: 'NH3' },
                { model: 'TE55-60', capacity: 60, inlet: '3/4"', outlet: '7/8"', refrigerant: 'NH3' },
                { model: 'TE55-80', capacity: 80, inlet: '7/8"', outlet: '1 1/8"', refrigerant: 'NH3' },
                { model: 'TE55-100', capacity: 100, inlet: '1 1/8"', outlet: '1 3/8"', refrigerant: 'NH3' }
            ],
            solenoid: [
                { model: 'EVR 20', size: '3/4"', pressure: 25, temperature: 60, refrigerant: 'NH3' },
                { model: 'EVR 25', size: '1"', pressure: 25, temperature: 60, refrigerant: 'NH3' },
                { model: 'EVR 32', size: '1 1/4"', pressure: 25, temperature: 60, refrigerant: 'NH3' },
                { model: 'EVR 40', size: '1 1/2"', pressure: 25, temperature: 60, refrigerant: 'NH3' }
            ],
            pressure: [
                { model: 'CVP-20', size: '3/4"', range: '0.2-3.2 bar', refrigerant: 'NH3' },
                { model: 'CVP-25', size: '1"', range: '0.2-3.2 bar', refrigerant: 'NH3' },
                { model: 'CVP-32', size: '1 1/4"', range: '0.2-3.2 bar', refrigerant: 'NH3' }
            ]
        }
    }
};

// Professional calculation functions
function calculateColdStorageLoad(rooms, ambientTemp = 35, targetTempCooling = 2, targetTempFreezing = -25) {
    console.log('[Ammonia Calc] Calculating cold storage refrigeration load...');
    
    const results = {
        totalLoad: 0,
        coolingLoad: 0,
        freezingLoad: 0,
        rooms: [],
        equipmentRecommendations: {}
    };
    
    rooms.forEach((room, index) => {
        const roomVolume = room.length * room.width * room.height;
        const roomArea = 2 * (room.length * room.width + room.length * room.height + room.width * room.height);
        
        // Heat load calculations per circuit
        const coolingCircuit = calculateRoomLoad(room, ambientTemp, targetTempCooling, 'cooling');
        const freezingCircuit = calculateRoomLoad(room, ambientTemp, targetTempFreezing, 'freezing');
        
        const roomData = {
            id: index + 1,
            dimensions: room,
            volume: roomVolume,
            surfaceArea: roomArea,
            coolingCircuit,
            freezingCircuit,
            totalRoomLoad: coolingCircuit.totalLoad + freezingCircuit.totalLoad
        };
        
        results.rooms.push(roomData);
        results.coolingLoad += coolingCircuit.totalLoad;
        results.freezingLoad += freezingCircuit.totalLoad;
    });
    
    results.totalLoad = results.coolingLoad + results.freezingLoad;
    
    console.log(`[Ammonia Calc] Total calculated load: ${results.totalLoad} kW`);
    return results;
}

function calculateRoomLoad(room, ambientTemp, targetTemp, circuitType) {
    const volume = room.length * room.width * room.height;
    const surfaceArea = 2 * (room.length * room.width + room.length * room.height + room.width * room.height);
    
    // Heat load components (kW)
    const transmissionLoad = surfaceArea * 0.45 * (ambientTemp - targetTemp) / 1000;
    const infiltrationLoad = volume * 0.65 * (ambientTemp - targetTemp) / 1000;
    const productLoad = circuitType === 'freezing' ? volume * 0.85 / 1000 : volume * 0.45 / 1000;
    const lightingLoad = room.length * room.width * 0.015;
    const peopleLoad = 0.5;
    const fanLoad = circuitType === 'freezing' ? 2.5 : 1.8;
    
    const totalLoad = transmissionLoad + infiltrationLoad + productLoad + lightingLoad + peopleLoad + fanLoad;
    
    return {
        transmissionLoad: Math.round(transmissionLoad * 100) / 100,
        infiltrationLoad: Math.round(infiltrationLoad * 100) / 100,
        productLoad: Math.round(productLoad * 100) / 100,
        lightingLoad: Math.round(lightingLoad * 100) / 100,
        peopleLoad: peopleLoad,
        fanLoad: fanLoad,
        totalLoad: Math.round(totalLoad * 100) / 100,
        circuitType
    };
}

function selectCompressors(totalLoad, circuitType) {
    console.log(`[Ammonia Calc] Selecting compressors for ${circuitType} circuit, load: ${totalLoad} kW`);
    
    const compressorOptions = [
        ...EQUIPMENT_DATABASE.compressors.bitzer.screw,
        ...EQUIPMENT_DATABASE.compressors.mycom.screw
    ];
    
    compressorOptions.sort((a, b) => a.capacity - b.capacity);
    
    const selectedCompressors = [];
    let remainingLoad = totalLoad;
    
    while (remainingLoad > 50 && selectedCompressors.length < 4) {
        const suitableCompressor = compressorOptions.find(comp => 
            comp.capacity >= remainingLoad * 0.6 && comp.capacity <= remainingLoad * 1.2
        );
        
        if (suitableCompressor) {
            selectedCompressors.push({...suitableCompressor, quantity: 1});
            remainingLoad -= suitableCompressor.capacity;
        } else {
            const largestCompressor = compressorOptions[compressorOptions.length - 1];
            selectedCompressors.push({...largestCompressor, quantity: 1});
            remainingLoad -= largestCompressor.capacity;
        }
    }
    
    // Add backup compressor
    if (selectedCompressors.length > 0) {
        const mainCompressor = selectedCompressors[0];
        selectedCompressors.push({...mainCompressor, quantity: 1, backup: true});
    }
    
    return selectedCompressors;
}

function selectEvaporators(roomLoad, circuitType, roomDimensions) {
    const evaporatorDB = circuitType === 'freezing' ? 
        EQUIPMENT_DATABASE.evaporators.guntner.freezers : 
        EQUIPMENT_DATABASE.evaporators.guntner.coolers;
    
    const selectedEvaporators = [];
    const optimalUnitLoad = roomLoad / 2;
    
    const suitableEvaporator = evaporatorDB.find(evap => 
        evap.capacity >= optimalUnitLoad * 0.8 && evap.capacity <= optimalUnitLoad * 1.5
    );
    
    if (suitableEvaporator) {
        const quantity = Math.ceil(roomLoad / suitableEvaporator.capacity);
        selectedEvaporators.push({
            ...suitableEvaporator,
            quantity: quantity,
            totalCapacity: suitableEvaporator.capacity * quantity,
            totalFans: suitableEvaporator.fans * quantity,
            totalFanPower: suitableEvaporator.fanPower * suitableEvaporator.fans * quantity
        });
    }
    
    return selectedEvaporators;
}

function selectCondensers(totalLoad) {
    const condenserDB = EQUIPMENT_DATABASE.condensers.baltimore.evaporative;
    const condensingLoad = totalLoad * 1.25;
    
    const selectedCondensers = [];
    let remainingLoad = condensingLoad;
    
    while (remainingLoad > 500 && selectedCondensers.length < 3) {
        const suitableCondenser = condenserDB.find(cond => 
            cond.capacity >= remainingLoad * 0.6 && cond.capacity <= remainingLoad * 1.2
        );
        
        if (suitableCondenser) {
            selectedCondensers.push({...suitableCondenser, quantity: 1});
            remainingLoad -= suitableCondenser.capacity;
        } else {
            const largestCondenser = condenserDB[condenserDB.length - 1];
            selectedCondensers.push({...largestCondenser, quantity: 1});
            remainingLoad -= largestCondenser.capacity;
        }
    }
    
    return selectedCondensers;
}

function calculatePipeSizes(equipmentData, systemPressures) {
    const pipeSizes = {
        suctionLines: [],
        liquidLines: [],
        hotGasLines: []
    };
    
    const standardSizes = ['1"', '1 1/4"', '1 1/2"', '2"', '2 1/2"', '3"', '4"', '5"', '6"', '8"', '10"', '12"'];
    
    // Suction line sizing
    equipmentData.compressors.forEach((comp, index) => {
        const suctionVelocity = 15; // m/s for ammonia suction
        const volumetricFlow = comp.displacement * comp.quantity / 60;
        const diameter = Math.sqrt(4 * volumetricFlow / (Math.PI * suctionVelocity * 60)) * 1000;
        const sizeMM = Math.ceil(diameter / 25.4) * 25.4;
        const sizeInch = standardSizes.find(size => parseFloat(size) * 25.4 >= sizeMM) || '8"';
        
        pipeSizes.suctionLines.push({
            compressor: comp.model,
            diameter: sizeInch,
            material: 'ASTM A333 Grade 6',
            insulation: 'Armaflex 25mm'
        });
    });
    
    return pipeSizes;
}

// Main calculation function for 5000-ton facility
function calculate5000TonAmmoniaSystem(facilityData) {
    console.log('[Ammonia Calc] Starting comprehensive calculation for 5000-ton ammonia cold storage...');
    
    const results = {
        facility: facilityData,
        loadCalculation: null,
        equipment: {
            compressors: [],
            evaporators: [],
            condensers: [],
            vessels: {},
            valves: {},
            pipework: {}
        },
        specifications: {}
    };
    
    // 1. Calculate refrigeration loads
    results.loadCalculation = calculateColdStorageLoad(facilityData.rooms);
    
    // 2. Select compressors
    const coolingCompressors = selectCompressors(results.loadCalculation.coolingLoad, 'cooling');
    const freezingCompressors = selectCompressors(results.loadCalculation.freezingLoad, 'freezing');
    results.equipment.compressors = [...coolingCompressors, ...freezingCompressors];
    
    // 3. Select evaporators for each room
    results.loadCalculation.rooms.forEach(room => {
        const coolingEvaps = selectEvaporators(room.coolingCircuit.totalLoad, 'cooling', room.dimensions);
        const freezingEvaps = selectEvaporators(room.freezingCircuit.totalLoad, 'freezing', room.dimensions);
        room.equipment = {
            coolingEvaporators: coolingEvaps,
            freezingEvaporators: freezingEvaps
        };
    });
    
    // 4. Select condensers
    results.equipment.condensers = selectCondensers(results.loadCalculation.totalLoad);
    
    // 5. Calculate pipe sizes
    results.equipment.pipework = calculatePipeSizes({
        compressors: results.equipment.compressors,
        totalLoad: results.loadCalculation.totalLoad
    });
    
    // 6. Generate specifications
    results.specifications = {
        refrigerant: 'Ammonia (NH3)',
        systemType: 'Direct Expansion with Liquid Pump Circulation',
        totalCapacity: `${results.loadCalculation.totalLoad} kW`,
        numberOfRooms: facilityData.rooms.length,
        safetyFeatures: [
            'Emergency ventilation system',
            'Ammonia leak detection',
            'Emergency shower stations',
            'Fire suppression system'
        ]
    };
    
    console.log('[Ammonia Calc] Calculation completed successfully');
    return results;
}

// Export calculation functions
module.exports = {
    calculate5000TonAmmoniaSystem,
    calculateColdStorageLoad,
    selectCompressors,
    selectEvaporators,
    selectCondensers,
    calculatePipeSizes,
    EQUIPMENT_DATABASE
};