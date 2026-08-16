$ErrorActionPreference = 'Stop'

$changes = @(
    @{
        Path = 'backend/core/ai/InputParser.js'
        Find = @'
        project.rooms = project.rooms.length > 0 ? project.rooms : this._getDefaultRoom();
        // project.refrigerant = project.refrigerant || 'R717'; // Let Orchestrator handle defaults/recommendations

        return project;
'@
        Replace = @'
        project.rooms = project.rooms.length > 0 ? project.rooms : this._getDefaultRoom();
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

        return project;
'@
    },
    @{
        Path = 'backend/core/ai/InputParser.js'
        Find = @'
    _extractRequirements(input) {
'@
        Replace = @'
    _extractCoolingLoadKW(input) {
        const match = String(input || '').match(/(?:design\s*)?(?:cooling\s*)?load\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:kW|kw|kilowatts?)/i);
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
        const evaporatingTemperatureC = parseTemperature(/(?:evaporating|evaporation|evap)\s*(?:temperature|temp)?\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:°\s*C|°C|C|degrees?\s*C)?/i);
        const condensingTemperatureC = parseTemperature(/(?:condensing|condensation|cond)\s*(?:temperature|temp)?\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:°\s*C|°C|C|degrees?\s*C)?/i);
        return {
            evaporatingTemperatureC,
            condensingTemperatureC,
            source: evaporatingTemperatureC !== null || condensingTemperatureC !== null ? 'user-specified' : null
        };
    }
    _extractRequirements(input) {
'@
    },
    @{
        Path = 'backend/core/ai/DesignOrchestrator.js'
        Find = @'
                    designIntent: preParsedData.designIntent || {},
                    wallMaterial: preParsedData.wallMaterial,
'@
        Replace = @'
                    designIntent: preParsedData.designIntent || {},
                    capacity: Number(preParsedData.capacity) || Number(preParsedData.specifiedCoolingLoadKW) || null,
                    specifiedCoolingLoadKW: Number(preParsedData.specifiedCoolingLoadKW) || null,
                    operatingConditions: preParsedData.operatingConditions || {},
                    wallMaterial: preParsedData.wallMaterial,
'@
    },
    @{
        Path = 'backend/core/ai/DesignOrchestrator.js'
        Find = @'
        let estimatedLoad = info.dimensions ? (info.dimensions.length || 10) * (info.dimensions.width || 10) * (info.dimensions.height || 3) * 2 : 100;
        const temperature = info.temperature || -20;
'@
        Replace = @'
        const specifiedLoad = Number(info.specifiedCoolingLoadKW ?? info.capacity);
        let estimatedLoad = Number.isFinite(specifiedLoad) && specifiedLoad > 0
            ? specifiedLoad
            : (info.dimensions ? (info.dimensions.length || 10) * (info.dimensions.width || 10) * (info.dimensions.height || 3) * 2 : 100);
        const explicitEvaporatingTemperature = Number(info.operatingConditions?.evaporatingTemperatureC);
        const temperature = Number.isFinite(explicitEvaporatingTemperature)
            ? explicitEvaporatingTemperature
            : (info.temperature || -20);
'@
    },
    @{
        Path = 'backend/core/modules/LoadCalculator.js'
        Find = @'
            door: room.door || null,
            doorProtection: room.doorProtection || 0.7 // Strip curtain default
'@
        Replace = @'
            door: room.door || null,
            doorProtection: room.doorProtection || 0.7, // Strip curtain default
            specifiedCoolingLoadKW: Number(room.specifiedCoolingLoadKW ?? project.specifiedCoolingLoadKW) || null,
            designLoadBasis: room.designLoadBasis || null
'@
    },
    @{
        Path = 'backend/core/modules/LoadCalculator.js'
        Find = @'
        results.total = Math.round(results.total * 100) / 100;
        results.totalTR = Math.round((results.total / 3.517) * 100) / 100;
        return results;
'@
        Replace = @'
        results.total = Math.round(results.total * 100) / 100;
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
        return results;
'@
    },
    @{
        Path = 'backend/core/RefrigerationEngine.js'
        Find = @'
            const evapTemp = this._getEvaporatingTemp(load.room.temperature);
'@
        Replace = @'
            const explicitEvapTemp = Number(project?.operatingConditions?.evaporatingTemperatureC);
            const evapTemp = Number.isFinite(explicitEvapTemp)
                ? explicitEvapTemp
                : this._getEvaporatingTemp(load.room.temperature);
'@
    },
    @{
        Path = 'backend/core/modules/CompressorSelector.js'
        Find = @'
    _getCondensingTemp(project) {
        // Based on ambient and condenser type
'@
        Replace = @'
    _getCondensingTemp(project) {
        const specified = Number(project?.operatingConditions?.condensingTemperatureC);
        if (Number.isFinite(specified)) return specified;
        // Based on ambient and condenser type
'@
    },
    @{
        Path = 'backend/core/modules/CondenserSelector.js'
        Find = @'
        const condensingTemp = type === 'evaporative' ?
            wetBulb + selection.approach :
            dryBulb + selection.approach;
'@
        Replace = @'
        const specifiedCondensingTemp = Number(project?.operatingConditions?.condensingTemperatureC);
        const condensingTemp = Number.isFinite(specifiedCondensingTemp)
            ? specifiedCondensingTemp
            : (type === 'evaporative' ? wetBulb + selection.approach : dryBulb + selection.approach);
'@
    }
)

$contents = @{}
foreach ($change in $changes) {
    if (-not $contents.ContainsKey($change.Path)) {
        $contents[$change.Path] = [System.IO.File]::ReadAllText((Resolve-Path $change.Path)) -replace "`r`n", "`n"
    }
    $find = $change.Find -replace "`r`n", "`n"
    if (-not $contents[$change.Path].Contains($find)) {
        throw "Expected remaining source fragment was not found in $($change.Path)"
    }
}

foreach ($change in $changes) {
    $find = $change.Find -replace "`r`n", "`n"
    $replace = $change.Replace -replace "`r`n", "`n"
    $contents[$change.Path] = $contents[$change.Path].Replace($find, $replace)
}

foreach ($path in $contents.Keys) {
    [System.IO.File]::WriteAllText((Resolve-Path $path), $contents[$path])
}
Write-Output 'All remaining traceable design-input mappings were applied atomically.'
