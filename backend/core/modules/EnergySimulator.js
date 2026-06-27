/**
 * Energy Simulator - 8760-Hour Annual Energy Model
 * Simulates baseline and optimized system performance hour-by-hour for full year
 */

class EnergySimulator {
    constructor() {
        this.hoursPerYear = 8760;
    }

    /**
     * Simulate annual performance - baseline and optimized
     * @param {object} designData - System design data
     * @param {object} regionalData - Regional climate and energy costs
     * @param {array} strategies - Selected energy strategies
     * @returns {object} Simulation results with hourly data
     */
    async simulateAnnualPerformance(designData, regionalData, strategies = []) {
        console.log('🔄 Running 8760-hour energy simulation...');

        // Generate hourly load profile based on climate
        const hourlyTemperatures = this._generateHourlyTemperatures(regionalData.climate);
        const hourlyLoads = this._calculateHourlyLoads(designData, hourlyTemperatures);

        // Baseline system performance
        const baseline = this._simulateBaseline(hourlyLoads, designData, regionalData);

        // Optimized system with strategies
        const optimized = this._simulateWithStrategies(hourlyLoads, designData, regionalData, strategies);

        // Calculate savings
        const savings = this._calculateSavings(baseline, optimized);

        console.log(`   ✓ Baseline: ${Math.round(baseline.annualEnergy)} kWh/year`);
        console.log(`   ✓ Optimized: ${Math.round(optimized.annualEnergy)} kWh/year`);
        console.log(`   ✓ Savings: ${Math.round(savings.energy.kWh)} kWh (${savings.energy.percent.toFixed(1)}%)`);

        return {
            baseline,
            optimized,
            savings,
            strategies: strategies.map(s => s.id)
        };
    }

    /**
     * Generate hourly temperature profile for full year
     */
    _generateHourlyTemperatures(climate) {
        const temperatures = new Array(this.hoursPerYear);
        const summerPeak = climate.summerDesign.temp;
        const winterLow = climate.winterDesign.temp;
        const avgTemp = climate.avgTemp;

        for (let hour = 0; hour < this.hoursPerYear; hour++) {
            const dayOfYear = Math.floor(hour / 24);
            const hourOfDay = hour % 24;

            // Seasonal variation (sinusoidal)
            const seasonalFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI - Math.PI / 2);
            const seasonalTemp = avgTemp + (seasonalFactor * (summerPeak - winterLow) / 2);

            // Daily variation (smaller amplitude)
            const dailyFactor = Math.sin((hourOfDay / 24) * 2 * Math.PI - Math.PI / 2);
            const dailyVariation = dailyFactor * 8; // ±8°F daily swing

            temperatures[hour] = seasonalTemp + dailyVariation;
        }

        return temperatures;
    }

    /**
     * Calculate hourly cooling loads based on temperature
     */
    _calculateHourlyLoads(designData, hourlyTemperatures) {
        const designLoad = designData.summary?.totalCoolingLoad || 100; // kW
        const designTemp = 95; // °F design ambient

        return hourlyTemperatures.map(temp => {
            // Load is proportional to temperature difference
            // But has minimum base load (infiltration, product, etc.)
            const baseLoad = designLoad * 0.30; // 30% minimum
            const variableLoad = designLoad * 0.70; // 70% variable with temp

            if (temp <= 40) {
                // Winter: only base load
                return baseLoad * 0.5; // Even lower in cold weather
            }

            const loadFactor = Math.max(0.3, Math.min(1.1, temp / designTemp));
            return baseLoad + (variableLoad * loadFactor);
        });
    }

    /**
     * Simulate baseline system performance
     */
    _simulateBaseline(hourlyLoads, designData, regionalData) {
        const baselineCOP = 2.8; // Typical NH₃ system COP
        const energyCost = regionalData.energy.electricityCost;
        const peakPremium = regionalData.energy.peakRatePremium;
        const offPeakDiscount = regionalData.energy.offPeakDiscount;

        let annualEnergy = 0;
        let annualCost = 0;
        let peakDemand = 0;
        const hourlyPower = new Array(this.hoursPerYear);

        for (let hour = 0; hour < this.hoursPerYear; hour++) {
            const load = hourlyLoads[hour];
            const power = load / baselineCOP; // kW
            hourlyPower[hour] = power;

            annualEnergy += power; // kWh (1 hour)

            // Time-of-use rates
            const hourOfDay = hour % 24;
            const isPeak = (hourOfDay >= 12 && hourOfDay < 20); // 12pm-8pm peak
            const rate = isPeak ? (energyCost * peakPremium) : (energyCost * offPeakDiscount);

            annualCost += power * rate;

            if (power > peakDemand) {
                peakDemand = power;
            }
        }

        // Add demand charges
        const demandCharge = regionalData.energy.demandCharge || 0;
        annualCost += peakDemand * demandCharge * 12;

        return {
            hourlyLoad: hourlyLoads,
            hourlyPower: hourlyPower,
            annualEnergy: annualEnergy,
            annualCost: annualCost,
            peakDemand: peakDemand,
            averageCOP: baselineCOP
        };
    }

    /**
     * Simulate optimized system with strategies
     */
    _simulateWithStrategies(hourlyLoads, designData, regionalData, strategies) {
        // Start with baseline
        let optimizedCOP = 2.8;
        let peakShiftFraction = 0;
        let renewableFraction = 0;

        // Apply strategy impacts
        for (const strategy of strategies) {
            if (strategy.id === 'magnetic-bearings') {
                optimizedCOP *= 1.12; // 12% improvement
            }
            if (strategy.id === 'evap-cooling') {
                optimizedCOP *= 1.10; // 10% improvement in summer
            }
            if (strategy.id === 'ai-load-matching' || strategy.id === 'pcm-storage') {
                peakShiftFraction = 0.30; // 30% shifted to off-peak
            }
            if (strategy.id === 'solar-hybrid') {
                renewableFraction = 0.60; // 60% from solar
            }
        }

        const energyCost = regionalData.energy.electricityCost;
        const peakPremium = regionalData.energy.peakRatePremium;
        const offPeakDiscount = regionalData.energy.offPeakDiscount;

        let annualEnergy = 0;
        let annualCost = 0;
        let peakDemand = 0;
        const hourlyPower = new Array(this.hoursPerYear);

        for (let hour = 0; hour < this.hoursPerYear; hour++) {
            const load = hourlyLoads[hour];
            let power = load / optimizedCOP; // kW

            // Solar offset during daytime
            const hourOfDay = hour % 24;
            const isDaytime = (hourOfDay >= 6 && hourOfDay < 18);
            if (isDaytime && renewableFraction > 0) {
                power *= (1 - renewableFraction);
            }

            hourlyPower[hour] = power;
            annualEnergy += power;

            // Time-of-use rates with peak shifting
            const isPeak = (hourOfDay >= 12 && hourOfDay < 20);
            let effectivePower = power;

            if (isPeak && peakShiftFraction > 0) {
                // Reduced power during peak
                effectivePower = power * (1 - peakShiftFraction);
                peakDemand = Math.max(peakDemand, effectivePower);
            } else if (!isPeak && peakShiftFraction > 0) {
                // Increased power during off-peak (making up for shifted load)
                effectivePower = power * (1 + peakShiftFraction * 0.4); // 40% of shift happens here
            }

            const rate = isPeak ? (energyCost * peakPremium) : (energyCost * offPeakDiscount);
            annualCost += effectivePower * rate;

            if (effectivePower > peakDemand) {
                peakDemand = effectivePower;
            }
        }

        // Add demand charges
        const demandCharge = regionalData.energy.demandCharge || 0;
        annualCost += peakDemand * demandCharge * 12;

        return {
            hourlyLoad: hourlyLoads,
            hourlyPower: hourlyPower,
            annualEnergy: annualEnergy,
            annualCost: annualCost,
            peakDemand: peakDemand,
            averageCOP: optimizedCOP
        };
    }

    /**
     * Calculate savings between baseline and optimized
     */
    _calculateSavings(baseline, optimized) {
        const energySavings = baseline.annualEnergy - optimized.annualEnergy;
        const costSavings = baseline.annualCost - optimized.annualCost;
        const peakReduction = baseline.peakDemand - optimized.peakDemand;

        // CO₂ emissions (0.5 kg CO₂ per kWh typical grid)
        const co2Savings = energySavings * 0.5 / 1000; // tons

        return {
            energy: {
                kWh: energySavings,
                percent: (energySavings / baseline.annualEnergy) * 100
            },
            cost: {
                dollars: costSavings,
                percent: (costSavings / baseline.annualCost) * 100
            },
            peakDemand: {
                kW: peakReduction,
                percent: (peakReduction / baseline.peakDemand) * 100
            },
            co2: {
                tons: co2Savings,
                percent: (energySavings / baseline.annualEnergy) * 100
            }
        };
    }

    /**
     * Get monthly summary from hourly data
     */
    getMonthlySummary(simulation) {
        const months = [];
        for (let month = 0; month < 12; month++) {
            const startHour = month * 730; // Approximate hours per month
            const endHour = Math.min((month + 1) * 730, this.hoursPerYear);

            let monthEnergy = 0;
            let monthCost = 0;
            let monthPeak = 0;

            for (let hour = startHour; hour < endHour; hour++) {
                const power = simulation.hourlyPower[hour];
                monthEnergy += power;
                monthPeak = Math.max(monthPeak, power);
                // Cost calculation would need hourly rates data
            }

            months.push({
                month: month + 1,
                energy: monthEnergy,
                peak: monthPeak,
                avgLoad: monthEnergy / (endHour - startHour)
            });
        }

        return months;
    }
}

module.exports = new EnergySimulator();
