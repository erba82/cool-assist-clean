/**
 * PipeSizingCalculator - DN Sizing and Valve Placement
 * 
 * Calculates proper DN pipe sizes based on:
 * - Refrigerant flow rate
 * - Pressure drop limits
 * - Recommended velocities
 * - ASHRAE/ISO standards
 * 
 * Also generates valve placements with proper tags
 * 
 * @version 1.0.0
 */

class PipeSizingCalculator {
    constructor() {
        // Standard DN sizes (ISO 6708)
        this.dnSizes = [
            10, 15, 20, 25, 32, 40, 50, 65, 80, 100,
            125, 150, 200, 250, 300, 350, 400, 450, 500
        ];

        // Recommended velocities (m/s) for ammonia systems
        this.velocityLimits = {
            suction: {
                min: 6,
                max: 15,
                recommended: 10
            },
            hotGas: {
                min: 8,
                max: 20,
                recommended: 12
            },
            liquid: {
                min: 0.5,
                max: 2,
                recommended: 1
            }
        };

        // Valve placement rules
        this.valveRules = {
            // Compressor
            compressor: {
                suction: ['SCV', 'STRAINER'],  // Suction stop valve, strainer
                discharge: ['SCV', 'CHECK'],    // Discharge stop valve, check valve
                oilSeparator: ['SCV']
            },
            // Evaporator
            evaporator: {
                liquidInlet: ['EVRA', 'SCV'],  // Expansion valve, stop valve
                vaporOutlet: ['SCV']
            },
            // Condenser
            condenser: {
                hotGasInlet: ['SCV'],
                liquidOutlet: ['SCV', 'CHECK']
            },
            // Receiver
            receiver: {
                liquidInlet: ['SCV'],
                liquidOutlet: ['SCV', 'SIGHT_GLASS']
            },
            // Separator
            separator: {
                vaporInlet: ['SCV'],
                vaporOutlet: ['SCV'],
                liquidDrain: ['SOLENOID']
            }
        };
    }

    /**
     * Calculate DN size based on capacity and line type
     * @param {number} capacity - Cooling capacity in kW
     * @param {string} lineType - 'suction', 'hotGas', 'liquid'
     * @param {number} evapTemp - Evaporating temperature (°C)
     * @param {string} refrigerant - Refrigerant type (R717, R404A, etc.)
     * @returns {Object} {dn, velocity, massFlow}
     */
    calculateDN(capacity, lineType, evapTemp = -18, refrigerant = 'R717') {
        // Simplified calculation - real version would use CoolProp

        // Estimate mass flow rate (kg/s)
        // For R717 at -18°C: latent heat ~1200 kJ/kg
        const latentHeat = this._getLatentHeat(refrigerant, evapTemp);
        const massFlow = capacity / latentHeat;  // kg/s

        // Get density (kg/m³)
        const density = this._getDensity(refrigerant, lineType, evapTemp);

        // Calculate volume flow (m³/s)
        const volumeFlow = massFlow / density;

        // Select DN based on recommended velocity
        const velocity = this.velocityLimits[lineType].recommended;
        const requiredArea = volumeFlow / velocity;  // m²
        const requiredDiameter = Math.sqrt(4 * requiredArea / Math.PI) * 1000;  // mm

        // Find next larger DN
        const dn = this._findClosestDN(requiredDiameter);

        // Calculate actual velocity
        const actualDiameter = this._getDNDiameter(dn) / 1000;  // m
        const actualArea = Math.PI * actualDiameter * actualDiameter / 4;
        const actualVelocity = volumeFlow / actualArea;

        return {
            dn: `DN${dn}`,
            nominalSize: dn,
            velocity: actualVelocity.toFixed(1),
            massFlow: (massFlow * 3600).toFixed(0),  // kg/h
            volumeFlow: (volumeFlow * 3600).toFixed(2),  // m³/h
            pressureDrop: this._estimatePressureDrop(dn, volumeFlow, lineType)
        };
    }

    /**
     * Generate valve placements for a pipe segment
     * @param {Object} pipe - Pipe object with from/to/type
     * @param {Object} equipment - Equipment database
     * @returns {Array} Valve objects with positions and tags
     */
    generateValves(pipe, equipment) {
        const valves = [];
        const fromEquip = equipment.find(e => e.id === pipe.from);
        const toEquip = equipment.find(e => e.id === pipe.to);

        if (!fromEquip || !toEquip) return valves;

        // Determine valve requirements based on equipment types
        let valveTypes = [];

        // At source equipment
        if (fromEquip.type === 'evaporator' && pipe.type === 'suction') {
            valveTypes.push({ type: 'SCV', location: 'outlet', tag: `${fromEquip.id}-SCV-OUT` });
        } else if (fromEquip.type === 'compressor' && pipe.type === 'hotGas') {
            valveTypes.push({ type: 'SCV', location: 'outlet', tag: `${fromEquip.id}-SCV-DIS` });
            valveTypes.push({ type: 'CHECK', location: 'outlet', tag: `${fromEquip.id}-CHK-DIS` });
        }

        // At destination equipment
        if (toEquip.type === 'compressor' && pipe.type === 'suction') {
            valveTypes.push({ type: 'STRAINER', location: 'inlet', tag: `${toEquip.id}-STR-SUC` });
            valveTypes.push({ type: 'SCV', location: 'inlet', tag: `${toEquip.id}-SCV-SUC` });
        } else if (toEquip.type === 'evaporator' && pipe.type === 'liquid') {
            valveTypes.push({ type: 'EVRA', location: 'inlet', tag: `${toEquip.id}-EVRA` });
            valveTypes.push({ type: 'SCV', location: 'inlet', tag: `${toEquip.id}-SCV-LIQ` });
        }

        // Position valves along pipe path
        const pipeLen = this._calculatePipeLength(pipe.points);

        valveTypes.forEach((valve, index) => {
            // Place valve at appropriate position
            const position = valve.location === 'outlet' ? 0.15 : 0.85;
            const point = this._interpolatePoint(pipe.points, position);

            valves.push({
                id: valve.tag,
                type: valve.type,
                symbolType: this._getValveSymbol(valve.type),
                x: point.x,
                y: point.y,
                tag: valve.tag,
                size: pipe.size || 'DN50',
                rotation: this._calculateRotation(pipe.points, position),
                specs: this._getValveSpecs(valve.type, pipe)
            });
        });

        return valves;
    }

    /**
     * Add instrumentation to pipes
     */
    generateInstrumentation(pipe, equipment) {
        const instruments = [];

        // Pressure indicators on suction and discharge
        if (pipe.type === 'suction') {
            const midPoint = this._interpolatePoint(pipe.points, 0.5);
            instruments.push({
                type: 'PI',
                tag: `PI-${pipe.from}`,
                x: midPoint.x,
                y: midPoint.y - 20,
                withTransmitter: true,
                withAlarm: true
            });
        } else if (pipe.type === 'hotGas') {
            const midPoint = this._interpolatePoint(pipe.points, 0.3);
            instruments.push({
                type: 'PI',
                tag: `PI-${pipe.from}-DIS`,
                x: midPoint.x,
                y: midPoint.y - 20,
                withTransmitter: true,
                withAlarm: true
            });
        }

        // Temperature indicators
        if (pipe.type === 'suction' || pipe.type === 'hotGas') {
            const point = this._interpolatePoint(pipe.points, 0.7);
            instruments.push({
                type: 'TI',
                tag: `TI-${pipe.from}`,
                x: point.x + 15,
                y: point.y,
                withTransmitter: true
            });
        }

        return instruments;
    }

    // === HELPER METHODS ===

    _getLatentHeat(refrigerant, temp) {
        // Simplified - in production use CoolProp
        const data = {
            'R717': { '-40': 1300, '-30': 1280, '-20': 1260, '-10': 1240, '0': 1220 },
            'R404A': { '-40': 180, '-30': 175, '-20': 165, '-10': 155, '0': 145 }
        };
        return data[refrigerant]?.[temp.toString()] || 1200;
    }

    _getDensity(refrigerant, lineType, temp) {
        // Simplified vapor/liquid densities
        if (lineType === 'liquid') {
            return refrigerant === 'R717' ? 600 : 1050;
        } else {
            // Vapor density varies with temperature
            const vapDensity = {
                'R717': { '-40': 0.8, '-30': 1.1, '-20': 1.5, '-10': 2.0, '0': 2.6 },
                'R404A': { '-40': 10, '-30': 13, '-20': 17, '-10': 22, '0': 28 }
            };
            return vapDensity[refrigerant]?.[temp.toString()] || 1.5;
        }
    }

    _findClosestDN(diameter) {
        // Find DN that is >= required diameter
        for (let dn of this.dnSizes) {
            if (this._getDNDiameter(dn) >= diameter) {
                return dn;
            }
        }
        return this.dnSizes[this.dnSizes.length - 1];
    }

    _getDNDiameter(dn) {
        // Approximate inside diameter for schedule 40 pipe (mm)
        const diameters = {
            10: 10.2, 15: 15.8, 20: 20.9, 25: 26.6, 32: 35.0,
            40: 40.9, 50: 52.5, 65: 62.7, 80: 77.9, 100: 102.3,
            125: 128.2, 150: 154.1, 200: 202.7, 250: 254.5, 300: 303.2
        };
        return diameters[dn] || dn;
    }

    _estimatePressureDrop(dn, volumeFlow, lineType) {
        // Very simplified - real version uses Darcy-Weisbach
        const diameter = this._getDNDiameter(dn) / 1000;  // m
        const area = Math.PI * diameter * diameter / 4;
        const velocity = volumeFlow / area;

        // Rough estimate: dP (Pa/m) ~ velocity²
        const dpPerMeter = velocity * velocity * 10;
        return dpPerMeter.toFixed(1);
    }

    _getValveSymbol(valveType) {
        const mapping = {
            'SCV': 'GlobeValve',
            'SOV': 'SolenoidValve',
            'EVRA': 'ExpansionValve',
            'CHECK': 'CheckValve',
            'SAFETY': 'SafetyValve',
            'BALL': 'BallValve',
            'REG': 'RegulatingValve',
            'STRAINER': 'Filter'
        };
        return mapping[valveType] || 'GlobeValve';
    }

    _getValveSpecs(valveType, pipe) {
        if (valveType === 'EVRA') {
            return {
                model: 'EVRA-25',
                capacity: pipe.capacity || 'TBD'
            };
        } else if (valveType === 'SAFETY') {
            return {
                setPressure: '25 bar'
            };
        }
        return {};
    }

    _calculatePipeLength(points) {
        let length = 0;
        for (let i = 0; i < points.length - 1; i++) {
            const dx = points[i + 1].x - points[i].x;
            const dy = points[i + 1].y - points[i].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length;
    }

    _interpolatePoint(points, fraction) {
        const totalLen = this._calculatePipeLength(points);
        const targetLen = totalLen * fraction;

        let accLen = 0;
        for (let i = 0; i < points.length - 1; i++) {
            const dx = points[i + 1].x - points[i].x;
            const dy = points[i + 1].y - points[i].y;
            const segLen = Math.sqrt(dx * dx + dy * dy);

            if (accLen + segLen >= targetLen) {
                const t = (targetLen - accLen) / segLen;
                return {
                    x: points[i].x + dx * t,
                    y: points[i].y + dy * t
                };
            }
            accLen += segLen;
        }
        return points[points.length - 1];
    }

    _calculateRotation(points, fraction) {
        const point = this._interpolatePoint(points, fraction);
        // Find nearest segment to determine angle
        // Simplified: return 0 for now
        return 0;
    }
}

module.exports = PipeSizingCalculator;
