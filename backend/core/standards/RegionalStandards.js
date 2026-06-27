/**
 * RegionalStandards Module
 * 
 * Provides regional standards information:
 * - Design standards (ISO, EN, ANSI, ASHRAE)
 * - Safety regulations
 * - Environmental requirements
 * - Local codes and restrictions
 * 
 * @author GFDDE AI Engine
 * @version 2.0.0
 */

class RegionalStandards {
    constructor(engine) {
        this.engine = engine;

        this.standards = {
            // Middle East (including Iran)
            'middle_east': {
                primary: 'ISO/EN',
                design: ['EN 378-1:2016', 'EN 378-2:2016', 'ISO 5149'],
                safety: ['EN 378-3:2016', 'EN 378-4:2016'],
                pressure: ['PED 2014/68/EU', 'EN 13445'],
                electrical: ['IEC 60079', 'NEN 3140'],
                refrigerants: {
                    R717: { status: 'allowed', chargeLimit: 'EN 378 Table 1' },
                    R404A: { status: 'phaseout_2030', note: 'F-gas phase down' },
                    R744: { status: 'preferred', note: 'Natural refrigerant' }
                },
                notes: [
                    'EN 378 applies in most Middle East countries',
                    'Ammonia allowed in industrial applications',
                    'Machine rooms must be separated',
                    'Regular safety inspections required'
                ]
            },

            // Europe
            'europe': {
                primary: 'EN',
                design: ['EN 378-1:2016+A1:2020', 'EN 378-2:2016+A1:2020'],
                safety: ['EN 378-3:2016+A1:2020', 'EN 378-4:2016+A1:2020'],
                pressure: ['PED 2014/68/EU', 'EN 13445', 'EN 13480'],
                electrical: ['IEC 60079', 'ATEX 2014/34/EU'],
                environmental: ['F-gas Regulation (EU) 517/2014'],
                refrigerants: {
                    R717: { status: 'allowed', chargeLimit: 'EN 378' },
                    R404A: { status: 'prohibited_new', note: 'GWP > 2500 banned' },
                    R744: { status: 'preferred', note: 'No GWP restrictions' },
                    R290: { status: 'allowed', chargeLimit: '150g per circuit' }
                },
                notes: [
                    'F-gas regulation strictly enforced',
                    'HFC phase-down in effect',
                    'CE marking required for all equipment',
                    'ATEX zoning for ammonia machine rooms'
                ]
            },

            // North America (USA/Canada)
            'north_america': {
                primary: 'ANSI/ASHRAE',
                design: ['ASHRAE 15-2019', 'IIAR 2', 'IIAR 3'],
                safety: ['IIAR 2', 'IIAR 7', 'OSHA 1910.119'],
                pressure: ['ASME BPVC Section VIII', 'ASME B31.5'],
                electrical: ['NFPA 70 (NEC)', 'NFPA 497'],
                refrigerants: {
                    R717: { status: 'allowed', chargeLimit: 'ASHRAE 15/IIAR' },
                    R404A: { status: 'restricted', note: 'EPA SNAP delisting' },
                    R744: { status: 'allowed', note: 'Gaining popularity' }
                },
                notes: [
                    'IIAR standards for ammonia systems',
                    'PSM compliance required > 10,000 lbs NH3',
                    'RMP compliance for EPA reporting',
                    'ASME stamps required on vessels'
                ]
            },

            // Asia
            'asia': {
                primary: 'ISO/JIS',
                design: ['ISO 5149', 'JIS B 8621', 'GB/T 9237'],
                safety: ['ISO 5149-3', 'Local fire codes'],
                pressure: ['ASME VIII accepted', 'JIS B 8265'],
                notes: [
                    'Standards vary by country',
                    'Japan: JIS standards primary',
                    'China: GB standards required',
                    'Local translations may be needed'
                ]
            },

            // Default
            'default': {
                primary: 'ISO',
                design: ['ISO 5149-1', 'ISO 5149-2'],
                safety: ['ISO 5149-3', 'ISO 5149-4'],
                pressure: ['ISO 11439', 'EN 13445'],
                notes: [
                    'International ISO standards applied',
                    'Local requirements may override'
                ]
            }
        };
    }

    /**
     * Get standards for a region
     * @param {Object} project - Project context
     * @returns {Object} Applicable standards
     */
    getStandards(project) {
        const region = project.climate?.region || 'default';
        const country = project.location?.country || '';
        const refrigerant = project.refrigerant || 'R717';

        const standards = this.standards[region] || this.standards.default;

        // Build detailed report
        const report = {
            region: region,
            country: country,
            primaryStandard: standards.primary,

            applicableStandards: {
                design: standards.design,
                safety: standards.safety,
                pressure: standards.pressure,
                electrical: standards.electrical || ['IEC 60079']
            },

            refrigerantStatus: standards.refrigerants?.[refrigerant] || {
                status: 'check_local',
                note: 'Verify with local authority'
            },

            keyRequirements: this._getKeyRequirements(region, refrigerant),

            notes: standards.notes,

            certifications: this._getCertifications(region),

            inspections: this._getInspectionRequirements(region)
        };

        return report;
    }

    _getKeyRequirements(region, refrigerant) {
        const requirements = [];

        if (refrigerant === 'R717') {
            requirements.push({
                category: 'Machine Room',
                requirement: 'Dedicated ammonia machine room required',
                standard: region === 'north_america' ? 'IIAR 2' : 'EN 378-3'
            });

            requirements.push({
                category: 'Ventilation',
                requirement: 'Emergency ventilation with ammonia detection',
                standard: region === 'north_america' ? 'ASHRAE 15' : 'EN 378-3'
            });

            requirements.push({
                category: 'Safety Valves',
                requirement: 'Dual relief valves on all vessels',
                standard: region === 'north_america' ? 'IIAR 2' : 'EN 378-2'
            });

            requirements.push({
                category: 'Detection',
                requirement: 'Ammonia leak detection system required',
                standard: region === 'north_america' ? 'IIAR 2' : 'EN 378-3'
            });
        }

        requirements.push({
            category: 'Pressure Equipment',
            requirement: 'Third-party inspection of pressure vessels',
            standard: region === 'north_america' ? 'ASME VIII' : 'PED/EN 13445'
        });

        requirements.push({
            category: 'Documentation',
            requirement: 'Operating manual in local language',
            standard: 'EN 378-4 / Local requirements'
        });

        return requirements;
    }

    _getCertifications(region) {
        switch (region) {
            case 'europe':
                return ['CE Marking', 'PED Certificate', 'ATEX Certificate'];
            case 'north_america':
                return ['ASME U Stamp', 'UL Listing', 'ETL Mark'];
            case 'middle_east':
                return ['CE Marking accepted', 'Local authority approval'];
            case 'asia':
                return ['Varies by country', 'JIS/GB certification'];
            default:
                return ['ISO compliance certificate'];
        }
    }

    _getInspectionRequirements(region) {
        return {
            preCommissioning: 'Third-party inspection required',
            periodic: 'Annual safety inspection',
            pressure: region === 'north_america' ?
                'Every 5 years (ASME)' : 'Per EN 13445/PED requirements',
            refrigerant: region === 'europe' ?
                'Annual leak check (F-gas)' : 'As per local code'
        };
    }

    /**
     * Generate standards compliance report section
     * @param {Object} project - Project context
     * @returns {Object} Report content
     */
    generateReportSection(project) {
        const standards = this.getStandards(project);

        return {
            title: 'APPLICABLE STANDARDS AND REGULATIONS',
            content: {
                'Primary Standard Framework': standards.primaryStandard,
                'Design Standards': standards.applicableStandards.design.join(', '),
                'Safety Standards': standards.applicableStandards.safety.join(', '),
                'Pressure Equipment': standards.applicableStandards.pressure.join(', '),
                'Electrical Standards': standards.applicableStandards.electrical.join(', '),
                'Refrigerant Status': `${standards.refrigerantStatus.status} - ${standards.refrigerantStatus.note || ''}`,
                'Required Certifications': standards.certifications.join(', ')
            },
            keyRequirements: standards.keyRequirements,
            notes: standards.notes
        };
    }
}

module.exports = RegionalStandards;
