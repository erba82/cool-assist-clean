"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCatalogueValvePidSymbol = void 0;
const basePorts = {
    inlet: { x: 0, y: 30, direction: [-1, 0] },
    outlet: { x: 120, y: 30, direction: [1, 0] },
};
const bodyForClass = (model) => {
    const triangles = '<path d="M28 18 L60 30 L28 42 Z M92 18 L60 30 L92 42 Z" fill="none" stroke="currentColor" stroke-width="3"/>';
    switch (model.productClass) {
        case 'manual-stop':
            return `${triangles}<circle cx="60" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M60 16V24" stroke="currentColor" stroke-width="2"/>`;
        case 'manual-regulating':
            return `${triangles}<path d="M42 14 L78 46" stroke="currentColor" stroke-width="2"/><path d="M60 8V20" stroke="currentColor" stroke-width="2"/>`;
        case 'solenoid':
            return `${triangles}<rect x="50" y="5" width="20" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M54 12h12" stroke="currentColor" stroke-width="2"/>`;
        case 'check':
            return '<path d="M30 15 L74 30 L30 45 Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M78 15V45" stroke="currentColor" stroke-width="3"/>';
        case 'pilot-main':
            return `${triangles}<circle cx="60" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M60 15V23" stroke="currentColor" stroke-width="2"/>`;
        case 'control-station':
            return '<rect x="22" y="12" width="76" height="36" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M34 18V42 M50 18V42 M66 18V42 M82 18V42" stroke="currentColor" stroke-width="2"/>';
        case 'strainer':
            return '<path d="M30 15 L60 30 L30 45 Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M36 20L54 40 M36 28L50 44 M42 16L60 36" stroke="currentColor" stroke-width="1.5"/>';
        default:
            return triangles;
    }
};
/** Returns a standard schematic symbol. It is deliberately distinct from physical 3D port coordinates. */
const createCatalogueValvePidSymbol = (model) => {
    const arrow = model.flowDirection === 'unidirectional' ? '<path d="M102 30h10m-4-4 4 4-4 4" fill="none" stroke="currentColor" stroke-width="2"/>' : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" role="img" aria-label="${model.manufacturer} ${model.model}"><path d="M0 30H28 M92 30H120" fill="none" stroke="currentColor" stroke-width="3"/>${bodyForClass(model)}${arrow}</svg>`;
    return { id: `PID_${model.id}`, sourceModelId: model.id, viewBox: '0 0 120 60', ports: basePorts, svg };
};
exports.createCatalogueValvePidSymbol = createCatalogueValvePidSymbol;
