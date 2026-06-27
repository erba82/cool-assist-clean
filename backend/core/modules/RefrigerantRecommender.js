/**
 * Refrigerant Recommender
 * Recommends optimal refrigerant based on:
 * - Total cooling load
 * - Operating temperature range
 * - Project size
 * - Regional regulations
 * - Environmental considerations
 */

const { getStandardsForLocation } = require('../../data/standards/RegionalStandardsDB');

class RefrigerantRecommender {
    constructor() {
        // Refrigerant database with properties and applicability
        this.refrigerants = {
            'R-717': {
                name: 'Ammonia (NH₃)',
                formula: 'NH₃',
                gwp: 0,
                odp: 0,
                type: 'Natural',
                tempRange: { min: -60, max: 50 },
                efficiency: 'Excellent',
                cost: 'Low',
                safety: 'B2L (Toxic, Mildly Flammable)',
                applicability: {
                    minLoad: 100, // kW - economical above this
                    idealLoad: { min: 200, max: 10000 },
                    industrial: true,
                    commercial: false,
                    residential: false
                },
                advantages: [
                    'Highest energy efficiency',
                    'Zero GWP and ODP',
                    'Low operating cost',
                    'Excellent heat transfer'
                ],
                disadvantages: [
                    'Toxic - requires trained personnel',
                    'Not suitable for small systems',
                    'Requires special materials (no copper)'
                ],
                requiresApproval: { regions: ['UAE', 'Singapore'] }
            },
            'R-404A': {
                name: 'R-404A',
                formula: 'R-404A (HFC blend)',
                gwp: 3922,
                odp: 0,
                type: 'HFC',
                tempRange: { min: -45, max: 45 },
                efficiency: 'Good',
                cost: 'Medium',
                safety: 'A1 (Non-toxic, Non-flammable)',
                applicability: {
                    minLoad: 5,
                    idealLoad: { min: 10, max: 200 },
                    industrial: true,
                    commercial: true,
                    residential: false
                },
                advantages: [
                    'Safe - non-toxic, non-flammable',
                    'Wide availability',
                    'Easy maintenance'
                ],
                disadvantages: [
                    'High GWP - being phased down',
                    'Higher operating cost',
                    'Less efficient than NH3'
                ],
                phaseOutWarning: 'F-Gas regulations limiting use in EU/UK/USA'
            },
            'R-134a': {
                name: 'R-134a',
                formula: 'CH₂FCF₃',
                gwp: 1430,
                odp: 0,
                type: 'HFC',
                tempRange: { min: -20, max: 55 },
                efficiency: 'Good',
                cost: 'Medium',
                safety: 'A1 (Non-toxic, Non-flammable)',
                applicability: {
                    minLoad: 1,
                    idealLoad: { min: 5, max: 100 },
                    industrial: true,
                    commercial: true,
                    residential: true
                },
                advantages: [
                    'Very safe',
                    'Wide temperature range',
                    'Common in chillers'
                ],
                disadvantages: [
                    'Medium GWP',
                    'Not ideal for low temps'
                ]
            },
            'R-744': {
                name: 'CO₂ (R-744)',
                formula: 'CO₂',
                gwp: 1,
                odp: 0,
                type: 'Natural',
                tempRange: { min: -55, max: 30 },
                efficiency: 'Good (transcritical)',
                cost: 'Very Low',
                safety: 'A1 (Non-toxic, Non-flammable)',
                applicability: {
                    minLoad: 20,
                    idealLoad: { min: 50, max: 500 },
                    industrial: true,
                    commercial: true,
                    residential: false
                },
                advantages: [
                    'Ultra-low GWP',
                    'Excellent for very low temps',
                    'Safe',
                    'High volumetric capacity'
                ],
                disadvantages: [
                    'High operating pressures',
                    'Efficiency drops in hot climates',
                    'Complex system design'
                ],
                climateNote: 'Best in cool/moderate climates, less efficient in hot climates'
            },
            'CO2-NH3-Cascade': {
                name: 'CO₂/NH₃ Cascade',
                formula: 'CO₂ (LT) + NH₃ (HT)',
                gwp: 0,
                odp: 0,
                type: 'Natural Cascade',
                tempRange: { min: -55, max: 50 },
                efficiency: 'Excellent',
                cost: 'Low (operating)',
                safety: 'Improved over pure NH3',
                applicability: {
                    minLoad: 150,
                    idealLoad: { min: 300, max: 5000 },
                    industrial: true,
                    commercial: false,
                    residential: false
                },
                advantages: [
                    'Best for ultra-low temperatures',
                    'Reduced NH3 charge',
                    'Excellent efficiency across range',
                    'Future-proof'
                ],
                disadvantages: [
                    'Higher initial cost',
                    'Complex system',
                    'Requires skilled technicians'
                ]
            },
            'R-290': {
                name: 'Propane (R-290)',
                formula: 'C₃H₈',
                gwp: 3,
                odp: 0,
                type: 'Natural (HC)',
                tempRange: { min: -40, max: 45 },
                efficiency: 'Excellent',
                cost: 'Low',
                safety: 'A3 (Highly Flammable)',
                applicability: {
                    minLoad: 1,
                    idealLoad: { min: 2, max: 50 },
                    industrial: false,
                    commercial: true,
                    residential: true
                },
                advantages: [
                    'Ultra-low GWP',
                    'Very efficient',
                    'Low cost'
                ],
                disadvantages: [
                    'Flammable - charge limits',
                    'Not for large systems'
                ]
            }
        };

        // Temperature-based recommendation matrix
        this.tempRecommendations = [
            { minTemp: -55, maxTemp: -35, primary: 'CO2-NH3-Cascade', alternatives: ['R-744', 'R-717'] },
            { minTemp: -35, maxTemp: -25, primary: 'R-717', alternatives: ['R-404A', 'CO2-NH3-Cascade'] },
            { minTemp: -25, maxTemp: -18, primary: 'R-717', alternatives: ['R-404A', 'R-744'] },
            { minTemp: -18, maxTemp: 0, primary: 'R-717', alternatives: ['R-404A', 'R-744'] },
            { minTemp: 0, maxTemp: 10, primary: 'R-717', alternatives: ['R-134a', 'R-404A'] }
        ];
    }

    /**
     * Recommend refrigerant based on project parameters
     */
    recommend(params) {
        const {
            coolingLoad, // kW
            temperature, // °C operating temp
            location,
            applicationType,
            projectType = 'industrial'
        } = params;

        // Get regional standards
        const standards = getStandardsForLocation(location || 'International');

        // Calculate scores for each refrigerant
        const scores = [];

        for (const [key, ref] of Object.entries(this.refrigerants)) {
            const score = this._calculateScore(ref, {
                coolingLoad,
                temperature,
                standards,
                projectType
            });

            if (score.eligible) {
                scores.push({
                    id: key,
                    refrigerant: ref,
                    score: score.total,
                    breakdown: score.breakdown,
                    warnings: score.warnings,
                    notes: score.notes
                });
            }
        }

        // Sort by score
        scores.sort((a, b) => b.score - a.score);

        // Return top recommendations
        const primary = scores[0];
        const alternatives = scores.slice(1, 3);

        return {
            recommended: primary ? {
                id: primary.id,
                name: primary.refrigerant.name,
                formula: primary.refrigerant.formula,
                type: primary.refrigerant.type,
                gwp: primary.refrigerant.gwp,
                safety: primary.refrigerant.safety,
                score: primary.score,
                advantages: primary.refrigerant.advantages,
                warnings: primary.warnings,
                notes: primary.notes
            } : null,
            alternatives: alternatives.map(alt => ({
                id: alt.id,
                name: alt.refrigerant.name,
                score: alt.score,
                gwp: alt.refrigerant.gwp
            })),
            analysis: {
                coolingLoad,
                temperature,
                location: standards.country,
                standardsUsed: standards.primaryStandards,
                restrictions: standards.refrigerantRestrictions
            }
        };
    }

    _calculateScore(refrigerant, params) {
        const { coolingLoad, temperature, standards, projectType } = params;
        const breakdown = {};
        const warnings = [];
        const notes = [];
        let eligible = true;

        // Check temperature range
        if (temperature < refrigerant.tempRange.min || temperature > refrigerant.tempRange.max) {
            eligible = false;
            return { eligible, reason: 'Temperature out of range' };
        }
        breakdown.tempRange = 20;

        // Check load applicability
        const app = refrigerant.applicability;
        if (coolingLoad < app.minLoad) {
            breakdown.loadMatch = 5;
            warnings.push(`Load (${coolingLoad}kW) below optimal (${app.minLoad}kW+)`);
        } else if (coolingLoad >= app.idealLoad.min && coolingLoad <= app.idealLoad.max) {
            breakdown.loadMatch = 25;
        } else if (coolingLoad > app.idealLoad.max) {
            breakdown.loadMatch = 15;
            notes.push('Multiple units may be required');
        } else {
            breakdown.loadMatch = 10;
        }

        // Check project type compatibility
        const typeMatch = app[projectType];
        if (typeMatch === false) {
            breakdown.typeMatch = 0;
            warnings.push(`Not typically used for ${projectType} applications`);
        } else {
            breakdown.typeMatch = 15;
        }

        // Efficiency score
        const efficiencyScores = { 'Excellent': 20, 'Good': 15, 'Good (transcritical)': 12, 'Fair': 8 };
        breakdown.efficiency = efficiencyScores[refrigerant.efficiency] || 10;

        // Environmental score (lower GWP = better)
        if (refrigerant.gwp === 0) {
            breakdown.environmental = 20;
        } else if (refrigerant.gwp <= 10) {
            breakdown.environmental = 18;
        } else if (refrigerant.gwp <= 1500) {
            breakdown.environmental = 10;
        } else {
            breakdown.environmental = 5;
            warnings.push('High GWP - may face regulatory phase-down');
        }

        // Regional restrictions
        if (standards.refrigerantRestrictions) {
            const restriction = standards.refrigerantRestrictions[refrigerant.type.toLowerCase()];
            if (restriction?.allowed === false) {
                eligible = false;
                return { eligible, reason: 'Not allowed in this region' };
            }
            if (restriction?.requiresApproval) {
                warnings.push(`Requires special approval in ${standards.country}`);
            }
            if (restriction?.fGasPhaseDown || restriction?.phaseDown) {
                warnings.push('Subject to F-Gas phase-down regulations');
                breakdown.regulatory = -5;
            }
        }

        // Calculate total
        const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

        return {
            eligible,
            total,
            breakdown,
            warnings,
            notes
        };
    }

    /**
     * Get quick recommendation based on load size
     */
    quickRecommend(coolingLoadKW, temperatureC) {
        if (coolingLoadKW > 200) {
            return {
                primary: 'R-717',
                reason: 'Ammonia recommended for large industrial systems (>200kW) - highest efficiency, lowest operating cost',
                alternatives: ['CO2-NH3-Cascade', 'R-404A']
            };
        } else if (coolingLoadKW > 50) {
            if (temperatureC <= -35) {
                return {
                    primary: 'CO2-NH3-Cascade',
                    reason: 'Cascade system recommended for ultra-low temperatures with medium loads',
                    alternatives: ['R-404A', 'R-717']
                };
            }
            return {
                primary: 'R-404A',
                reason: 'R-404A suitable for medium commercial/industrial (50-200kW)',
                alternatives: ['R-717', 'R-744']
            };
        } else {
            return {
                primary: 'R-404A',
                reason: 'R-404A or R-134a suitable for smaller commercial systems (<50kW)',
                alternatives: ['R-134a', 'R-290']
            };
        }
    }
}

module.exports = RefrigerantRecommender;
