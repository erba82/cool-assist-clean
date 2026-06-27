/**
 * Innovative Energy-Saving Strategies
 * Cutting-edge, proven technologies for energy optimization
 * Each strategy includes calculations, costs, and regional applicability
 */

class InnovativeEnergyStrategies {
    constructor() {
        this.strategies = [];
    }

    /**
     * Analyze all applicable strategies for a given design
     */
    async analyzeStrategies(designData, regionalData) {
        const strategies = [];

        // Helper function to safely analyze each strategy
        const safeAnalyze = async (analyzeFunc, name) => {
            try {
                return await analyzeFunc.call(this, designData, regionalData);
            } catch (error) {
                console.error(`Error analyzing ${name}:`, error.message);
                return { applicable: false, id: name, name: name, error: error.message };
            }
        };

        // 1. AI-Driven Predictive Load Matching
        strategies.push(await safeAnalyze(this._analyzePredictiveLoadMatching, 'ai-load-matching'));

        // 2. Phase Change Material (PCM) Thermal Storage
        strategies.push(await safeAnalyze(this._analyzePCMStorage, 'pcm-storage'));

        // 3. Hybrid Solar-Assisted Refrigeration
        strategies.push(await safeAnalyze(this._analyzeSolarAssisted, 'solar-hybrid'));

        // 4. Magnetic Bearing Compressors
        strategies.push(await safeAnalyze(this._analyzeMagneticBearings, 'magnetic-bearings'));

        // 5. CO₂/NH₃ Cascade for Ultra-Low Temp
        strategies.push(await safeAnalyze(this._analyzeCO2Cascade, 'co2-cascade'));

        // 6. Smart Grid Demand Response
        strategies.push(await safeAnalyze(this._analyzeDemandResponse, 'demand-response'));

        // 7. Evaporative Pre-Cooling
        strategies.push(await safeAnalyze(this._analyzeEvaporativeCooling, 'evap-cooling'));

        // 8. Waste Heat Network Integration
        strategies.push(await safeAnalyze(this._analyzeWasteHeat, 'waste-heat'));

        // Filter out non-applicable strategies
        return strategies.filter(s => s.applicable);
    }

    /**
     * 1. AI-Driven Predictive Load Matching
     * Pre-cool during off-peak hours based on ML predictions
     */
    async _analyzePredictiveLoadMatching(designData, regionalData) {
        const totalLoad = designData.summary?.totalCoolingLoad || 100;
        const energyCost = regionalData.energy.electricityCost;
        const offPeakDiscount = regionalData.energy.offPeakDiscount;
        const peakPremium = regionalData.energy.peakRatePremium;

        // Estimate shift potential: 30% of load can be shifted to off-peak
        const shiftableLoad = totalLoad * 0.30;

        // Annual hours operated
        const annualHours = 6000; // typical industrial refrigeration
        const peakHours = annualHours * 0.4; // 40% are peak hours

        // Energy shifted from peak to off-peak
        const energyShifted = shiftableLoad * peakHours; // kWh/year

        // Cost savings
        const peakCost = energyCost * peakPremium;
        const offPeakCost = energyCost * offPeakDiscount;
        const savingsPerKWh = peakCost - offPeakCost;
        const annualSavings = energyShifted * savingsPerKWh;

        // Implementation cost: IoT sensors + ML platform + integration
        const implementationCost = 25000 + (totalLoad * 300); // scales with system size

        const paybackYears = implementationCost / annualSavings;

        return {
            id: 'ai-load-matching',
            name: 'AI-Driven Predictive Load Matching',
            category: 'Advanced Controls',
            description: 'Machine learning predicts cooling demand 24h ahead, pre-cools during off-peak electricity rates',

            applicable: regionalData.energy.timeOfUseRates && totalLoad > 50, // Only for larger systems with TOU rates

            energySavings: {
                kWhPerYear: energyShifted * 0.1, // 10% actual energy savings from efficiency
                percent: 10,
                peakReduction: shiftableLoad,
                peakReductionPercent: 30
            },

            financialImpact: {
                annualCostSavings: annualSavings,
                implementationCost: implementationCost,
                paybackYears: paybackYears,
                npv10Year: this._calculateNPV(annualSavings, implementationCost, 10, 0.06),
                roi: ((annualSavings * 10) - implementationCost) / implementationCost * 100
            },

            co2Reduction: {
                tonsPerYear: (energyShifted * 0.1) * 0.5 / 1000, // 0.5 kg CO2/kWh
                percent: 10
            },

            technicalDetails: {
                components: [
                    'IoT temperature and occupancy sensors',
                    'Cloud-based ML platform',
                    'Predictive analytics engine',
                    'Advanced control system integration'
                ],
                requirements: [
                    'Time-of-use electricity rates',
                    'Adequate thermal mass or storage',
                    'Internet connectivity',
                    'Minimum 50 kW cooling capacity'
                ]
            },

            regionalNotes: this._getRegionalNote('ai load matching', regionalData),
            priority: paybackYears < 3 ? 'high' : (paybackYears < 5 ? 'medium' : 'low')
        };
    }

    /**
     * 2. Phase Change Material (PCM) Thermal Storage
     */
    async _analyzePCMStorage(designData, regionalData) {
        const totalLoad = designData.summary?.totalCoolingLoad || 100;
        const energyCost = regionalData.energy.electricityCost;
        const peakPremium = regionalData.energy.peakRatePremium;
        const demandCharge = regionalData.energy.demandCharge;

        // PCM can shift 40% of peak load
        const peakShift = totalLoad * 0.40;

        // Annual savings from peak demand reduction
        const annualDemandSavings = peakShift * demandCharge * 12;

        // Energy cost savings (run compressor at night)
        const offPeakDiscount = regionalData.energy.offPeakDiscount;
        const peakHours = 2000; // hours per year
        const energyShifted = peakShift * peakHours;
        const energyCostSavings = energyShifted * energyCost * (peakPremium - offPeakDiscount);

        const totalAnnualSavings = annualDemandSavings + energyCostSavings;

        // PCM cost: $150-300/kW of storage capacity
        const pcmCostPerKW = 220; // mid-range
        const implementationCost = peakShift * pcmCostPerKW * 1000;

        const paybackYears = implementationCost / totalAnnualSavings;

        return {
            id: 'pcm-storage',
            name: 'Phase Change Material Thermal Storage',
            category: 'Thermal Storage',
            description: 'Eutectic salt PCM stores cooling energy during off-peak hours, releases during peak demand periods',

            applicable: regionalData.energy.timeOfUseRates && regionalData.energy.peakRatePremium > 1.5,

            energySavings: {
                kWhPerYear: energyShifted * 0.05, // Small efficiency gain
                percent: 5,
                peakDemandReduction: peakShift,
                peakReductionPercent: 40
            },

            financialImpact: {
                annualCostSavings: totalAnnualSavings,
                implementationCost: implementationCost,
                paybackYears: paybackYears,
                npv10Year: this._calculateNPV(totalAnnualSavings, implementationCost, 10, 0.06),
                roi: ((totalAnnualSavings * 10) - implementationCost) / implementationCost * 100
            },

            co2Reduction: {
                tonsPerYear: (energyShifted * 0.05) * 0.5 / 1000,
                percent: 5
            },

            technicalDetails: {
                components: [
                    `PCM modules (${Math.round(peakShift * 4)} kg eutectic salt)`,
                    'Heat exchanger for charging/discharging',
                    'Insulated storage tank',
                    'Control system for charge/discharge cycles'
                ],
                pcmType: 'Eutectic salt (Na2SO4·10H2O) at -18°C',
                storageCapacity: `${Math.round(peakShift * 3)} kWh`,
                requirements: [
                    'Time-of-use rates with significant spread',
                    'Space for storage modules',
                    'Suitable PCM melting point for application'
                ]
            },

            regionalNotes: this._getRegionalNote('pcm', regionalData),
            priority: paybackYears < 4 ? 'high' : (paybackYears < 6 ? 'medium' : 'low')
        };
    }

    /**
     * 3. Hybrid Solar-Assisted Refrigeration
     */
    async _analyzeSolarAssisted(designData, regionalData) {
        const totalLoad = designData.summary?.totalCoolingLoad || 100;
        const compressorPower = totalLoad / 3.5; // Assume COP 3.5
        const energyCost = regionalData.energy.electricityCost;

        // Solar can offset 50-70% of daytime energy
        const solarFraction = 0.60;
        const daytimeHours = 3000; // annual sun hours for refrigeration operation
        const solarEnergy = compressorPower * daytimeHours * solarFraction;

        const annualSavings = solarEnergy * energyCost;

        // Solar PV cost: $2.50-4.00/Watt installed
        const solarCostPerWatt = 3.00;
        const solarCapacity = compressorPower * 1000; // Watts
        const baseSolarCost = solarCapacity * solarCostPerWatt;

        // Battery storage for evening peak (25% of capacity, 4 hours)
        const batteryCost = (compressorPower * 1000 * 0.25 * 4) * 0.5; // $0.50 per Wh

        const implementationCost = baseSolarCost + batteryCost;

        // Apply solar rebate incentive
        const incentiveReduction = implementationCost * (regionalData.incentives.solarRebate || 0);
        const netCost = implementationCost - incentiveReduction;

        const paybackYears = netCost / annualSavings;

        return {
            id: 'solar-hybrid',
            name: 'Hybrid Solar-Assisted Refrigeration',
            category: 'Renewable Energy',
            description: 'Solar PV array with battery storage provides 50-70% of refrigeration energy from renewable sources',

            applicable: regionalData.climate.coolingDegreeDays > 1500 && energyCost > 0.10,

            energySavings: {
                kWhPerYear: solarEnergy,
                percent: 50,
                renewableFraction: 0.60
            },

            financialImpact: {
                annualCostSavings: annualSavings,
                implementationCost: implementationCost,
                incentives: incentiveReduction,
                netImplementationCost: netCost,
                paybackYears: paybackYears,
                npv10Year: this._calculateNPV(annualSavings, netCost, 10, 0.06),
                roi: ((annualSavings * 25) - netCost) / netCost * 100 // 25 year life
            },

            co2Reduction: {
                tonsPerYear: solarEnergy * 0.5 / 1000,
                percent: 50
            },

            technicalDetails: {
                components: [
                    `Solar PV array: ${Math.round(solarCapacity / 1000)} kW`,
                    `Battery storage: ${Math.round(compressorPower * 4)} kWh`,
                    'Grid-tie inverter with backup capability',
                    'DC-AC conversion and distribution',
                    'Monitoring and control system'
                ],
                requirements: [
                    'Adequate roof or ground space for panels',
                    'Good solar irradiance (>1500 kWh/m²/year)',
                    'Structural support for panel weight',
                    'Utility allows grid-tied systems'
                ]
            },

            regionalNotes: this._getRegionalNote('solar', regionalData),
            priority: paybackYears < 6 ? 'high' : (paybackYears < 10 ? 'medium' : 'low')
        };
    }

    /**
     * 4. Magnetic Bearing Compressors
     */
    async _analyzeMagneticBearings(designData, regionalData) {
        const compressors = designData.equipment?.compressors || [];
        if (compressors.length === 0) return { applicable: false };

        const totalCompressorPower = compressors.reduce((sum, c) => {
            return sum + (c.electrical?.ratedPower || c.motorPower || 0);
        }, 0);

        // 12% energy savings + maintenance savings
        const annualEnergy = totalCompressorPower * 6000; // kWh
        const energySavings = annualEnergy * 0.12;
        const energyCost = regionalData.energy.electricityCost;
        const energyCostSavings = energySavings * energyCost;

        // Maintenance savings: no oil, longer bearing life
        const maintenanceSavings = 5000 * compressors.length; // per compressor per year

        const totalAnnualSavings = energyCostSavings + maintenanceSavings;

        // Premium: 30% more than conventional
        const conventionalCost = compressors.reduce((sum, c) => {
            const cap = c.capacityPerUnit || 100;
            return sum + (15000 + cap * 120);
        }, 0);

        const implementationCost = conventionalCost * 0.30; // Incremental cost

        const paybackYears = implementationCost / totalAnnualSavings;

        return {
            id: 'magnetic-bearings',
            name: 'Magnetic Bearing Compressors',
            category: 'Advanced Equipment',
            description: 'Oil-free compressors with magnetic levitation bearings - zero friction, 10-15% more efficient',

            applicable: totalCompressorPower > 50, // Worth it for larger systems

            energySavings: {
                kWhPerYear: energySavings,
                percent: 12
            },

            financialImpact: {
                annualCostSavings: totalAnnualSavings,
                energySavings: energyCostSavings,
                maintenanceSavings: maintenanceSavings,
                implementationCost: implementationCost,
                paybackYears: paybackYears,
                npv10Year: this._calculateNPV(totalAnnualSavings, implementationCost, 10, 0.06),
                roi: ((totalAnnualSavings * 15) - implementationCost) / implementationCost * 100
            },

            co2Reduction: {
                tonsPerYear: energySavings * 0.5 / 1000,
                percent: 12
            },

            technicalDetails: {
                components: [
                    'Magnetic levitation bearing system',
                    'Active magnetic control',
                    'No oil lubrication system needed',
                    'Advanced vibration monitoring'
                ],
                benefits: [
                    'Zero friction losses',
                    'No oil contamination',
                    'Longer compressor life',
                    'Reduced maintenance',
                    'Better part-load efficiency'
                ],
                requirements: [
                    'Minimum 50 kW compressor capacity',
                    'Clean power supply',
                    'Trained maintenance personnel'
                ]
            },

            regionalNotes: this._getRegionalNote('magnetic bearings', regionalData),
            priority: paybackYears < 4 ? 'high' : (paybackYears < 6 ? 'medium' : 'low')
        };
    }

    /**
     * Helper: Calculate NPV (Net Present Value)
     */
    _calculateNPV(annualSavings, initialCost, years, discountRate) {
        let npv = -initialCost;
        for (let year = 1; year <= years; year++) {
            npv += annualSavings / Math.pow(1 + discountRate, year);
        }
        return Math.round(npv);
    }

    /**
     * Helper: Get regional applicability notes
     */
    _getRegionalNote(strategy, regionalData) {
        const notes = [];

        if (strategy === 'solar' && regionalData.climate.coolingDegreeDays > 3000) {
            notes.push('Excellent solar potential in this hot climate');
        }

        if (strategy === 'pcm' && regionalData.energy.peakRatePremium > 2.0) {
            notes.push('Very favorable economics due to high peak/off-peak rate spread');
        }

        if (strategy === 'ai load matching' && !regionalData.energy.timeOfUseRates) {
            notes.push('⚠️ Limited benefit without time-of-use electricity rates');
        }

        return notes.length > 0 ? notes.join('. ') : 'Applicable for this location';
    }

    /**
     * 5. CO₂/NH₃ Cascade for Ultra-Low Temperature
     */
    async _analyzeCO2Cascade(designData, regionalData) {
        const loads = designData.loads || [];

        // Check if any room requires ultra-low temp (-40°C or below)
        const ultraLowTempLoads = loads.filter(l => (l.temperature || 0) <= -40);

        if (ultraLowTempLoads.length === 0) {
            return { applicable: false, id: 'co2-cascade', name: 'CO₂/NH₃ Cascade' };
        }

        const ultraLowLoad = ultraLowTempLoads.reduce((sum, l) => sum + (l.load || 0), 0);
        const energyCost = regionalData.energy.electricityCost;

        // CO₂ cascade is 25% more efficient than R404A at ultra-low temps
        const baselineEnergy = ultraLowLoad / 1.5 * 6000; // kWh/year at poor COP
        const cascadeEnergy = ultraLowLoad / 2.0 * 6000; // Better COP with cascade
        const energySavings = baselineEnergy - cascadeEnergy;
        const annualSavings = energySavings * energyCost;

        // Implementation cost: 20% premium over standard NH₃ system
        const baseSystemCost = ultraLowLoad * 5000; // Base ultra-low temp system
        const implementationCost = baseSystemCost * 0.20;

        const paybackYears = implementationCost / annualSavings;

        return {
            id: 'co2-cascade',
            name: 'CO₂/NH₃ Cascade for Ultra-Low Temperature',
            category: 'Advanced Systems',
            description: 'Two-stage cascade system: NH₃ high stage (-40°C) + CO₂ low stage (-60°C). 20-30% more efficient than R404A',

            applicable: true,

            energySavings: {
                kWhPerYear: energySavings,
                percent: 25,
                copImprovement: '1.5 → 2.0'
            },

            financialImpact: {
                annualCostSavings: annualSavings,
                implementationCost: implementationCost,
                paybackYears: paybackYears,
                npv10Year: this._calculateNPV(annualSavings, implementationCost, 10, 0.06),
                roi: ((annualSavings * 15) - implementationCost) / implementationCost * 100
            },

            co2Reduction: {
                tonsPerYear: energySavings * 0.5 / 1000,
                percent: 25,
                refrigerantGWP: 'CO₂ GWP=1 vs R404A GWP=3922'
            },

            technicalDetails: {
                components: [
                    'NH₃ high-stage compressors (-10°C to -40°C)',
                    'CO₂ low-stage compressors (-40°C to -60°C)',
                    'Cascade heat exchanger',
                    'CO₂ pump circulation system',
                    'Dual refrigerant monitoring'
                ],
                temperatures: {
                    highStage: '-10°C to -40°C (NH₃)',
                    lowStage: '-40°C to -60°C (CO₂)',
                    cascade: '-40°C'
                },
                requirements: [
                    'Ultra-low temperature requirement (-40°C or below)',
                    'Trained personnel for CO₂ systems',
                    'Appropriate safety systems for both refrigerants'
                ]
            },

            environmentalBenefits: [
                'CO₂ is natural refrigerant (GWP = 1)',
                'No ozone depletion',
                'Future-proof against regulations',
                'Lower leak impact'
            ],

            regionalNotes: `Applicable for ultra-low temp applications (${ultraLowTempLoads.length} rooms at ≤-40°C)`,
            priority: paybackYears < 4 ? 'high' : (paybackYears < 6 ? 'medium' : 'low')
        };
    }

    /**
     * 6. Smart Grid Demand Response
     */
    async _analyzeDemandResponse(designData, regionalData) {
        const totalLoad = designData.summary?.totalCoolingLoad || 100;
        const compressorPower = totalLoad / 3.5;

        // Check if region has demand response programs
        if (!regionalData.incentives?.demandResponse && !regionalData.energy.demandCharge) {
            return { applicable: false, id: 'demand-response', name: 'Smart Grid Demand Response' };
        }

        // Typical DR program: Reduce load by 20-40% for 100-200 hours/year
        const loadReduction = compressorPower * 0.30; // 30% reduction capability
        const drHours = 150; // annual hours of DR events
        const energyReduced = loadReduction * drHours;

        // Revenue: Utility pays for capacity + energy not used
        const capacityPayment = loadReduction * 100 * 12; // $100/kW/year capacity
        const energyPayment = energyReduced * regionalData.energy.electricityCost * 3; // 3x rate during DR
        const annualRevenue = capacityPayment + energyPayment;

        // Plus avoid peak demand charges
        const demandSavings = loadReduction * regionalData.energy.demandCharge * 12;
        const totalAnnualBenefit = annualRevenue + demandSavings;

        // Implementation: Advanced controls + automation
        const implementationCost = 15000 + (compressorPower * 200);

        const paybackYears = implementationCost / totalAnnualBenefit;

        return {
            id: 'demand-response',
            name: 'Smart Grid Integration & Demand Response',
            category: 'Grid Services',
            description: 'Participate in utility demand response programs - get paid to reduce load during grid stress events',

            applicable: true,

            energySavings: {
                kWhPerYear: energyReduced,
                drEvents: '15-20 per year',
                loadReduction: loadReduction,
                reductionPercent: 30
            },

            financialImpact: {
                annualBenefit: totalAnnualBenefit,
                capacityPayments: capacityPayment,
                energyPayments: energyPayment,
                demandChargeSavings: demandSavings,
                implementationCost: implementationCost,
                paybackYears: paybackYears,
                npv10Year: this._calculateNPV(totalAnnualBenefit, implementationCost, 10, 0.06),
                roi: ((totalAnnualBenefit * 10) - implementationCost) / implementationCost * 100
            },

            co2Reduction: {
                tonsPerYear: energyReduced * 0.8 / 1000, // Higher emissions during peak
                percent: 8,
                gridBenefit: 'Reduces grid stress, enables renewable integration'
            },

            technicalDetails: {
                components: [
                    'Advanced energy management system',
                    'Automated load shedding controls',
                    'Utility communication gateway',
                    'Pre-cooling capability',
                    'Real-time monitoring and alerts'
                ],
                drStrategies: [
                    'Pre-cool before DR event',
                    'Cycle compressors during event',
                    'Use thermal storage',
                    'Prioritize critical loads'
                ],
                requirements: [
                    'Utility DR program availability',
                    'Reliable communication link',
                    'Adequate thermal mass (4-6 hours)',
                    'Minimum load: 50 kW'
                ]
            },

            programDetails: {
                eligibility: compressorPower > 50 ? 'Eligible' : 'May be eligible',
                estimatedEvents: '15-20 per year',
                eventDuration: '2-6 hours',
                advanceNotice: '2-24 hours',
                performanceRequirement: '≥80% of committed reduction'
            },

            regionalNotes: regionalData.incentives?.demandResponse
                ? `Region offers ${(regionalData.incentives.demandResponse * 100).toFixed(0)}% incentive for DR participation`
                : 'Check with local utility for DR program availability',
            priority: paybackYears < 2 ? 'high' : (paybackYears < 4 ? 'medium' : 'low')
        };
    }

    /**
     * 7. Evaporative Pre-Cooling for Condensers
     */
    async _analyzeEvaporativeCooling(designData, regionalData) {
        const condensers = designData.equipment?.condensers || [];
        if (condensers.length === 0) {
            return { applicable: false, id: 'evap-cooling', name: 'Evaporative Pre-Cooling' };
        }

        // Only effective in dry climates (RH < 40%)
        const summerRH = regionalData.climate.summerDesign.rh;
        if (summerRH > 40) {
            return {
                applicable: false,
                id: 'evap-cooling',
                name: 'Evaporative Pre-Cooling',
                reason: `Not suitable for humid climate (${summerRH}% RH > 40% threshold)`
            };
        }

        const heatRejection = condensers.reduce((sum, c) => sum + (c.heatRejection || 0), 0);
        const condenserFanPower = condensers.reduce((sum, c) => sum + (c.totalElectricalPower || 0), 0);

        // Evaporative cooling can reduce entering air temp by 15-25°F in dry climates
        const tempReduction = 20; // °F

        // Each °F reduction saves ~2-3% compressor energy
        const percentSavings = tempReduction * 0.025; // 2.5% per °F

        const compressorPower = (designData.summary?.totalCoolingLoad || 100) / 3.5;
        const annualEnergy = compressorPower * 6000;
        const energySavings = annualEnergy * percentSavings;

        const energyCost = regionalData.energy.electricityCost;
        const annualSavings = energySavings * energyCost;

        // Water cost (minimal in most regions)
        const waterCost = 500; // annual

        const netAnnualSavings = annualSavings - waterCost;

        // Implementation: Misting system + controls
        const implementationCost = 5000 + (heatRejection * 15);

        const paybackYears = implementationCost / netAnnualSavings;

        return {
            id: 'evap-cooling',
            name: 'Evaporative Pre-Cooling for Condensers',
            category: 'Cooling Enhancement',
            description: `Misting system pre-cools air entering condenser by ${tempReduction}°F, reducing compressor work in dry climates`,

            applicable: true,

            energySavings: {
                kWhPerYear: energySavings,
                percent: Math.round(percentSavings * 100),
                mechanismn: `${tempReduction}°F air temp reduction`,
                condensingTempReduction: `${tempReduction * 0.7}°F lower condensing temp`
            },

            financialImpact: {
                annualEnergySavings: annualSavings,
                waterCost: waterCost,
                netAnnualSavings: netAnnualSavings,
                implementationCost: implementationCost,
                paybackYears: paybackYears,
                npv10Year: this._calculateNPV(netAnnualSavings, implementationCost, 10, 0.06),
                roi: ((netAnnualSavings * 10) - implementationCost) / implementationCost * 100
            },

            co2Reduction: {
                tonsPerYear: energySavings * 0.5 / 1000,
                percent: Math.round(percentSavings * 100)
            },

            technicalDetails: {
                components: [
                    'Evaporative misting nozzles',
                    'Water supply and filtration',
                    'Control system (humidity-based)',
                    'Drift eliminators',
                    'Pump and distribution piping'
                ],
                waterUsage: `${Math.round(heatRejection * 0.15)} gallons/hour during operation`,
                effectiveness: `${tempReduction}°F reduction at ${summerRH}% RH`,
                requirements: [
                    'Dry climate (RH < 40% for best results)',
                    'Water source availability',
                    'Adequate drainage',
                    'Protection against freezing'
                ]
            },

            climateAnalysis: {
                currentRH: summerRH,
                suitability: summerRH < 25 ? 'Excellent' : (summerRH < 35 ? 'Good' : 'Fair'),
                wetBulbApproach: `Can approach ${regionalData.climate.summerDesign.wetBulb}°F wet bulb`,
                seasonality: 'Most effective during hot, dry summer months'
            },

            regionalNotes: `Excellent for dry climate (${summerRH}% RH). Expected ${tempReduction}°F air temp reduction.`,
            priority: paybackYears < 3 ? 'high' : (paybackYears < 5 ? 'medium' : 'low')
        };
    }

    /**
     * 8. Waste Heat Network Integration
     */
    async _analyzeWasteHeat(designData, regionalData) {
        const condensers = designData.equipment?.condensers || [];
        if (condensers.length === 0) {
            return { applicable: false, id: 'waste-heat', name: 'Waste Heat Network' };
        }

        const heatRejection = condensers.reduce((sum, c) => sum + (c.heatRejection || 0), 0);

        // Heat recovery is most valuable in cold climates
        const heatingDegreeDays = regionalData.climate.heatingDegreeDays;

        if (heatingDegreeDays < 1500) {
            return {
                applicable: false,
                id: 'waste-heat',
                name: 'Waste Heat Network Integration',
                reason: `Limited heating demand (${heatingDegreeDays} HDD < 1500 threshold)`
            };
        }

        // Estimate recoverable heat (60% of rejection during winter)
        const winterMonths = 5; // heating season
        const recoverableFraction = 0.60;
        const recoverableHeat = heatRejection * recoverableFraction * winterMonths * 720; // kWh/year

        // Heat value: Natural gas equivalent or district heating rate
        const heatValue = 0.03; // $/kWh thermal (lower than electricity)
        const annualHeatValue = recoverableHeat * heatValue;

        // Check for existing district heating infrastructure
        const hasDistrictHeating = heatingDegreeDays > 3000; // Assumption: more likely in cold climates

        let implementationCost;
        let annualRevenue;

        if (hasDistrictHeating) {
            // Connect to district network: Sell heat
            implementationCost = 50000 + (heatRejection * 5000);
            annualRevenue = recoverableHeat * 0.05; // Better rate from utility
        } else {
            // On-site use: Domestic hot water, space heating
            implementationCost = 15000 + (heatRejection * 1000);
            annualRevenue = annualHeatValue; // Offset heating costs
        }

        // Additional maintenance
        const annualMaintenance = 2000;
        const netAnnualBenefit = annualRevenue - annualMaintenance;

        const paybackYears = implementationCost / netAnnualBenefit;

        return {
            id: 'waste-heat',
            name: 'Waste Heat Recovery & Network Integration',
            category: 'Heat Recovery',
            description: hasDistrictHeating
                ? 'Connect to district heating network to sell excess condenser heat'
                : 'Recover condenser heat for on-site domestic hot water and space heating',

            applicable: true,

            energySavings: {
                thermalEnergyRecovered: recoverableHeat,
                equivalentNaturalGas: `${Math.round(recoverableHeat / 10.37)} therms/year`,
                fossilFuelOffset: `${Math.round(recoverableHeat * 0.3)} kg CO₂ from avoided gas use`
            },

            financialImpact: {
                annualRevenue: annualRevenue,
                annualMaintenance: annualMaintenance,
                netAnnualBenefit: netAnnualBenefit,
                implementationCost: implementationCost,
                paybackYears: paybackYears,
                npv10Year: this._calculateNPV(netAnnualBenefit, implementationCost, 10, 0.06),
                roi: ((netAnnualBenefit * 15) - implementationCost) / implementationCost * 100
            },

            co2Reduction: {
                tonsPerYear: recoverableHeat * 0.3 / 1000, // Avoided natural gas emissions
                percent: 0, // Doesn't reduce refrigeration energy
                additionalBenefit: 'Offsets fossil fuel heating'
            },

            technicalDetails: {
                components: hasDistrictHeating ? [
                    'Heat recovery heat exchanger',
                    'Connection to district network',
                    'Flow control and metering',
                    'Heat quality sensors',
                    'Backup heating capability'
                ] : [
                    'Desuperheater heat exchanger',
                    'Hot water storage tank (500-1000 gal)',
                    'Circulation pumps',
                    'Tempering valves',
                    'Building heating integration'
                ],
                heatQuality: {
                    temperature: '90-120°F (suitable for DHW, radiant heating)',
                    capacity: `${Math.round(heatRejection * 0.6)} kW during peak`,
                    availability: `${winterMonths} months/year (heating season)`
                },
                requirements: hasDistrictHeating ? [
                    'District heating network available',
                    'Heat quality meets network standards',
                    'Proximity to connection point (<500m)',
                    'Utility agreement for selling heat'
                ] : [
                    'On-site heating demand',
                    'Space for hot water storage',
                    'Compatible temperature requirements',
                    'Year-round or seasonal use'
                ]
            },

            applications: hasDistrictHeating ? [
                'Sell to district heating network',
                'Offset heating costs for nearby buildings',
                'Support municipal heating'
            ] : [
                'Domestic hot water pre-heating',
                'Space heating (radiant floors, air handlers)',
                'Process heating if applicable',
                'Snow melting for loading docks'
            ],

            regionalNotes: hasDistrictHeating
                ? `Cold climate (${heatingDegreeDays} HDD) likely has district heating infrastructure`
                : `Cold climate (${heatingDegreeDays} HDD) has high on-site heating value`,
            priority: paybackYears < 7 ? 'medium' : 'low'
        };
    }
}

module.exports = new InnovativeEnergyStrategies();
