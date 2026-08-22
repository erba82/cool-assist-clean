const BomGenerator = require('../engineering/BomGenerator');

/**
 * ReportGenerator - Professional Calculation Reports
 * 
 * Generates comprehensive design reports including:
 * - Calculation booklet with all formulas
 * - Equipment specifications (Bill of Materials)
 * - Standards compliance summary
 * - Energy analysis report
 * 
 * Output formats: JSON, HTML, PDF (via puppeteer)
 * 
 * @author GFDDE AI Engine
 * @version 2.0.0
 */

class ReportGenerator {
    constructor() {
        this.version = '2.1.0';
        this.bomGenerator = new BomGenerator();
    }

    /**
     * Generate complete design report
     * @param {Object} results - Core Engine calculation results
     * @param {Object} project - Project data
     * @returns {Object} Report data
     */
    generate(results, project) {
        const report = {
            metadata: this._generateMetadata(project),
            summary: this._generateSummary(results, project),
            calculations: this._generateCalculations(results, project),
            equipment: this._generateBOM(results, project),
            energy: this._generateEnergyReport(results),
            standards: this._generateStandardsReport(results, project),
            appendix: this._generateAppendix(results)
        };

        return report;
    }

    /**
     * Generate report metadata (cover page)
     */
    _generateMetadata(project) {
        return {
            projectName: project.name || 'Refrigeration System Design',
            projectNumber: `GFDDE-${Date.now().toString(36).toUpperCase()}`,
            client: project.client || 'N/A',
            location: `${project.location?.city || ''}, ${project.location?.country || ''}`,
            date: new Date().toLocaleDateString('en-GB'),
            engineer: 'Cool-Assist GFDDE',
            version: this.version,
            refrigerant: project.refrigerant,
            standards: ['Compliance review required — no standard conformance is asserted by this preliminary report']
        };
    }

    /**
     * Generate executive summary
     */
    _generateSummary(results, project) {
        return {
            title: 'Executive Summary',
            totalLoad: {
                value: Number.isFinite(Number(results.summary?.totalCoolingLoad)) ? Number(results.summary.totalCoolingLoad) : null,
                unit: 'kW',
                valueTR: Number.isFinite(Number(results.summary?.totalCoolingLoadTR)) ? Number(results.summary.totalCoolingLoadTR) : null
            },
            roomCount: project.rooms?.length || 0,
            temperatureLevels: results.summary?.temperatureLevels || [],
            refrigerant: {
                code: project.refrigerant,
                gwp: this._getRefrigerantGWP(project.refrigerant),
                safetyClass: this._getRefrigerantSafety(project.refrigerant)
            },
            equipment: {
                evaporatorCandidates: Array.isArray(results.calculations?.evaporators) ? results.calculations.evaporators.length : 0,
                compressorCandidates: Array.isArray(results.calculations?.compressors) ? results.calculations.compressors.length : 0,
                condenserCandidates: Array.isArray(results.calculations?.condensers) ? results.calculations.condensers.length : 0,
                vesselRecords: Array.isArray(results.calculations?.separators) ? results.calculations.separators.length : 0,
                selectionStatus: 'manufacturer-performance-map-and-engineering-review-required'
            },
            procurementStatus: 'Supplier quotation required; no estimated cost or lead time is generated.',
            estimatedCost: null,
            projectDuration: null
        };
    }

    /**
     * Generate detailed calculations section
     */
    _generateCalculations(results, project = {}) {
        const sections = [];
        const designBasis = project.designBasis || null;
        if (designBasis) {
            sections.push({
                title: '0. Approved Design Basis and Assumption Register',
                status: designBasis.status || 'review-required',
                statement: designBasis.statement || 'No final equipment selection, pipe DN, BIM set-out or procurement is authorised by this report.',
                parsedFacts: designBasis.parsedFacts || {},
                assumptions: Array.isArray(designBasis.assumptions) ? designBasis.assumptions : [],
                gates: designBasis.gates || {}
            });
        }

        // 1. Load Calculations
        if (results.calculations?.loads) {
            sections.push({
                title: '1. Cooling Load Calculations',
                subsections: results.calculations.loads.map((load, i) => ({
                    title: `1.${i + 1} ${load.roomName}`,
                    temperature: `${load.temperature}°C`,
                    dimensions: load.dimensions,
                    calculations: {
                        transmission: {
                            formula: 'Q = U × A × ΔT',
                            values: {
                                U: load.transmission?.parameters?.U_value,
                                A: load.dimensions?.wallArea + load.dimensions?.ceilingArea,
                                ΔT: load.transmission?.parameters?.deltaT
                            },
                            result: load.transmission?.total,
                            unit: 'kW'
                        },
                        product: {
                            formula: 'Q = m × Cp × ΔT / t',
                            values: {
                                m: load.product?.parameters?.productMass,
                                Cp: 'Variable',
                                ΔT: load.product?.parameters?.entryTemp - load.product?.parameters?.exitTemp,
                                t: load.product?.parameters?.cycleTime
                            },
                            result: load.product?.total,
                            unit: 'kW'
                        },
                        infiltration: {
                            formula: 'Q = V × ṁ × Δh',
                            result: load.infiltration?.total,
                            unit: 'kW'
                        },
                        internal: {
                            people: load.internal?.people,
                            lighting: load.internal?.lighting,
                            equipment: load.internal?.equipment,
                            result: load.internal?.total,
                            unit: 'kW'
                        },
                        total: {
                            subtotal: load.subtotal,
                            safetyFactor: load.safetyFactor,
                            total: load.total,
                            unit: 'kW'
                        }
                    }
                }))
            });
        }

        // 2. Equipment Selection: candidates are never procurement selections
        // until performance maps, envelope, motor data and design review are attached.
        sections.push({
            title: '2. Equipment Candidate Dossiers and Selection Gates',
            issueStatus: 'manufacturer-performance-map-and-engineering-review-required',
            subsections: [
                { title: '2.1 Evaporators', items: (results.calculations?.evaporators || []).map((item) => this._equipmentDossier(item, 'evaporator')) },
                { title: '2.2 Compressors', items: (results.calculations?.compressors || []).map((item) => this._equipmentDossier(item, 'compressor')) },
                { title: '2.3 Condensers', items: (Array.isArray(results.calculations?.condensers) ? results.calculations.condensers : (results.calculations?.condensers ? [results.calculations.condensers] : [])).map((item) => this._equipmentDossier(item, 'condenser')) },
                { title: '2.4 Vessels and Pumps', items: [ ...(results.calculations?.separators || []), ...(results.calculations?.pumps || []), ...(results.calculations?.receiver ? [results.calculations.receiver] : []) ].map((item) => this._equipmentDossier(item, 'vessel-or-pump')) }
            ]
        });

        return sections;
    }

    _equipmentDossier(item = {}, category) {
        const selected = item.manufacturerSelection?.selectedModel || null;
        const verifiedIdentity = item.selectionStatus === 'verified-selection' && selected?.manufacturer && selected?.model;
        const cycle = item.thermophysicalCycle?.performance || null;
        return {
            category,
            tag: item.tag || item.id || null,
            selectionStatus: item.selectionStatus || 'manufacturer-map-required',
            manufacturer: verifiedIdentity ? selected.manufacturer : null,
            model: verifiedIdentity ? selected.model : null,
            thermophysicalPreliminary: cycle ? {
                coolingDutyKw: cycle.coolingLoadKw ?? null,
                compressorPowerKw: cycle.compressorPowerKw ?? null,
                cop: cycle.cop ?? null,
                provenance: item.thermophysicalCycle?.provenance || null
            } : null,
            operatingPoint: item.operatingPoint || null,
            evidence: item.manufacturerSelection?.evidence || item.evidence || null,
            blockingReasons: item.blockingReasons || item.issues || ['Manufacturer performance map, operating envelope, motor data, connection data and engineering review are required before selection.'],
            quantity: verifiedIdentity && Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0 ? Number(item.quantity) : null,
            procurementAuthorised: false
        };
    }

    /**
     * Generate Bill of Materials
     */
    _generateBOM(results, project) {
        if (results?.synchronization?.bom) return results.synchronization.bom;
        return this.bomGenerator.generate({
            project,
            calculations: results?.calculations || {},
            pidData: results?.pidData || null
        });
    }
    /**
     * Generate energy analysis report
     */
    _generateEnergyReport(results) {
        if (!results.energy) return null;

        return {
            title: 'Energy Analysis',
            consumption: {
                annual: results.energy.annualConsumption,
                unit: 'kWh',
                cost: results.energy.annualCost,
                currency: 'USD'
            },
            optimization: {
                potential_savings_percent: results.energy.savingsPercent,
                annual_savings: results.energy.annualSavings,
                payback_period: results.energy.paybackYears,
                recommendations: results.energy.recommendations
            }
        };
    }

    /**
     * Generate standards compliance report
     */
    _generateStandardsReport(results, project) {
        return {
            title: 'Standards Compliance',
            primary_standard: results.standards?.primary || 'ISO',
            design_standards: results.standards?.design || [],
            safety_standards: results.standards?.safety || [],
            refrigerant_status: results.standards?.refrigerantStatus,
            certifications_required: results.standards?.certifications || [],
            safety_validation: results.safety
        };
    }

    /**
     * Generate appendix
     */
    _generateAppendix(results) {
        return {
            title: 'Appendix',
            sections: [
                {
                    title: 'A. Refrigerant Properties',
                    content: 'Thermodynamic properties table'
                },
                {
                    title: 'B. Equipment Datasheets',
                    content: 'Manufacturer datasheets'
                },
                {
                    title: 'C. P&ID Diagram',
                    content: 'Process and Instrumentation Diagram'
                }
            ]
        };
    }

    _getRefrigerantGWP(code) {
        const gwp = {
            'R717': 0,
            'R744': 1,
            'R290': 3,
            'R404A': 3922,
            'R410A': 2088,
            'R134a': 1430
        };
        return gwp[code] || 'N/A';
    }

    _getRefrigerantSafety(code) {
        const safety = {
            'R717': 'B2L',
            'R744': 'A1',
            'R290': 'A3',
            'R404A': 'A1',
            'R410A': 'A1',
            'R134a': 'A1'
        };
        return safety[code] || 'N/A';
    }
}

module.exports = ReportGenerator;
