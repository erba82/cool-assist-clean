/*
 * ammoniaSystemCalculator.js
 * Advanced calculator for ammonia refrigeration systems
 * Handles multi-room cold storage with detailed equipment specifications
 * Date: 2025-09-10
 */

// Industry standard equipment manufacturers and models
const EQUIPMENT_DATABASE = {
  COMPRESSORS: {
    SCREW: {
      'BITZER': [
        { model: 'OSKA8571-K', capacity: '450 kW', power: '145 kW', displacement: '880 m³/h' },
        { model: 'OSKA8591-K', capacity: '650 kW', power: '205 kW', displacement: '1250 m³/h' },
        { model: 'OSKA85101-K', capacity: '850 kW', power: '270 kW', displacement: '1650 m³/h' },
        { model: 'OSKA85131-K', capacity: '1100 kW', power: '350 kW', displacement: '2150 m³/h' }
      ],
      'JOHNSON_CONTROLS': [
        { model: 'SABROE SMC 104S', capacity: '400 kW', power: '135 kW', displacement: '810 m³/h' },
        { model: 'SABROE SMC 108S', capacity: '580 kW', power: '190 kW', displacement: '1140 m³/h' },
        { model: 'SABROE SMC 112S', capacity: '750 kW', power: '245 kW', displacement: '1480 m³/h' }
      ]
    }
  },
  
  EVAPORATORS: {
    'ALFA_LAVAL': [
      { model: 'M6-MFG', capacity: '45 kW', fans: 2, fanSize: '500mm', airflow: '8500 m³/h' },
      { model: 'M10-MFG', capacity: '85 kW', fans: 3, fanSize: '630mm', airflow: '15000 m³/h' },
      { model: 'M15-MFG', capacity: '125 kW', fans: 4, fanSize: '710mm', airflow: '22000 m³/h' }
    ],
    'GUNTNER': [
      { model: 'GACC RX 031.2A', capacity: '42 kW', fans: 2, fanSize: '500mm', airflow: '8200 m³/h' },
      { model: 'GACC RX 041.2A', capacity: '67 kW', fans: 2, fanSize: '630mm', airflow: '12500 m³/h' },
      { model: 'GACC RX 051.3A', capacity: '95 kW', fans: 3, fanSize: '630mm', airflow: '18500 m³/h' }
    ]
  },
  
  CONDENSERS: {
    EVAPORATIVE: {
      'BALTIMORE_AIRCOIL': [
        { model: 'VXT-1711', capacity: '1200 kW', power: '22 kW', fans: 4, fanSize: '1220mm' },
        { model: 'VXT-2111', capacity: '1800 kW', power: '33 kW', fans: 6, fanSize: '1220mm' },
        { model: 'VXT-2511', capacity: '2400 kW', power: '44 kW', fans: 8, fanSize: '1220mm' }
      ]
    }
  },
  
  VESSELS: {
    'ACME_ENGINEERING': [
      { type: 'High Pressure Receiver', volume: '2.5 m³', diameter: '1000mm', length: '3200mm' },
      { type: 'Low Pressure Receiver', volume: '5.0 m³', diameter: '1200mm', length: '4500mm' },
      { type: 'Thermosiphon Separator', volume: '1.8 m³', diameter: '800mm', length: '3600mm' }
    ]
  },
  
  VALVES: {
    'DANFOSS': [
      { type: 'Solenoid Valve', model: 'EV220B', sizes: ['1/2"', '3/4"', '1"', '1 1/4"', '1 1/2"', '2"'] },
      { type: 'Pressure Regulating Valve', model: 'CVP', sizes: ['3/4"', '1"', '1 1/4"', '1 1/2"', '2"', '2 1/2"'] },
      { type: 'Stop Valve', model: 'SVA', sizes: ['1/2"', '3/4"', '1"', '1 1/4"', '1 1/2"', '2"', '2 1/2"', '3"'] }
    ]
  }
};

// Pipe sizing standards for ammonia systems
const PIPE_SIZING = {
  AMMONIA: {
    SUCTION: {
      // Based on capacity and evaporating temperature
      calculateSize: (capacity, evapTemp) => {
        // Simplified calculation - in practice would use more complex formulas
        if (capacity < 50) return '1 1/4"';
        if (capacity < 100) return '1 1/2"';
        if (capacity < 200) return '2"';
        if (capacity < 350) return '2 1/2"';
        if (capacity < 500) return '3"';
        if (capacity < 750) return '4"';
        if (capacity < 1000) return '5"';
        return '6"';
      }
    },
    LIQUID: {
      calculateSize: (capacity) => {
        if (capacity < 100) return '3/4"';
        if (capacity < 200) return '1"';
        if (capacity < 350) return '1 1/4"';
        if (capacity < 500) return '1 1/2"';
        if (capacity < 750) return '2"';
        if (capacity < 1000) return '2 1/2"';
        return '3"';
      }
    },
    HOT_GAS: {
      calculateSize: (capacity) => {
        if (capacity < 75) return '1"';
        if (capacity < 150) return '1 1/4"';
        if (capacity < 250) return '1 1/2"';
        if (capacity < 400) return '2"';
        if (capacity < 600) return '2 1/2"';
        if (capacity < 850) return '3"';
        return '4"';
      }
    }
  }
};

class AmmoniaSystemCalculator {
  constructor() {
    this.systemData = null;
  }

  // Parse system requirements from natural language
  parseSystemRequirements(prompt) {
    const requirements = {
      totalCapacity: this.extractCapacity(prompt),
      rooms: this.extractRoomData(prompt),
      refrigerant: 'NH3', // Ammonia
      systemType: this.extractSystemType(prompt),
      compressorType: this.extractCompressorType(prompt),
      temperatureRanges: this.extractTemperatureRanges(prompt)
    };

    return requirements;
  }

  extractCapacity(prompt) {
    const capacityMatch = prompt.match(/(\d+)(?:\s*-?\s*)?ton/i);
    if (capacityMatch) {
      return parseInt(capacityMatch[1]);
    }
    return 1000; // Default
  }

  extractRoomData(prompt) {
    const roomMatch = prompt.match(/(\d+)\s*rooms?/i);
    const dimensionMatch = prompt.match(/(\d+)\s*x\s*(\d+)(?:\s*x\s*(\d+))?/i);
    
    const roomCount = roomMatch ? parseInt(roomMatch[1]) : 12;
    const dimensions = dimensionMatch ? {
      length: parseInt(dimensionMatch[1]),
      width: parseInt(dimensionMatch[2]),
      height: dimensionMatch[3] ? parseInt(dimensionMatch[3]) : 9
    } : { length: 18, width: 15, height: 9 };

    return {
      count: roomCount,
      dimensions: dimensions,
      volume: dimensions.length * dimensions.width * dimensions.height
    };
  }

  extractSystemType(prompt) {
    if (prompt.toLowerCase().includes('direct')) return 'direct';
    if (prompt.toLowerCase().includes('indirect')) return 'indirect';
    return 'direct';
  }

  extractCompressorType(prompt) {
    if (prompt.toLowerCase().includes('screw')) return 'screw';
    if (prompt.toLowerCase().includes('reciprocating')) return 'reciprocating';
    return 'screw';
  }

  extractTemperatureRanges(prompt) {
    const aboveZero = prompt.toLowerCase().includes('above zero');
    const belowZero = prompt.toLowerCase().includes('below zero');
    
    return {
      aboveZero: aboveZero,
      belowZero: belowZero,
      circuits: aboveZero && belowZero ? 2 : 1
    };
  }

  // Calculate detailed system specifications
  calculateSystemSpecs(requirements) {
    const specs = {
      rooms: this.calculateRoomSpecs(requirements),
      compressors: this.selectCompressors(requirements),
      condensers: this.selectCondensers(requirements),
      vessels: this.selectVessels(requirements),
      pipingSizes: this.calculatePipingSizes(requirements),
      valveSpecs: this.selectValves(requirements)
    };

    return specs;
  }

  calculateRoomSpecs(requirements) {
    const { rooms, totalCapacity } = requirements;
    const capacityPerRoom = totalCapacity / rooms.count;
    
    // Calculate heat load based on room volume and temperature
    const heatLoadPerM3 = 85; // W/m³ typical for cold storage
    const calculatedLoad = (rooms.volume * heatLoadPerM3) / 1000; // Convert to kW
    
    const roomSpecs = [];
    
    for (let i = 1; i <= rooms.count; i++) {
      const roomLoad = Math.max(capacityPerRoom, calculatedLoad);
      const evaporators = this.selectEvaporators(roomLoad);
      
      roomSpecs.push({
        roomNumber: i,
        dimensions: rooms.dimensions,
        coolingLoad: roomLoad,
        evaporators: evaporators,
        temperatureRange: i <= rooms.count / 2 ? 'above_zero' : 'below_zero'
      });
    }

    return roomSpecs;
  }

  selectEvaporators(roomLoad) {
    const evaporators = [];
    let remainingLoad = roomLoad;
    
    // Select from GUNTNER evaporators (preferred for ammonia)
    const availableEvaps = EQUIPMENT_DATABASE.EVAPORATORS.GUNTNER;
    
    while (remainingLoad > 0) {
      // Find best fit evaporator
      const selectedEvap = availableEvaps.find(evap => 
        parseInt(evap.capacity) >= remainingLoad * 0.6
      ) || availableEvaps[availableEvaps.length - 1];
      
      evaporators.push({
        ...selectedEvap,
        quantity: 1
      });
      
      remainingLoad -= parseInt(selectedEvap.capacity);
      
      if (remainingLoad <= 0) break;
    }
    
    return evaporators;
  }

  selectCompressors(requirements) {
    const totalCapacity = requirements.totalCapacity;
    const compressors = [];
    
    // Select BITZER screw compressors for ammonia
    const availableComps = EQUIPMENT_DATABASE.COMPRESSORS.SCREW.BITZER;
    
    let remainingCapacity = totalCapacity;
    
    // For redundancy, use multiple smaller compressors
    while (remainingCapacity > 0) {
      const selectedComp = availableComps.find(comp => 
        parseInt(comp.capacity) >= remainingCapacity * 0.4 &&
        parseInt(comp.capacity) <= remainingCapacity * 0.8
      ) || availableComps[0];
      
      compressors.push({
        ...selectedComp,
        quantity: 1,
        circuit: compressors.length < 2 ? 'circuit_1' : 'circuit_2'
      });
      
      remainingCapacity -= parseInt(selectedComp.capacity);
      
      if (remainingCapacity <= 0) break;
    }
    
    return compressors;
  }

  selectCondensers(requirements) {
    const totalCapacity = requirements.totalCapacity;
    
    // Select evaporative condensers
    const availableCondensers = EQUIPMENT_DATABASE.CONDENSERS.EVAPORATIVE.BALTIMORE_AIRCOIL;
    
    const selectedCondenser = availableCondensers.find(cond => 
      parseInt(cond.capacity) >= totalCapacity * 1.2 // 20% safety factor
    ) || availableCondensers[availableCondensers.length - 1];
    
    return [{
      ...selectedCondenser,
      quantity: 1,
      manufacturer: 'Baltimore Aircoil'
    }];
  }

  selectVessels(requirements) {
    const vessels = [];
    
    // High pressure receiver
    vessels.push({
      ...EQUIPMENT_DATABASE.VESSELS.ACME_ENGINEERING[1], // 5.0 m³
      quantity: 1,
      tag: 'HPR-001'
    });
    
    // Low pressure receiver  
    vessels.push({
      ...EQUIPMENT_DATABASE.VESSELS.ACME_ENGINEERING[2], // Larger for LP
      quantity: 1,
      tag: 'LPR-001'
    });
    
    // Thermosiphon separators (one per evaporator circuit)
    const separatorCount = Math.ceil(requirements.rooms.count / 6); // One per 6 rooms
    for (let i = 1; i <= separatorCount; i++) {
      vessels.push({
        ...EQUIPMENT_DATABASE.VESSELS.ACME_ENGINEERING[2],
        quantity: 1,
        tag: `TS-00${i}`
      });
    }
    
    return vessels;
  }

  calculatePipingSizes(requirements) {
    const { totalCapacity } = requirements;
    
    return {
      mainSuction: PIPE_SIZING.AMMONIA.SUCTION.calculateSize(totalCapacity, -30),
      mainLiquid: PIPE_SIZING.AMMONIA.LIQUID.calculateSize(totalCapacity),
      mainHotGas: PIPE_SIZING.AMMONIA.HOT_GAS.calculateSize(totalCapacity),
      branchSuction: PIPE_SIZING.AMMONIA.SUCTION.calculateSize(totalCapacity / requirements.rooms.count, -30),
      branchLiquid: PIPE_SIZING.AMMONIA.LIQUID.calculateSize(totalCapacity / requirements.rooms.count),
      material: 'Schedule 40 Seamless Steel Pipe',
      insulation: 'Armaflex Class 0 Insulation'
    };
  }

  selectValves(requirements) {
    const danfossValves = EQUIPMENT_DATABASE.VALVES.DANFOSS;
    const pipingSizes = this.calculatePipingSizes(requirements);
    
    return {
      mainSolenoid: {
        ...danfossValves[0],
        size: pipingSizes.mainLiquid,
        quantity: requirements.rooms.count
      },
      pressureRegulating: {
        ...danfossValves[1],
        size: pipingSizes.mainSuction,
        quantity: 2 // One per circuit
      },
      stopValves: {
        ...danfossValves[2],
        sizes: [pipingSizes.mainSuction, pipingSizes.mainLiquid, pipingSizes.mainHotGas],
        quantity: requirements.rooms.count * 3 // 3 per room
      }
    };
  }

  // Generate comprehensive P&ID layout data
  generatePIDLayout(specifications) {
    const { rooms, compressors, condensers, vessels, pipingSizes } = specifications;
    
    // Generate engine room layout
    const engineRoomLayout = this.generateEngineRoomLayout(compressors, condensers, vessels, pipingSizes);
    
    // Generate cold room stations layout
    const coldRoomLayout = this.generateColdRoomLayout(rooms, pipingSizes);
    
    return {
      engineRoom: engineRoomLayout,
      coldRooms: coldRoomLayout,
      pipingSchedule: this.generatePipingSchedule(pipingSizes),
      equipmentList: this.generateEquipmentList(specifications)
    };
  }

  generateEngineRoomLayout(compressors, condensers, vessels, pipingSizes) {
    const components = [];
    const pipes = [];
    
    // Position compressors
    compressors.forEach((comp, index) => {
      components.push({
        id: `COMP-${index + 1}`,
        type: 'compressor',
        x: 100 + index * 150,
        y: 200,
        width: 80,
        height: 60,
        rotation: 0,
        label: `${comp.model}`,
        tag: `C-${index + 1}`,
        specifications: {
          capacity: comp.capacity,
          model: comp.model,
          manufacturer: 'BITZER',
          power: comp.power
        },
        connections: []
      });
    });
    
    // Position condensers
    condensers.forEach((cond, index) => {
      components.push({
        id: `COND-${index + 1}`,
        type: 'condenser',
        x: 400,
        y: 100,
        width: 120,
        height: 80,
        rotation: 0,
        label: `${cond.model}`,
        tag: `EC-${index + 1}`,
        specifications: {
          capacity: cond.capacity,
          model: cond.model,
          manufacturer: cond.manufacturer,
          power: cond.power
        },
        connections: []
      });
    });
    
    // Position vessels
    vessels.forEach((vessel, index) => {
      const x = 600 + (index % 3) * 100;
      const y = 150 + Math.floor(index / 3) * 120;
      
      components.push({
        id: vessel.tag,
        type: 'vessel',
        x: x,
        y: y,
        width: 60,
        height: 100,
        rotation: 0,
        label: vessel.type,
        tag: vessel.tag,
        specifications: {
          volume: vessel.volume,
          diameter: vessel.diameter,
          length: vessel.length
        },
        connections: []
      });
    });
    
    // Generate main piping connections
    pipes.push({
      id: 'MAIN-SUCTION',
      points: [180, 230, 400, 230, 400, 180, 520, 180],
      lineType: 'solid',
      lineWeight: 'MAIN_PROCESS',
      fluidType: 'ammonia_suction',
      size: pipingSizes.mainSuction,
      material: pipingSizes.material,
      flowDirection: 'forward',
      insulated: true,
      label: 'Main Suction Line'
    });
    
    pipes.push({
      id: 'MAIN-DISCHARGE',
      points: [180, 200, 400, 200, 400, 140, 520, 140],
      lineType: 'solid',
      lineWeight: 'MAIN_PROCESS',
      fluidType: 'ammonia_hot_gas',
      size: pipingSizes.mainHotGas,
      material: pipingSizes.material,
      flowDirection: 'forward',
      insulated: false,
      label: 'Hot Gas Line'
    });
    
    return { components, pipes };
  }

  generateColdRoomLayout(rooms, pipingSizes) {
    const layouts = [];
    
    rooms.forEach((room, index) => {
      const components = [];
      const pipes = [];
      
      // Position evaporators in room
      room.evaporators.forEach((evap, evapIndex) => {
        components.push({
          id: `EVAP-${room.roomNumber}-${evapIndex + 1}`,
          type: 'evaporator',
          x: 50 + evapIndex * 200,
          y: 100,
          width: 150,
          height: 60,
          rotation: 0,
          label: evap.model,
          tag: `AE-${room.roomNumber}.${evapIndex + 1}`,
          specifications: {
            capacity: evap.capacity,
            model: evap.model,
            manufacturer: 'GUNTNER',
            fans: evap.fans,
            fanSize: evap.fanSize
          },
          connections: []
        });
      });
      
      // Room piping
      pipes.push({
        id: `ROOM-${room.roomNumber}-LIQUID`,
        points: [25, 130, 200, 130],
        lineType: 'solid',
        lineWeight: 'SECONDARY',
        fluidType: 'ammonia_liquid',
        size: pipingSizes.branchLiquid,
        material: pipingSizes.material,
        flowDirection: 'forward',
        insulated: true,
        label: `Room ${room.roomNumber} Liquid`
      });
      
      pipes.push({
        id: `ROOM-${room.roomNumber}-SUCTION`,
        points: [25, 160, 200, 160],
        lineType: 'solid',
        lineWeight: 'SECONDARY',
        fluidType: 'ammonia_suction',
        size: pipingSizes.branchSuction,
        material: pipingSizes.material,
        flowDirection: 'reverse',
        insulated: true,
        label: `Room ${room.roomNumber} Suction`
      });
      
      layouts.push({
        roomNumber: room.roomNumber,
        temperatureRange: room.temperatureRange,
        components,
        pipes
      });
    });
    
    return layouts;
  }

  generatePipingSchedule(pipingSizes) {
    return {
      mainLines: [
        { service: 'Main Suction', size: pipingSizes.mainSuction, material: pipingSizes.material, insulation: pipingSizes.insulation },
        { service: 'Main Liquid', size: pipingSizes.mainLiquid, material: pipingSizes.material, insulation: pipingSizes.insulation },
        { service: 'Main Hot Gas', size: pipingSizes.mainHotGas, material: pipingSizes.material, insulation: 'None' }
      ],
      branchLines: [
        { service: 'Branch Suction', size: pipingSizes.branchSuction, material: pipingSizes.material, insulation: pipingSizes.insulation },
        { service: 'Branch Liquid', size: pipingSizes.branchLiquid, material: pipingSizes.material, insulation: pipingSizes.insulation }
      ]
    };
  }

  generateEquipmentList(specifications) {
    const { rooms, compressors, condensers, vessels, valveSpecs } = specifications;
    
    return {
      compressors: compressors.map(comp => ({
        tag: comp.circuit === 'circuit_1' ? 'C-1' : 'C-2',
        description: `${comp.model} Screw Compressor`,
        manufacturer: 'BITZER',
        capacity: comp.capacity,
        power: comp.power,
        quantity: comp.quantity
      })),
      
      evaporators: rooms.flatMap(room => 
        room.evaporators.map((evap, index) => ({
          tag: `AE-${room.roomNumber}.${index + 1}`,
          description: `${evap.model} Air Cooler`,
          manufacturer: 'GUNTNER',
          capacity: evap.capacity,
          fans: evap.fans,
          fanSize: evap.fanSize,
          quantity: evap.quantity
        }))
      ),
      
      condensers: condensers.map((cond, index) => ({
        tag: `EC-${index + 1}`,
        description: `${cond.model} Evaporative Condenser`,
        manufacturer: cond.manufacturer,
        capacity: cond.capacity,
        power: cond.power,
        fans: cond.fans,
        quantity: cond.quantity
      })),
      
      vessels: vessels.map(vessel => ({
        tag: vessel.tag,
        description: vessel.type,
        manufacturer: 'ACME Engineering',
        volume: vessel.volume,
        diameter: vessel.diameter,
        length: vessel.length,
        quantity: vessel.quantity
      })),
      
      valves: [
        {
          description: `${valveSpecs.mainSolenoid.model} Solenoid Valve`,
          manufacturer: 'DANFOSS',
          size: valveSpecs.mainSolenoid.size,
          quantity: valveSpecs.mainSolenoid.quantity
        },
        {
          description: `${valveSpecs.pressureRegulating.model} Pressure Regulating Valve`,
          manufacturer: 'DANFOSS',
          size: valveSpecs.pressureRegulating.size,
          quantity: valveSpecs.pressureRegulating.quantity
        }
      ]
    };
  }

  // Main calculation method
  calculate(prompt) {
    console.log('🧮 Starting ammonia system calculation...');
    
    // Parse requirements
    const requirements = this.parseSystemRequirements(prompt);
    console.log('📋 System requirements:', requirements);
    
    // Calculate specifications
    const specifications = this.calculateSystemSpecs(requirements);
    console.log('🔧 System specifications calculated');
    
    // Generate P&ID layouts
    const pidLayouts = this.generatePIDLayout(specifications);
    console.log('📐 P&ID layouts generated');
    
    return {
      requirements,
      specifications,
      pidLayouts,
      summary: this.generateSummary(requirements, specifications)
    };
  }

  generateSummary(requirements, specifications) {
    const totalEvaporators = specifications.rooms.reduce((sum, room) => sum + room.evaporators.length, 0);
    const totalCompressorPower = specifications.compressors.reduce((sum, comp) => sum + parseInt(comp.power), 0);
    
    return {
      systemCapacity: `${requirements.totalCapacity} tons`,
      numberOfRooms: requirements.rooms.count,
      totalEvaporators: totalEvaporators,
      compressorCount: specifications.compressors.length,
      totalCompressorPower: `${totalCompressorPower} kW`,
      condenserCount: specifications.condensers.length,
      vesselCount: specifications.vessels.length,
      pipeMaterial: specifications.pipingSizes.material,
      refrigerant: 'Ammonia (NH3)'
    };
  }
}

module.exports = AmmoniaSystemCalculator;