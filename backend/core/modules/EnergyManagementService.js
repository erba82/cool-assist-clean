'use strict';

/**
 * Produces a traceable energy-management payload. It deliberately does not
 * manufacture annual consumption, tariffs, emissions, savings or payback.
 */
class EnergyManagementService {
    build(results, project) {
        const supplied = project?.energyManagement || project?.energy || {};
        const meters = Array.isArray(supplied.meters) ? supplied.meters.map((meter) => ({
            id: meter.id || null,
            name: meter.name || meter.id || null,
            coverage: meter.coverage || null,
            source: meter.source || null,
            status: meter.status === 'measured' && meter.source ? 'measured' : 'review-required'
        })) : [];
        const annualKwh = Number(supplied?.baseline?.annualKwh);
        const hasBaseline = Number.isFinite(annualKwh) && annualKwh >= 0 && supplied?.baseline?.period && supplied?.baseline?.source;
        const baseline = hasBaseline ? {
            annualKwh,
            period: supplied.baseline.period,
            boundary: supplied.baseline.boundary || null,
            source: supplied.baseline.source,
            origin: 'measured'
        } : {
            annualKwh: null,
            period: supplied?.baseline?.period || null,
            boundary: supplied?.baseline?.boundary || null,
            source: supplied?.baseline?.source || null,
            origin: 'input-required'
        };

        const equipmentGroups = [
            ...(Array.isArray(results?.calculations?.compressors) ? results.calculations.compressors : []),
            ...(Array.isArray(results?.calculations?.condensers) ? results.calculations.condensers : []),
            ...(Array.isArray(results?.calculations?.evaporators) ? results.calculations.evaporators : []),
            ...(Array.isArray(results?.calculations?.pumps) ? results.calculations.pumps : [])
        ];
        const powers = equipmentGroups
            .map((item) => Number(item?.electrical?.ratedPower ?? item?.electricalPower ?? item?.motorPower ?? item?.powerKW))
            .filter((value) => Number.isFinite(value) && value >= 0);
        const allPowersDeclared = equipmentGroups.length > 0 && powers.length === equipmentGroups.length;
        const connectedElectricalPowerKw = allPowersDeclared ? powers.reduce((sum, value) => sum + value, 0) : null;

        const throughput = Number(supplied?.throughput?.annualQuantity);
        const enpis = [];
        if (hasBaseline && Number.isFinite(throughput) && throughput > 0) {
            enpis.push({
                id: 'kwh-per-throughput',
                name: 'Electrical energy per annual throughput',
                value: annualKwh / throughput,
                unit: `kWh/${supplied.throughput.unit || 'unit'}`,
                boundary: baseline.boundary || 'Review boundary',
                relevantVariables: supplied.throughput.relevantVariables || 'Annual throughput',
                status: 'calculated',
                source: `${baseline.source}; ${supplied.throughput.source || 'throughput source not documented'}`
            });
        } else {
            enpis.push({
                id: 'kwh-per-throughput', name: 'Electrical energy per annual throughput', value: null, unit: null,
                boundary: baseline.boundary || null, relevantVariables: 'Annual throughput', status: 'input-required',
                source: 'Provide approved baseline meter data and annual throughput.'
            });
        }

        return {
            status: hasBaseline && meters.length ? 'review-required' : 'input-required',
            baseline,
            meters,
            connectedElectricalPowerKw,
            connectedPowerStatus: connectedElectricalPowerKw === null ? 'review-required' : 'calculated',
            enpis,
            actions: [
                {
                    id: 'define-boundary', name: 'Define energy boundary and baseline period', owner: 'Project energy manager',
                    status: hasBaseline && baseline.boundary ? 'review-required' : 'input-required',
                    evidence: 'Document covered loads, baseline dates, meter IDs, time zone and data-quality checks.'
                },
                {
                    id: 'meter-coverage', name: 'Verify sub-meter coverage', owner: 'Electrical / controls engineer',
                    status: meters.length ? 'review-required' : 'input-required',
                    evidence: 'Map compressor, condenser, evaporator/pump and facility meters to the defined boundary.'
                },
                {
                    id: 'measurement-verification', name: 'Approve measurement and verification plan', owner: 'Energy reviewer',
                    status: 'review-required',
                    evidence: 'Define relevant variables, comparison period, approval threshold and reporting cadence before claiming savings.'
                }
            ]
        };
    }
}

module.exports = EnergyManagementService;
