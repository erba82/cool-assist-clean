/**
 * EnergyOptimizer Module
 * 
 * Analyzes system design and provides:
 * - Energy consumption estimates
 * - Optimization recommendations
 * - Potential savings calculations
 * - VFD opportunities
 * - Heat recovery options
 * 
 * @author GFDDE AI Engine
 * @version 2.0.0
 */

class EnergyOptimizer {
    constructor(engine) {
        this.engine = engine;

        // Electricity costs by region ($/kWh)
        this.electricityCosts = {
            'middle_east': { Iran: 0.02, UAE: 0.08, Saudi: 0.05 },
            'europe': { Germany: 0.35, Netherlands: 0.28, UK: 0.30 },
            'north_america': { USA: 0.12, Canada: 0.10 },
            'asia': { Japan: 0.25, China: 0.08 },
            'default': 0.10
        };

        // Operating hours assumptions
        this.operatingProfiles = {
            'coldStorage': { hours: 8760, loadFactor: 0.7 },
            'processing': { hours: 4000, loadFactor: 0.85 },
            'blast': { hours: 2000, loadFactor: 0.95 }
        };
    }

    /**
     * Analyze system for energy optimization
     * @param {Object} results - System calculation results
     * @param {Object} project - Project context
     * @returns {Object} Optimization analysis
     */
    async analyze(results, project) {
        const analysis = {
            currentConsumption: {},
            recommendations: [],
            potentialSavings: {},
            summary: {}
        };

        // Calculate current energy consumption
        analysis.currentConsumption = this._calculateConsumption(results, project);

        // Generate optimization recommendations
        analysis.recommendations = this._generateRecommendations(results, project);

        // Calculate potential savings
        analysis.potentialSavings = this._calculateSavings(
            analysis.currentConsumption,
            analysis.recommendations,
            project
        );

        // Summary
        analysis.summary = {
            totalAnnualConsumption: analysis.currentConsumption.total,
            totalAnnualCost: analysis.currentConsumption.annualCost,
            potentialSavingsPercent: analysis.potentialSavings.totalPercent,
            potentialSavingsCost: analysis.potentialSavings.annualSavings,
            paybackPeriod: analysis.potentialSavings.simplePayback,
            co2Reduction: analysis.potentialSavings.co2Reduction
        };

        return analysis;
    }

    _calculateConsumption(results, project) {
        const electricityCost = this._getElectricityCost(project);
        const operatingHours = 8760;  // Full year
        const loadFactor = 0.75;      // Average

        let totalPower = 0;
        const breakdown = {};

        // Compressor power
        if (results.calculations?.compressors) {
            const compPower = results.calculations.compressors.reduce(
                (sum, c) => sum + (c.electricalPower || 0) * (c.operatingUnits || 1), 0
            );
            breakdown.compressors = compPower;
            totalPower += compPower;
        }

        // Condenser fans and pumps
        if (results.calculations?.condensers) {
            const condPower = results.calculations.condensers.totalElectricalPower || 0;
            breakdown.condensers = condPower;
            totalPower += condPower;
        }

        // Evaporator fans
        if (results.calculations?.evaporators) {
            const evapPower = results.calculations.evaporators.reduce(
                (sum, e) => sum + (e.motorPower || 0) * (e.fanCount || 1) * (e.count || 1), 0
            );
            breakdown.evaporators = evapPower;
            totalPower += evapPower;
        }

        // Pumps
        if (results.calculations?.separators) {
            const pumpPower = results.calculations.separators.reduce(
                (sum, s) => sum + (s.pumps?.power || 0) * (s.pumps?.total || 1), 0
            );
            breakdown.pumps = pumpPower;
            totalPower += pumpPower;
        }

        // Annual consumption
        const annualConsumption = totalPower * operatingHours * loadFactor;
        const annualCost = annualConsumption * electricityCost;

        return {
            breakdown: breakdown,
            totalPower: Math.round(totalPower * 10) / 10,
            annualConsumption: Math.round(annualConsumption),
            annualCost: Math.round(annualCost),
            electricityCost: electricityCost,
            loadFactor: loadFactor,
            total: Math.round(annualConsumption)
        };
    }

    _generateRecommendations(results, project) {
        const recommendations = [];

        // 1. VFD on compressors
        if (results.calculations?.compressors) {
            const compPower = results.calculations.compressors.reduce(
                (sum, c) => sum + (c.motorPower || 0), 0
            );
            recommendations.push({
                id: 'VFD_COMPRESSOR',
                title: 'Variable Frequency Drive on Compressors',
                description: 'Install VFD on screw compressors for capacity modulation',
                applicability: compPower > 100,
                savingsPercent: 15,
                investmentFactor: 0.15,  // 15% of compressor cost
                priority: 'HIGH'
            });
        }

        // 2. VFD on condenser fans
        recommendations.push({
            id: 'VFD_CONDENSER',
            title: 'Variable Speed Condenser Fans',
            description: 'Reduce condenser fan speed at lower ambient temperatures',
            applicability: true,
            savingsPercent: 12,
            investmentFactor: 0.1,
            priority: 'HIGH'
        });

        // 3. Economizer
        if (results.calculations?.compressors) {
            const hasLowTemp = results.calculations.compressors.some(
                c => c.evaporatingTemp < -20
            );
            if (hasLowTemp) {
                recommendations.push({
                    id: 'ECONOMIZER',
                    title: 'Economizer Circuit',
                    description: 'Add economizer for improved efficiency at low temperatures',
                    applicability: true,
                    savingsPercent: 8,
                    investmentFactor: 0.05,
                    priority: 'MEDIUM'
                });
            }
        }

        // 4. Heat recovery
        const totalHR = results.calculations?.compressors?.reduce(
            (sum, c) => sum + (c.heatRejection || 0), 0
        ) || 0;
        if (totalHR > 200) {
            recommendations.push({
                id: 'HEAT_RECOVERY',
                title: 'Heat Recovery System',
                description: 'Recover waste heat for hot water or space heating',
                applicability: true,
                savingsPercent: 5,
                investmentFactor: 0.08,
                priority: 'MEDIUM',
                heatAvailable: Math.round(totalHR * 0.3)
            });
        }

        // 5. Floating head pressure
        recommendations.push({
            id: 'FLOATING_HEAD',
            title: 'Floating Head Pressure Control',
            description: 'Lower condensing temperature when ambient allows',
            applicability: true,
            savingsPercent: 10,
            investmentFactor: 0.02,
            priority: 'HIGH'
        });

        // 6. LED lighting
        recommendations.push({
            id: 'LED_LIGHTING',
            title: 'LED Lighting in Cold Rooms',
            description: 'Replace conventional lights with LED cold-rated fixtures',
            applicability: true,
            savingsPercent: 2,
            investmentFactor: 0.01,
            priority: 'LOW'
        });

        // 7. Door management
        recommendations.push({
            id: 'DOOR_MANAGEMENT',
            title: 'Improved Door Management',
            description: 'High-speed doors, strip curtains, or air curtains',
            applicability: true,
            savingsPercent: 5,
            investmentFactor: 0.03,
            priority: 'MEDIUM'
        });

        return recommendations.filter(r => r.applicability);
    }

    _calculateSavings(consumption, recommendations, project) {
        const electricityCost = this._getElectricityCost(project);

        let totalSavingsPercent = 0;
        let totalInvestment = 0;
        const details = [];

        for (const rec of recommendations) {
            const savingsKWh = consumption.annualConsumption * (rec.savingsPercent / 100);
            const savingsCost = savingsKWh * electricityCost;
            const investment = consumption.annualCost * rec.investmentFactor * 2;  // Rough estimate

            details.push({
                ...rec,
                annualSavingsKWh: Math.round(savingsKWh),
                annualSavingsCost: Math.round(savingsCost),
                estimatedInvestment: Math.round(investment),
                paybackYears: investment > 0 ?
                    Math.round(investment / savingsCost * 10) / 10 : 0
            });

            totalSavingsPercent += rec.savingsPercent;
            totalInvestment += investment;
        }

        // Avoid double counting (max 40% total savings)
        totalSavingsPercent = Math.min(totalSavingsPercent, 40);

        const annualSavings = consumption.annualCost * (totalSavingsPercent / 100);
        const co2Factor = 0.5;  // kg CO2 per kWh (varies by region)

        return {
            details: details,
            totalPercent: totalSavingsPercent,
            annualSavingsKWh: Math.round(consumption.annualConsumption * totalSavingsPercent / 100),
            annualSavings: Math.round(annualSavings),
            totalInvestment: Math.round(totalInvestment),
            simplePayback: totalInvestment > 0 ?
                Math.round(totalInvestment / annualSavings * 10) / 10 : 0,
            co2Reduction: Math.round(consumption.annualConsumption * totalSavingsPercent / 100 * co2Factor)
        };
    }

    _getElectricityCost(project) {
        const region = project.climate?.region || 'default';
        const country = project.location?.country;

        if (this.electricityCosts[region]?.[country]) {
            return this.electricityCosts[region][country];
        }
        if (typeof this.electricityCosts[region] === 'number') {
            return this.electricityCosts[region];
        }
        return this.electricityCosts.default;
    }
}

module.exports = EnergyOptimizer;
