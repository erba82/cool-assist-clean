'use strict';

const asText = (...values) => values.filter((value) => value !== undefined && value !== null).map((value) => String(value)).join(' ').toLowerCase();

const familyFromNodeText = (text) => {
    if (/\b(screw|rotary[ _-]?screw|open[ _-]?screw|semi[ _-]?screw|mycom|mayekawa|howden)\b/.test(text)) return 'screw';
    if (/\b(recip(?:rocating)?|piston)\b/.test(text)) return 'reciprocating';
    if (/\bscroll\b/.test(text)) return 'scroll';
    return null;
};

const extractNodes = (document) => {
    if (!document || typeof document !== 'object') return [];
    if (Array.isArray(document.nodes)) return document.nodes;
    if (Array.isArray(document.diagram?.nodes)) return document.diagram.nodes;
    if (Array.isArray(document.pid?.nodes)) return document.pid.nodes;
    return [];
};

/**
 * Extracts only explicit semantic evidence from a structured P&ID document.
 * It intentionally does not perform OCR, image classification or derive equipment
 * capacity, DN, nozzle coordinates or safety suitability from text.
 */
function extractPidEvidence(document) {
    const nodes = extractNodes(document);
    const compressorEvidence = [];

    nodes.forEach((node, index) => {
        const data = node?.data || {};
        const text = asText(node?.type, data.componentType, data.subtype, data.label, data.tag, data.model, data.manufacturer, data.details?.model, data.details?.manufacturer);
        const family = familyFromNodeText(text);
        if (!family || !/compressor|screw|recip|piston|scroll|mycom|mayekawa|howden/.test(text)) return;
        compressorEvidence.push({
            family,
            nodeId: String(node?.id || data.tag || `node-${index + 1}`),
            tag: data.tag || null,
            label: data.label || data.componentType || null,
            source: 'pid-structured-node'
        });
    });

    const families = [...new Set(compressorEvidence.map((item) => item.family))];
    const warnings = [];
    if (families.length > 1) warnings.push('P&ID contains conflicting explicit compressor-family evidence; compressor selection remains review-required.');

    return {
        schema: 'cool-assist.pid-evidence.v1',
        nodesAnalysed: nodes.length,
        compressorFamily: families.length === 1 ? families[0] : null,
        compressorEvidence,
        warnings
    };
}

module.exports = { extractPidEvidence };
