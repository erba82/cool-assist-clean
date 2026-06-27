// src/components/ammonia/EngineeringCore.ts
// The Physics Engine for Ammonia Refrigeration Systems

export interface Room {
    id: string;
    name: string;
    temperature: number; // °C
    type: 'blast' | 'cold' | 'chill' | 'precool';
    dimensions: {
        length: number; // meters
        width: number;  // meters
        height: number; // meters
    };
    productLoad: {
        weight: number;     // kg
        initialTemp: number; // °C
        finalTemp: number;   // °C
        shiftTime: number;   // hours
        specificHeat: number; // kJ/kg·K
    };
    transmissionLoad: {
        uValue: number; // W/m²·K
        ambientTemp: number; // °C
    };
    totalLoad: number; // kW
}

export interface LoadCalculation {
    lowStageLoad: number; // kW
    highStageLoad: number; // kW
    totalHeatRejection: number; // kW
    rooms: Room[];
}

export class RefrigerationEngine {
    /**
     * Calculate product load using Q = (M × Cp × ΔT) / Time
     * @param mass_kg Product mass in kg
     * @param specificHeat_kJ_kgK Specific heat in kJ/kg·K
     * @param tempDiff_K Temperature difference in Kelvin
     * @param time_hours Time in hours
     * @returns Load in kW
     */
    static calculateProductLoad(
        mass_kg: number,
        specificHeat_kJ_kgK: number,
        tempDiff_K: number,
        time_hours: number
    ): number {
        const energy_kJ = mass_kg * specificHeat_kJ_kgK * tempDiff_K;
        const time_seconds = time_hours * 3600;
        return energy_kJ / time_seconds; // kW
    }

    /**
     * Calculate transmission load using Q = U × A × ΔT
     * @param area_m2 Surface area in m²
     * @param uValue_W_m2K U-value in W/m²·K
     * @param tempDiff_K Temperature difference in Kelvin
     * @returns Load in kW
     */
    static calculateTransmissionLoad(
        area_m2: number,
        uValue_W_m2K: number,
        tempDiff_K: number
    ): number {
        return (area_m2 * uValue_W_m2K * tempDiff_K) / 1000; // kW
    }

    /**
     * Calculate electrical current using I = kW × 1000 / (√3 × V × PF)
     * @param powerKW Power in kW
     * @param voltage Voltage in volts (default 380V)
     * @returns Current in amps
     */
    static calculateAmps(powerKW: number, voltage: number = 380): number {
        const powerFactor = 0.85;
        return (powerKW * 1000) / (Math.sqrt(3) * voltage * powerFactor);
    }

    /**
     * Size ammonia line based on velocity
     * Suction: 12 m/s, Discharge: 18 m/s
     * @param capacityKW Cooling capacity in kW
     * @param type Line type
     * @returns Recommended pipe DN size in mm
     */
    static sizeLine(capacityKW: number, type: 'suction' | 'discharge'): number {
        // Simplified: 1 kW ≈ 0.001 kg/s at -40°C
        const massFlow = capacityKW * 0.001;
        // Density: Suction ~0.3 kg/m³, Discharge ~1.0 kg/m³
        const density = type === 'suction' ? 0.3 : 1.0;
        const velocity = type === 'suction' ? 12 : 18;
        
        const volFlow = massFlow / density; // m³/s
        const area = volFlow / velocity; // m²
        const dia_m = Math.sqrt((4 * area) / Math.PI);
        const dia_mm = dia_m * 1000;
        
        // Standard DN sizes
        const standardDN = [15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300];
        return standardDN.find(d => d >= dia_mm) || 300;
    }

    /**
     * Automatically choose system type based on temperature
     * @param temperature Temperature in °C
     * @returns System type recommendation
     */
    static selectSystemType(temperature: number): 'single' | 'twoStage' | 'cascade' {
        if (temperature < -45) return 'cascade';
        if (temperature < -25) return 'twoStage';
        return 'single';
    }

    /**
     * Calculate surface area of a room
     * @param length Length in meters
     * @param width Width in meters
     * @param height Height in meters
     * @returns Surface area in m²
     */
    static calculateSurfaceArea(length: number, width: number, height: number): number {
        return 2 * (length * width + length * height + width * height);
    }

    /**
     * Build Ardabil Slaughterhouse Scenario
     * @returns Load calculation with all rooms
     */
    static buildArdabilScenario(): LoadCalculation {
        console.log('🏭 Building Ardabil Slaughterhouse Scenario...');
        
        const rooms: Room[] = [];
        const U_VALUE = 0.22; // W/(m²·K)
        const AMBIENT = 30; // °C
        
        // 1. Chilling Room: 20×8×4m @ -5°C
        const chillLength = 20;
        const chillWidth = 8;
        const chillHeight = 4;
        const chillArea = this.calculateSurfaceArea(chillLength, chillWidth, chillHeight);
        const chillTrans = this.calculateTransmissionLoad(chillArea, U_VALUE, AMBIENT - (-5));
        const chillProd = this.calculateProductLoad(600, 3.2, 20, 0.5); // 600kg, 30min
        rooms.push({
            id: 'chill-1',
            name: 'Chilling Room',
            temperature: -5,
            type: 'chill',
            dimensions: { length: chillLength, width: chillWidth, height: chillHeight },
            productLoad: { weight: 600, initialTemp: 25, finalTemp: -5, shiftTime: 0.5, specificHeat: 3.2 },
            transmissionLoad: { uValue: U_VALUE, ambientTemp: AMBIENT },
            totalLoad: chillTrans + chillProd
        });

        // 2. Blast Freezers: 4× (4×4×4m) @ -40°C
        for (let i = 1; i <= 4; i++) {
            const bfLength = 4;
            const bfWidth = 4;
            const bfHeight = 4;
            const bfArea = this.calculateSurfaceArea(bfLength, bfWidth, bfHeight);
            const bfTrans = this.calculateTransmissionLoad(bfArea, U_VALUE, AMBIENT - (-40));
            const bfProd = this.calculateProductLoad(1000, 1.7, 13, 8); // 1000kg, 8hr
            rooms.push({
                id: `blast-${i}`,
                name: `Blast Freezer ${i}`,
                temperature: -40,
                type: 'blast',
                dimensions: { length: bfLength, width: bfWidth, height: bfHeight },
                productLoad: { weight: 1000, initialTemp: 10, finalTemp: -40, shiftTime: 8, specificHeat: 1.7 },
                transmissionLoad: { uValue: U_VALUE, ambientTemp: AMBIENT },
                totalLoad: bfTrans + bfProd
            });
        }

        // 3. Pre-coolers: 4× (10×8×9m) @ -5°C
        for (let i = 1; i <= 4; i++) {
            const pcLength = 10;
            const pcWidth = 8;
            const pcHeight = 9;
            const pcArea = this.calculateSurfaceArea(pcLength, pcWidth, pcHeight);
            const pcTrans = this.calculateTransmissionLoad(pcArea, U_VALUE, AMBIENT - (-5));
            rooms.push({
                id: `precool-${i}`,
                name: `Pre-cooler ${i}`,
                temperature: -5,
                type: 'precool',
                dimensions: { length: pcLength, width: pcWidth, height: pcHeight },
                productLoad: { weight: 0, initialTemp: 0, finalTemp: 0, shiftTime: 0, specificHeat: 0 },
                transmissionLoad: { uValue: U_VALUE, ambientTemp: AMBIENT },
                totalLoad: pcTrans
            });
        }

        // 4. Cold Stores: 4× (20×15×9m) @ -18°C
        for (let i = 1; i <= 4; i++) {
            const csLength = 20;
            const csWidth = 15;
            const csHeight = 9;
            const csArea = this.calculateSurfaceArea(csLength, csWidth, csHeight);
            const csTrans = this.calculateTransmissionLoad(csArea, U_VALUE, AMBIENT - (-18));
            rooms.push({
                id: `cold-${i}`,
                name: `Cold Store ${i}`,
                temperature: -18,
                type: 'cold',
                dimensions: { length: csLength, width: csWidth, height: csHeight },
                productLoad: { weight: 0, initialTemp: 0, finalTemp: 0, shiftTime: 0, specificHeat: 0 },
                transmissionLoad: { uValue: U_VALUE, ambientTemp: AMBIENT },
                totalLoad: csTrans
            });
        }

        // Calculate stage loads
        const lowStageLoad = rooms.filter(r => r.type === 'blast').reduce((s, r) => s + r.totalLoad, 0);
        const highStageLoad = rooms.filter(r => r.type !== 'blast').reduce((s, r) => s + r.totalLoad, 0);

        console.log('✅ Scenario built:', { lowStageLoad, highStageLoad });
        
        return {
            lowStageLoad,
            highStageLoad,
            totalHeatRejection: lowStageLoad + highStageLoad, // Simplified calculation
            rooms
        };
    }
}