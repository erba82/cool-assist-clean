"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCatalogueEquipmentPidSymbol = void 0;
const bodyForCategory = (model) => {
    switch (model.category) {
        case 'condenser':
            return '<rect x="20" y="15" width="80" height="30" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><path d="M30 45v10 M50 45v10 M70 45v10 M90 45v10" stroke="currentColor" stroke-width="2"/><path d="M35 15V5 M85 15V5" stroke="currentColor" stroke-width="2"/>';
        case 'liquid-pump':
            return '<circle cx="60" cy="30" r="18" fill="none" stroke="currentColor" stroke-width="3"/><path d="M45 30h30 M60 15v30" stroke="currentColor" stroke-width="2"/>';
        case 'evaporator':
            return '<rect x="25" y="15" width="70" height="30" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M35 15v30 M55 15v30 M75 15v30" stroke="currentColor" stroke-width="2"/><circle cx="60" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/>';
        default:
            return '<rect x="20" y="15" width="80" height="30" fill="none" stroke="currentColor" stroke-width="3"/>';
    }
};
const createCatalogueEquipmentPidSymbol = (model) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" role="img" aria-label="${model.manufacturer} ${model.model}"><path d="M0 30H20 M100 30H120" fill="none" stroke="currentColor" stroke-width="3"/>${bodyForCategory(model)}</svg>`;
    return { id: `PID_EQ_${model.id}`, sourceModelId: model.id, viewBox: '0 0 120 60', svg };
};
exports.createCatalogueEquipmentPidSymbol = createCatalogueEquipmentPidSymbol;
