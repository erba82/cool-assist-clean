'use strict';

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const files = [
  'backend/core/ai/InputParser.js',
  'backend/core/ai/DesignOrchestrator.js',
  'backend/core/modules/LoadCalculator.js',
  'backend/core/RefrigerationEngine.js',
  'backend/core/modules/CompressorSelector.js',
  'backend/core/modules/CondenserSelector.js',
];
const texts = new Map(files.map(file => [file, fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n')]));

function edit(file, find, replace) {
  const source = texts.get(file);
  const first = source.indexOf(find);
  if (first < 0 || source.indexOf(find, first + find.length) >= 0) {
    throw new Error(`Expected exactly one source fragment in ${file}`);
  }
  texts.set(file, source.slice(0, first) + replace + source.slice(first + find.length));
}

edit('backend/core/ai/InputParser.js', `        project.rooms = project.rooms.length > 0 ? project.rooms : this._getDefaultRoom();
        // project.refrigerant = project.refrigerant || 'R717'; // Let Orchestrator handle defaults/recommendations

        return project;`, `        project.rooms = project.rooms.length > 0 ? project.rooms : this._getDefaultRoom();
        if (Number.isFinite(project.specifiedCoolingLoadKW) && project.specifiedCoolingLoadKW > 0) {
            project.capacity = project.specifiedCoolingLoadKW;
            if (project.rooms.length === 1) {
                project.rooms[0] = {
                    ...project.rooms[0],
                    specifiedCoolingLoadKW: project.specifiedCoolingLoadKW,
                    designLoadBasis: 'user-specified'
                };
            }
        }
        // project.refrigerant = project.refrigerant || 'R717'; // Let Orchestrator handle defaults/recommendations

        return project;`);

edit('backend/core/ai/InputParser.js', `    _extractRequirements(input) {`, `    _extractCoolingLoadKW(input) {
        const match = String(input || '').match(/(?:design\\s*)?(?:cooling\\s*)?load\\s*[:=]?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:kW|kw|kilowatts?)/i);
        const value = match ? Number(match[1]) : null;
        return Number.isFinite(value) && value > 0 ? value : null;
    }
    _extractOperatingConditions(input) {
        const text = String(input || '');
        const parseTemperature = (expression) => {
            const match = text.match(expression);
            const value = match ? Number(match[1]) : null;
            return Number.isFinite(value) ? value : null;
        };
        const evaporatingTemperatureC = parseTemperature(/(?:evaporating|evaporation|evap)\\s*(?:temperature|temp)?\\s*[:=]?\\s*([+-]?\\d+(?:\\.\\d+)?)\\s*(?:°\\s*C|°C|C|degrees?\\s*C)?/i);
        const condensingTemperatureC = parseTemperature(/(?:condensing|condensation|cond)\\s*(?:temperature|temp)?\\s*[:=]?\\s*([+-]?\\d+(?:\\.\\d+)?)\\s*(?:°\\s*C|°C|C|degrees?\\s*C)?/i);
        return {
            evaporatingTemperatureC,
            condensingTemperatureC,
            source: evaporatingTemperatureC !== null || condensingTemperatureC !== null ? 'user-specified' : null
        };
    }
    _extractRequirements(input) {`);

edit('backend/core/ai/DesignOrchestrator.js', `                    designIntent: preParsedData.designIntent || {},
                    wallMaterial: preParsedData.wallMaterial,`, `                    designIntent: preParsedData.designIntent || {},
                    capacity: Number(preParsedData.capacity) || Number(preParsedData.specifiedCoolingLoadKW) || null,
                    specifiedCoolingLoadKW: Number(preParsedData.specifiedCoolingLoadKW) || null,
                    operatingConditions: preParsedData.operatingConditions || {},
                    wallMaterial: preParsedData.wallMaterial,`);

edit('backend/core/ai/DesignOrchestrator.js', `        let estimatedLoad = info.dimensions ? (info.dimensions.length || 10) * (info.dimensions.width || 10) * (info.dimensions.height || 3) * 2 : 100;
        const temperature = info.temperature || -20;`, `        const specifiedLoad = Number(info.specifiedCoolingLoadKW ?? info.capacity);
        let estimatedLoad = Number.isFinite(specifiedLoad) && specifiedLoad > 0
            ? specifiedLoad
            : (info.dimensions ? (info.dimensions.length || 10) * (info.dimensions.width || 10) * (info.dimensions.height || 3) * 2 : 100);
        const explicitEvaporatingTemperature = Number(info.operatingConditions?.evaporatingTemperatureC);
        const temperature = Number.isFinite(explicitEvaporatingTemperature)
            ? explicitEvaporatingTemperature
            : (info.temperature || -20);`);

edit('backend/core/modules/LoadCalculator.js', `            door: room.door || null,
            doorProtection: room.doorProtection || 0.7 // Strip curtain default
        };`, `            door: room.door || null,
            doorProtection: room.doorProtection || 0.7, // Strip curtain default
            specifiedCoolingLoadKW: Number(room.specifiedCoolingLoadKW ?? project.specifiedCoolingLoadKW) || null,
            designLoadBasis: room.designLoadBasis || null
        };`);

edit('backend/core/modules/LoadCalculator.js', `        results.total = Math.round(results.total * 100) / 100;
        results.totalTR = Math.round((results.total / 3.517) * 100) / 100;

        return results;`, `        results.total = Math.round(results.total * 100) / 100;
        if (Number.isFinite(safeRoom.specifiedCoolingLoadKW) && safeRoom.specifiedCoolingLoadKW > 0) {
            results.calculatedThermalLoad = results.total;
            results.total = safeRoom.specifiedCoolingLoadKW;
            results.designLoad = {
                basis: safeRoom.designLoadBasis || 'user-specified',
                specifiedCoolingLoadKW: safeRoom.specifiedCoolingLoadKW,
                calculatedThermalLoadKW: results.calculatedThermalLoad,
                note: 'User-specified design cooling load governs equipment sizing; component heat-load calculation is retained for engineering review.'
            };
        }
        results.totalTR = Math.round((results.total / 3.517) * 100) / 100;

        return results;`);

edit('backend/core/RefrigerationEngine.js', `            const evapTemp = this._getEvaporatingTemp(load.room.temperature);`, `            const explicitEvapTemp = Number(project?.operatingConditions?.evaporatingTemperatureC);
            const evapTemp = Number.isFinite(explicitEvapTemp)
                ? explicitEvapTemp
                : this._getEvaporatingTemp(load.room.temperature);`);

edit('backend/core/modules/CompressorSelector.js', `    _getCondensingTemp(project) {
        // Based on ambient and condenser type`, `    _getCondensingTemp(project) {
        const specified = Number(project?.operatingConditions?.condensingTemperatureC);
        if (Number.isFinite(specified)) return specified;
        // Based on ambient and condenser type`);

edit('backend/core/modules/CondenserSelector.js', `        const condensingTemp = type === 'evaporative' ?
            wetBulb + selection.approach :
            dryBulb + selection.approach;`, `        const specifiedCondensingTemp = Number(project?.operatingConditions?.condensingTemperatureC);
        const condensingTemp = Number.isFinite(specifiedCondensingTemp)
            ? specifiedCondensingTemp
            : (type === 'evaporative' ? wetBulb + selection.approach : dryBulb + selection.approach);`);

for (const [file, text] of texts) {
  fs.writeFileSync(path.join(root, file), text, 'utf8');
}
console.log('Applied remaining traceable design-input mappings atomically.');
