'use strict';

const { getRefrigerantProfile, normalizeRefrigerant } = require('../data/RefrigerantProfiles');
const { resolveCycleTemplate } = require('../data/CycleTemplateRegistry');
const { extractPidEvidence } = require('./PidEvidenceExtractor');

const KNOWN_COMPRESSORS = new Set(['screw', 'reciprocating', 'scroll']);
const KNOWN_CONDENSERS = new Set(['evaporative_condenser', 'air_cooled_condenser', 'gas_cooler']);
const KNOWN_FEEDS = new Set(['pumped_recirculated', 'gravity_flooded', 'direct_expansion']);
const KNOWN_OIL_COOLING = new Set(['thermosiphon', 'none']);

const asText = (value) => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
const finiteNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

const compressorFamily = (value) => {
    const normalized = asText(value);
    if (/screw|rotary_screw|open_screw|semi.*screw/.test(normalized)) return 'screw';
    if (/recip|piston/.test(normalized)) return 'reciprocating';
    if (/scroll/.test(normalized)) return 'scroll';
    return null;
};

const condenserFamily = (value) => {
    const normalized = asText(value);
    if (/evaporative|evap_cond/.test(normalized)) return 'evaporative_condenser';
    if (/air.*cool|air_cooled|aircondenser/.test(normalized)) return 'air_cooled_condenser';
    if (/gas_cooler/.test(normalized)) return 'gas_cooler';
    return null;
};

const feedMethod = (value) => {
    const normalized = asText(value);
    if (/pumped|recirc|overfeed|circulation/.test(normalized)) return 'pumped_recirculated';
    if (/gravity|flooded/.test(normalized)) return 'gravity_flooded';
    if (/direct.*expansion|\bdx\b/.test(normalized)) return 'direct_expansion';
    return null;
};

const oilCooling = (value) => {
    const normalized = asText(value);
    if (/thermosiphon/.test(normalized)) return 'thermosiphon';
    if (/none|no_oil_cooler/.test(normalized)) return 'none';
    return null;
};

const processType = (value) => {
    const normalized = asText(value);
    if (/iqf/.test(normalized)) return 'iqf_tunnel';
    if (/spiral/.test(normalized)) return 'spiral_tunnel';
    if (/blast|tunnel/.test(normalized)) return 'blast_tunnel';
    if (/process|packing/.test(normalized)) return 'processing';
    if (/chill|precool/.test(normalized)) return 'chilling';
    if (/store|storage|freez/.test(normalized)) return 'storage';
    return 'unknown';
};

/**
 * Converts explicitly supplied project intent and validated design selections into
 * a semantic cycle contract. It deliberately does not infer pipe dimensions,
 * nozzle frames, relief design or equipment capacity from text/image content.
 */
class RefrigerationTopologyInterpreter {
    interpret(project = {}, calculations = {}) {
        const refrigerant = normalizeRefrigerant(project.refrigerant || '');
        const profile = getRefrigerantProfile(refrigerant);
        const intent = project.designIntent || {};
        const supplied = project.semanticCycle || {};
        const evidence = [];
        const warnings = [];
        const blocking = [];
        const pidEvidence = extractPidEvidence(project.pidDocument || project.pidDiagram || project.diagram || project.pid || null);

        const explicitCompressor = compressorFamily(supplied.compressorFamily || intent.compressorType || project.compressorType);
        const diagramCompressor = compressorFamily(pidEvidence.compressorFamily);
        const calculatedCompressor = compressorFamily(calculations?.compressors?.[0]?.type || calculations?.compressors?.[0]?.series);
        const profileCompressor = compressorFamily(profile?.compressor?.family);
        const selectedCompressor = explicitCompressor || diagramCompressor || calculatedCompressor || profileCompressor || 'unknown';
        evidence.push({ field: 'compressorFamily', value: selectedCompressor, source: explicitCompressor ? 'user-confirmed' : diagramCompressor ? 'pid-structured-evidence' : calculatedCompressor ? 'calculation-selection' : profileCompressor ? 'refrigerant-profile' : 'unknown' });
        warnings.push(...pidEvidence.warnings);

        const explicitCondenser = condenserFamily(supplied.condenserType || intent.condenserType || project.condenserType || (intent.roofCondenser ? 'evaporative_condenser' : null));
        const calculatedCondenser = condenserFamily(calculations?.condensers?.[0]?.type || calculations?.condensers?.[0]?.model);
        const profileCondenser = condenserFamily(profile?.heatRejection?.type);
        const selectedCondenser = explicitCondenser || calculatedCondenser || profileCondenser || 'unknown';
        evidence.push({ field: 'condenserType', value: selectedCondenser, source: explicitCondenser ? 'user-confirmed' : calculatedCondenser ? 'calculation-selection' : profileCondenser ? 'refrigerant-profile' : 'unknown' });

        const explicitFeed = feedMethod(supplied.feedMethod || intent.feedMethod || intent.liquidFeedMethod || (intent.liquidPump ? 'pumped_recirculated' : null));
        const profileFeed = profile?.cycle === 'pumped_ammonia_industrial' ? 'pumped_recirculated' : profile?.cycle?.startsWith('dx-') ? 'direct_expansion' : null;
        const selectedFeed = explicitFeed || profileFeed || 'unknown';
        evidence.push({ field: 'feedMethod', value: selectedFeed, source: explicitFeed ? 'user-confirmed' : profileFeed ? 'refrigerant-profile' : 'unknown' });

        const explicitOilCooling = oilCooling(supplied.oilCooling || intent.oilCooling || (intent.thermosiphon ? 'thermosiphon' : null));
        const selectedOilCooling = explicitOilCooling || 'unknown';
        evidence.push({ field: 'oilCooling', value: selectedOilCooling, source: explicitOilCooling ? 'user-confirmed' : 'not-confirmed' });

        const rooms = Array.isArray(project.rooms) ? project.rooms : [];
        const areas = rooms.map((room, index) => ({
            id: String(room.id || room.name || `AREA-${index + 1}`),
            name: String(room.name || `Process Area ${index + 1}`),
            type: processType(room.processType || room.type || room.name),
            evaporatorArrangement: processType(room.processType || room.type || room.name) === 'iqf_tunnel' ? 'tunnel-air-unit-bank' : 'room-air-unit',
            geometryConfirmed: ['length', 'width', 'height'].every((key) => finiteNumber(room[key]) !== null),
            source: room.source || 'project-room'
        }));

        if (!profile) blocking.push(`Unsupported refrigerant profile: ${refrigerant || 'none'}`);
        if (!explicitCompressor) warnings.push('Compressor family was not explicitly confirmed; selection may be inferred from refrigerant profile or calculations.');
        if (!explicitCondenser) warnings.push('Condenser type was not explicitly confirmed; selection may be inferred from refrigerant profile or calculations.');
        if (!explicitFeed) warnings.push('Liquid-feed philosophy was not explicitly confirmed; a preliminary refrigerant-profile assumption is marked for engineering review.');
        if (areas.some((area) => area.type === 'iqf_tunnel' && !area.geometryConfirmed)) warnings.push('IQF/tunnel geometry is incomplete; the BIM process-area envelope is preliminary.');
        if (selectedOilCooling === 'thermosiphon' && selectedCompressor !== 'screw') warnings.push('Thermosiphon oil cooling is requested without a confirmed screw-compressor family; review the machine package data.');
        if (selectedFeed === 'pumped_recirculated' && selectedCondenser === 'air_cooled_condenser' && refrigerant === 'R717') warnings.push('R717 pumped recirculation with an air-cooled condenser requires project-specific engineering review; no general suitability is asserted.');

        const isAmmonia = profile?.family === 'ammonia-industrial';
        const template = resolveCycleTemplate({
            profile,
            compressorFamily: selectedCompressor,
            condenserType: selectedCondenser,
            feedMethod: selectedFeed
        });
        if (!template && profile) {
            warnings.push('No approved semantic cycle template matches the resolved refrigerant, compressor, condenser and feed combination; preserve the graph as review-required.');
        }
        if (template) evidence.push({ field: 'cycleTemplate', value: template.id, source: 'validated-semantic-registry' });
        const validated = blocking.length === 0;
        const inferredFields = evidence.filter((item) => item.source !== 'user-confirmed').length;
        const confidence = Math.max(0, Math.min(1, Number(((evidence.length - inferredFields * 0.45) / Math.max(1, evidence.length)).toFixed(2))));

        return {
            schema: 'cool-assist.semantic-cycle.v1',
            source: explicitCompressor || explicitCondenser || explicitFeed || explicitOilCooling ? 'user-confirmed' : 'inferred',
            confidence,
            refrigerant,
            profile: profile ? { id: profile.id, family: profile.family, safetyClass: profile.safetyClass, jointType: profile.piping.jointType } : null,
            compressorFamily: KNOWN_COMPRESSORS.has(selectedCompressor) ? selectedCompressor : 'unknown',
            condenserType: KNOWN_CONDENSERS.has(selectedCondenser) ? selectedCondenser : 'unknown',
            feedMethod: KNOWN_FEEDS.has(selectedFeed) ? selectedFeed : 'unknown',
            oilCooling: KNOWN_OIL_COOLING.has(selectedOilCooling) ? selectedOilCooling : 'unknown',
            template,
            equipmentPolicy: {
                includeOilSeparator: isAmmonia || selectedCompressor === 'screw' || Boolean(intent.oilSeparator),
                includeHighPressureReceiver: isAmmonia || Boolean(intent.horizontalReceiver),
                includeLowPressureSeparator: selectedFeed === 'pumped_recirculated',
                includeLiquidPump: selectedFeed === 'pumped_recirculated',
                includeThermosiphon: selectedOilCooling === 'thermosiphon',
                includeAmmoniaValveStation: isAmmonia && selectedFeed === 'pumped_recirculated' && Boolean(intent.ammoniaValveStation),
            },
            processAreas: areas,
            pidEvidence,
            evidence,
            validation: {
                valid: validated,
                blocking,
                warnings,
                engineeringReviewRequired: blocking.length > 0 || warnings.length > 0 || confidence < 0.75,
            }
        };
    }
}

module.exports = RefrigerationTopologyInterpreter;
