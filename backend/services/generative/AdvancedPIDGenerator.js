'use strict';

const { getRefrigerantProfile } = require('../../core/data/RefrigerantProfiles');

class AdvancedPIDGenerator {
    _serviceStyle(service) {
        const styles = {
            discharge: { stroke: '#c62828', strokeWidth: 4 },
            hotGas: { stroke: '#c62828', strokeWidth: 4 },
            liquid: { stroke: '#2e7d32', strokeWidth: 3.5 },
            suction: { stroke: '#1565c0', strokeWidth: 3.5, strokeDasharray: '8,4' },
            oil: { stroke: '#c89a18', strokeWidth: 2.5 }
        };
        return styles[service] || { stroke: '#64748b', strokeWidth: 2.5 };
    }

    _findNominalDiameter(calculations, service, explicitDn = null) {
        const piping = calculations?.piping || {};
        const lines = Array.isArray(piping.lines) ? piping.lines
            : Array.isArray(piping.segments) ? piping.segments
                : Array.isArray(piping.sizes) ? piping.sizes : [];
        const candidate = lines.find((line) => String(line.service || line.type || line.name || line.description || '').toLowerCase().includes(service.toLowerCase()));
        const calculated = Number(candidate?.dn || candidate?.nominalDiameter || candidate?.sizeDN || candidate?.diameter);
        if (Number.isFinite(calculated) && calculated > 0) return Math.round(calculated);
        const requested = Number(explicitDn);
        return Number.isFinite(requested) && requested > 0 ? Math.round(requested) : null;
    }

    _selectDanfossIcfStation(branchDn, preferredModelId) {
        const dn = Number(branchDn);
        if (!Number.isFinite(dn) || dn <= 0 || !preferredModelId) return null;
        const stations = [
            { catalogueModelId: 'DANFOSS_ICF_20_4', label: 'Danfoss ICF 20-4 Valve Station', allowedDn: [20, 25, 32] },
            { catalogueModelId: 'DANFOSS_ICF_25_40_4', label: 'Danfoss ICF 25-4 / 40-4 Valve Station', allowedDn: [25, 32, 40] },
            { catalogueModelId: 'DANFOSS_ICF_25_40_6', label: 'Danfoss ICF 25-6 / 40-6 Valve Station', allowedDn: [25, 32, 40] }
        ];
        const selected = stations.find((station) => station.catalogueModelId === preferredModelId);
        return selected?.allowedDn.includes(dn) ? selected : null;
    }

    _first(value) {
        return Array.isArray(value) ? value[0] || {} : value || {};
    }

    _compressorComponentType(family) {
        const normalized = String(family || '').toLowerCase();
        if (/screw/.test(normalized)) return 'screw_compressor';
        if (/scroll/.test(normalized)) return 'scroll_compressor';
        return 'reciprocating_compressor';
    }

    _condenserLabel(type, selected) {
        if (selected?.model && selected?.selectionStatus === 'verified-candidate') return selected.model;
        if (type === 'air_cooled_condenser') return 'Air-Cooled Condenser — manufacturer map required';
        if (type === 'gas_cooler') return 'CO₂ Gas Cooler — manufacturer map required';
        return 'Evaporative Condenser — manufacturer map required';
    }

    async generate(results = {}, project = {}) {
        const calculations = results.calculations || {};
        const requestedRefrigerant = String(project.refrigerant || results?.project?.refrigerant || '').toUpperCase().replace(/\s+/g, '');
        const profile = getRefrigerantProfile(requestedRefrigerant);
        if (!profile) throw new Error(`No refrigerant profile is available for ${requestedRefrigerant}`);
        const refrigerant = profile.id;

        const semantic = project.semanticCycle || {};
        const isAmmonia = profile.family === 'ammonia-industrial';
        const isCO2 = profile.family === 'co2-transcritical';
        const compressorFamily = semantic.compressorFamily || profile.compressor.family || 'unknown';
        const condenserType = semantic.condenserType || profile.heatRejection.type || 'unknown';
        const feedMethod = semantic.feedMethod || profile.feedMethod || (profile.cycle?.startsWith('dx-') ? 'direct_expansion' : 'unknown');
        const equipmentPolicy = semantic.equipmentPolicy || {};
        const totalLoad = Number(results?.summary?.totalCoolingLoad || calculations?.totalCoolingLoad || 0);

        const rawCompressors = Array.isArray(calculations.compressors) && calculations.compressors.length
            ? calculations.compressors : [{ type: compressorFamily, selectionStatus: 'manufacturer-model-and-map-required' }];
        const requestedCount = Number(project?.designIntent?.compressorCount);
        const compressorCount = Number.isFinite(requestedCount) && requestedCount > 0 ? requestedCount : rawCompressors.length;
        const compressors = Array.from({ length: Math.max(1, compressorCount) }, (_, index) => {
            const source = rawCompressors[index] || rawCompressors[index % rawCompressors.length] || {};
            return {
                ...source,
                tag: source.tag || `COMP-${String(index + 1).padStart(2, '0')}`,
                model: source.model || 'Compressor train — manufacturer model/map required',
                selectionStatus: source.selectionStatus || 'manufacturer-model-and-map-required'
            };
        });

        const rooms = Array.isArray(project.rooms) && project.rooms.length ? project.rooms : [];
        const rawEvaporators = Array.isArray(calculations.evaporators) && calculations.evaporators.length ? calculations.evaporators : [];
        const evaporatorCount = Math.max(rawEvaporators.length, rooms.length, 1);
        const areas = Array.isArray(semantic.processAreas) ? semantic.processAreas : [];
        const evaporators = Array.from({ length: evaporatorCount }, (_, index) => {
            const source = rawEvaporators[index] || rawEvaporators[index % Math.max(1, rawEvaporators.length)] || {};
            const room = rooms[index] || {};
            const roomId = source.roomId || room.id || room.name || `ROOM-${String(index + 1).padStart(2, '0')}`;
            const area = areas.find((item) => String(item.id) === String(roomId)) || {};
            const roomType = area.type || source.roomType || room.type || 'cold-storage';
            return {
                ...source,
                tag: source.tag || `EVP-${String(index + 1).padStart(2, '0')}`,
                model: source.model || (roomType === 'iqf_tunnel' ? 'IQF air-unit bank — model confirmation required' : isAmmonia ? 'Industrial Unit Cooler' : 'DX Unit Cooler'),
                roomId,
                roomName: source.roomName || room.name || `Cold Room ${index + 1}`,
                roomType,
                temperature: source.temperature ?? room.temperature ?? null,
                capacity: source.capacity || source.capacityPerUnit || room.capacity || null
            };
        });

        const explicitDn = project?.designIntent?.pipeDn || project?.pipeDn || {};
        const dn = {
            discharge: this._findNominalDiameter(calculations, 'discharge', explicitDn.discharge),
            liquid: this._findNominalDiameter(calculations, 'liquid', explicitDn.liquid),
            suction: this._findNominalDiameter(calculations, 'suction', explicitDn.suction),
            branchLiquid: this._findNominalDiameter(calculations, 'branch liquid', project?.designIntent?.valveStationDN ?? explicitDn.branchLiquid),
            branchSuction: this._findNominalDiameter(calculations, 'branch suction', explicitDn.branchSuction),
            oil: this._findNominalDiameter(calculations, 'oil', explicitDn.oil)
        };

        const requestedIcfModel = semantic.valveStationModel || project?.designIntent?.valveStationModel || project?.valveStationModel || null;
        const icfStation = isAmmonia && feedMethod === 'pumped_recirculated'
            ? this._selectDanfossIcfStation(dn.branchLiquid, requestedIcfModel) : null;
        const nodes = [];
        const edges = [];
        let nodeNumber = 1;
        let edgeNumber = 1;
        const resolvePreviewPorts = (details = {}) => {
            if (Array.isArray(details.connectionPorts) && details.connectionPorts.length) return details.connectionPorts;
            // Generic drawing ports only support editable topology. They are not
            // manufacturer nozzle coordinates and remain review-required.
            return [
                { id: 'inlet', direction: 'in', side: 'left', service: null, evidenceStatus: 'review-required' },
                { id: 'outlet', direction: 'out', side: 'right', service: null, evidenceStatus: 'review-required' }
            ];
        };
        const addNode = ({ x, y, label, componentType, tag, details = {}, roomId, roomName, mounting, elevation }) => {
            const id = `node-${nodeNumber++}`;
            const connectionPorts = resolvePreviewPorts(details);
            const declaredElevation = Number(project?.plantLayout?.equipment?.[tag]?.elevationM ?? project?.plantLayout?.equipment?.[tag]?.centerlineElevationM);
            nodes.push({
                id,
                type: 'industrial',
                position: { x, y },
                data: {
                    label, componentType, tag,
                    details: { ...details, connectionPorts, portEvidenceStatus: details.connectionPorts?.length ? 'catalogue-or-source-record' : 'review-required' },
                    roomId, roomName, mounting,
                    elevation: Number.isFinite(declaredElevation) ? declaredElevation : null,
                    elevationStatus: Number.isFinite(declaredElevation) ? 'declared-layout-input' : 'layout-input-required',
                    refrigerant
                }
            });
            return id;
        };
        const connect = (source, target, service, nominalDiameter, label, extra = {}) => {
            const id = `edge-${edgeNumber++}`;
            const lineId = `L-${String(edgeNumber - 1).padStart(3, '0')}`;
            const dnValue = Number.isFinite(Number(nominalDiameter)) && Number(nominalDiameter) > 0 ? Math.round(Number(nominalDiameter)) : null;
            const description = String(label || `${refrigerant} ${service}`)
                .replace(/\s*DN(?:null|undefined|NaN|\d+)\b/gi, '')
                .replace(/\s*DN REVIEW/gi, '')
                .trim();
            const resolvedLabel = `${lineId} · ${description || `${refrigerant} ${service}`} · ${dnValue ? `DN${dnValue}` : 'DN pending hydraulic sizing'}`;
            edges.push({
                id, source, target, type: 'smoothstep', label: resolvedLabel,
                service, dn: dnValue,
                data: {
                    lineId, service, dn: dnValue, nominalDiameter: dnValue, medium: refrigerant,
                    sizingStatus: dnValue ? 'traceable-input-or-calculation' : 'hydraulic-sizing-required',
                    sourcePortId: extra.sourcePortId || 'outlet',
                    targetPortId: extra.targetPortId || 'inlet',
                    portValidationStatus: extra.portValidationStatus || 'review-required',
                    jointType: profile.piping.jointType, connectionType: profile.piping.jointType,
                    ...extra
                },
                style: this._serviceStyle(service)
            });
            return id;
        };

        const selectedCondenser = this._first(calculations.condensers);
        const condenserId = addNode({
            x: 700, y: 110, label: this._condenserLabel(condenserType, selectedCondenser),
            componentType: condenserType, tag: selectedCondenser.tag || 'COND-01', mounting: 'roof',
            details: { heatRejectionDutyKw: selectedCondenser.heatRejection || null, refrigerant, semanticSource: semantic.source || 'inferred', selectionStatus: selectedCondenser.selectionStatus || 'manufacturer-map-required' }
        });
        const receiverId = equipmentPolicy.includeHighPressureReceiver !== false ? addNode({
            x: 700, y: 270, label: profile.liquidManagement.receiver, componentType: 'horizontal_vessel',
            tag: isAmmonia ? 'REC-HP-01' : isCO2 ? 'FGR-01' : 'REC-LP-01',
            details: { function: isCO2 ? 'CO2 flash-gas separation — configuration review required' : 'liquid receiver', volume: calculations.receiver?.volume || null, refrigerant }
        }) : null;
        const oilSeparatorId = equipmentPolicy.includeOilSeparator ? addNode({
            x: 510, y: 360, label: 'Oil Separator', componentType: 'oil_separator', tag: 'SEP-OIL-01',
            details: { function: 'discharge oil separation', refrigerant }
        }) : null;
        const lowPressureSeparatorId = equipmentPolicy.includeLowPressureSeparator ? addNode({
            x: 760, y: 545, label: 'Low-Pressure Suction Separator', componentType: 'horizontal_vessel', tag: 'SEP-LP-01',
            details: { function: 'ammonia surge drum / wet-return separation', refrigerant, feedMethod, elevationContract: 'declared separator elevation must exceed each connected compressor suction centreline; no automatic set-out' }
        }) : addNode({
            x: 465, y: 650, label: profile.liquidManagement.accumulator, componentType: 'horizontal_vessel', tag: 'HDR-SUC-01',
            details: { function: 'common suction header / liquid protection', refrigerant, feedMethod }
        });

        const compressorTrain = compressors.map((compressor, index) => {
            const y = 440 + index * 175;
            const compressorId = addNode({
                x: 225, y, label: compressor.model, componentType: this._compressorComponentType(compressorFamily), tag: compressor.tag,
                details: { manufacturer: compressor.manufacturer || null, manufacturerModelKey: compressor.manufacturerModelKey || null, capacityKw: null, motorRatedKw: null, refrigerant, compressorFamily, selectionStatus: compressor.selectionStatus || 'manufacturer-map-required', selectionSource: semantic.source || 'inferred' }
            });
            const dischargeCheckId = addNode({ x: 350, y: y - 35, label: 'Discharge Check Valve', componentType: 'check_valve', tag: `CV-DIS-${String(index + 1).padStart(2, '0')}`, details: { service: 'discharge', refrigerant } });
            const suctionStrainerId = addNode({ x: 350, y: y + 50, label: 'Suction Strainer', componentType: 'strainer', tag: `STR-SUC-${String(index + 1).padStart(2, '0')}`, details: { service: 'suction', refrigerant } });
            connect(suctionStrainerId, compressorId, 'suction', dn.suction, `${refrigerant} suction DN${dn.suction}`);
            connect(compressorId, dischargeCheckId, 'discharge', dn.discharge, `${refrigerant} discharge DN${dn.discharge}`);
            return { compressorId, dischargeCheckId, suctionStrainerId };
        });

        compressorTrain.forEach((train, index) => {
            connect(lowPressureSeparatorId, train.suctionStrainerId, 'suction', dn.suction, `${refrigerant} suction header DN${dn.suction}`, { branch: `compressor-${index + 1}` });
            connect(train.dischargeCheckId, oilSeparatorId || condenserId, 'discharge', dn.discharge, `${refrigerant} discharge header DN${dn.discharge}`);
        });
        if (oilSeparatorId) connect(oilSeparatorId, condenserId, 'discharge', dn.discharge, `${refrigerant} hot gas DN${dn.discharge}`);
        const highPressureControlId = isCO2 ? addNode({
            x: 825, y: 185, label: 'CO₂ High-Pressure Control Valve — model confirmation required', componentType: 'high_pressure_control_valve', tag: 'HPV-01',
            details: { function: 'transcritical high-side pressure control', refrigerant, source: 'semantic-review-required' }
        }) : null;
        if (receiverId && highPressureControlId) {
            connect(condenserId, highPressureControlId, 'discharge', dn.discharge, `${refrigerant} gas-cooler outlet DN${dn.discharge}`);
            connect(highPressureControlId, receiverId, 'liquid', dn.liquid, `${refrigerant} flash-gas receiver inlet DN${dn.liquid}`);
        } else if (receiverId) connect(condenserId, receiverId, 'liquid', dn.liquid, `${refrigerant} liquid DN${dn.liquid}`);

        let liquidHeaderId = null;
        if (feedMethod === 'pumped_recirculated') {
            const feedRegulatorId = addNode({
                x: 835, y: 390, label: 'HP-to-LP Feed Regulator', componentType: 'globe_valve', tag: 'REG-FEED-01',
                details: { function: 'HP receiver to LP separator feed control', refrigerant, feedMethod }
            });
            const liquidPumpId = addNode({
                x: 760, y: 705, label: 'Ammonia Liquid Recirculation Pump', componentType: 'centrifugal_pump', tag: 'PMP-LIQ-01',
                details: { function: 'pumped liquid feed', refrigerant, feedMethod, elevationContract: 'declared pump suction centreline and vendor NPSHr/suction-loss inputs required; P&ID position is not an elevation claim' }
            });
            liquidHeaderId = addNode({ x: 1020, y: 640, label: 'Liquid Recirculation Header', componentType: 'horizontal_vessel', tag: 'HDR-LIQ-01', details: { function: 'pumped liquid distribution', refrigerant } });
            if (receiverId) connect(receiverId, feedRegulatorId, 'liquid', dn.liquid, `${refrigerant} HP liquid DN${dn.liquid}`);
            connect(feedRegulatorId, lowPressureSeparatorId, 'liquid', dn.liquid, `${refrigerant} LP feed DN${dn.liquid}`);
            connect(lowPressureSeparatorId, liquidPumpId, 'liquid', dn.liquid, `${refrigerant} pump suction DN${dn.liquid}`);
            connect(liquidPumpId, liquidHeaderId, 'liquid', dn.liquid, `${refrigerant} pumped liquid header DN${dn.liquid}`);
        } else if (receiverId) {
            liquidHeaderId = addNode({ x: 980, y: 300, label: feedMethod === 'direct_expansion' ? 'Liquid Line Header' : 'Gravity Liquid Header', componentType: 'horizontal_vessel', tag: 'HDR-LIQ-01', details: { function: 'liquid distribution header', refrigerant, feedMethod } });
            connect(receiverId, liquidHeaderId, 'liquid', dn.liquid, `${refrigerant} liquid header DN${dn.liquid}`);
        }

        const thermosiphonId = equipmentPolicy.includeThermosiphon ? addNode({
            x: 505, y: 235, label: 'Thermosiphon Supply Vessel', componentType: 'thermosiphon_vessel', tag: 'TS-OC-01',
            details: { function: 'screw-compressor oil-cooler refrigerant supply', refrigerant, oilCooling: 'thermosiphon', elevationContract: 'declared source liquid level, oil-cooler elevation and loop-loss calculation are required; no static head is claimed from drawing coordinates' }
        }) : null;
        if (thermosiphonId && receiverId) connect(receiverId, thermosiphonId, 'liquid', dn.branchLiquid, `${refrigerant} thermosiphon liquid supply DN${dn.branchLiquid}`, { thermosiphonLoop: 'supply' });
        if (thermosiphonId) {
            compressorTrain.forEach((train, index) => {
                const oilCoolerId = addNode({
                    x: 470, y: 420 + index * 175,
                    label: `Compressor ${index + 1} Oil Cooler — map/layout required`,
                    componentType: 'oil_cooler',
                    tag: `OC-${String(index + 1).padStart(2, '0')}`,
                    details: { function: 'thermosiphon-cooled compressor oil cooler', refrigerant, compressorTag: compressors[index]?.tag || null, elevationContract: 'oil-cooler connection elevation and thermosiphon loop loss required' }
                });
                connect(thermosiphonId, oilCoolerId, 'liquid', dn.branchLiquid, `${refrigerant} thermosiphon downcomer DN${dn.branchLiquid}`, { thermosiphonLoop: 'downcomer', compressorBranch: index + 1 });
                connect(oilCoolerId, thermosiphonId, 'suction', dn.branchSuction, `${refrigerant} thermosiphon two-phase return DN${dn.branchSuction}`, { thermosiphonLoop: 'two-phase-return', compressorBranch: index + 1 });
            });
        } else if (oilSeparatorId) {
            compressorTrain.forEach((train, index) => connect(oilSeparatorId, train.compressorId, 'oil', dn.oil, `Oil return to compressor ${index + 1} DN${dn.oil}`, { compressorBranch: index + 1 }));
        }

        evaporators.forEach((evaporator, index) => {
            const column = Math.floor(index / 3);
            const row = index % 3;
            const x = 1170 + column * 420;
            const y = 250 + row * 240;
            const isIqf = /iqf|tunnel|spiral/.test(String(evaporator.roomType || '').toLowerCase());
            const evaporatorId = addNode({
                x, y, label: evaporator.model, componentType: isIqf ? 'iqf_tunnel_evaporator' : 'evaporator', tag: evaporator.tag,
                roomId: evaporator.roomId, roomName: evaporator.roomName,
                details: { designDutyKw: evaporator.designDuty?.requiredCoolingLoadKw || evaporator.capacity || null, temperature: evaporator.temperature, refrigerant, processType: evaporator.roomType, selectionStatus: evaporator.selectionStatus || 'manufacturer-map-required' }
            });
            if (!liquidHeaderId) return;
            if (isAmmonia && feedMethod === 'pumped_recirculated') {
                const stationId = addNode({
                    x: x - 155, y, label: equipmentPolicy.includeAmmoniaValveStation && icfStation ? icfStation.label : 'Ammonia Feed Valve Station — review required',
                    componentType: 'ammonia_valve_station', tag: `VST-IQF-${String(index + 1).padStart(2, '0')}`,
                    roomId: evaporator.roomId, roomName: evaporator.roomName,
                    details: { service: 'liquid feed', refrigerant, manufacturer: equipmentPolicy.includeAmmoniaValveStation && icfStation ? 'Danfoss' : null, catalogueModelId: equipmentPolicy.includeAmmoniaValveStation && icfStation ? icfStation.catalogueModelId : null, source: equipmentPolicy.includeAmmoniaValveStation && icfStation ? 'manufacturer-catalogue' : 'semantic-review-required', nominalDiameter: dn.branchLiquid, selectionReason: icfStation ? 'confirmed-model-and-dn-compatible' : requestedIcfModel ? `Requested ${requestedIcfModel} is not configured for branch DN${dn.branchLiquid}` : `Danfoss ICF model must be confirmed for branch DN${dn.branchLiquid}` }
                });
                connect(liquidHeaderId, stationId, 'liquid', dn.branchLiquid, `${refrigerant} pumped feed DN${dn.branchLiquid}`, { branch: evaporator.roomId });
                connect(stationId, evaporatorId, 'liquid', dn.branchLiquid, `${refrigerant} controlled feed DN${dn.branchLiquid}`);
            } else if (feedMethod === 'direct_expansion') {
                const solenoidId = addNode({ x: x - 170, y, label: isCO2 ? 'CO₂ Liquid Isolation Valve' : 'Liquid Solenoid', componentType: 'solenoid_valve', tag: `SV-LIQ-${String(index + 1).padStart(2, '0')}`, roomId: evaporator.roomId, roomName: evaporator.roomName, details: { service: 'liquid', refrigerant } });
                const expansionLabel = isCO2 ? 'CO₂ Electronic Expansion Valve — model confirmation required' : 'Thermostatic Expansion Valve';
                const expansionId = addNode({ x: x - 80, y, label: expansionLabel, componentType: isCO2 ? 'electronic_expansion_valve' : 'tev', tag: `${isCO2 ? 'EEV' : 'TEV'}-${String(index + 1).padStart(2, '0')}`, roomId: evaporator.roomId, roomName: evaporator.roomName, details: { service: 'liquid expansion', refrigerant, source: isCO2 ? 'semantic-review-required' : undefined } });
                connect(liquidHeaderId, solenoidId, 'liquid', dn.branchLiquid, `${refrigerant} liquid branch DN${dn.branchLiquid}`, { branch: evaporator.roomId });
                connect(solenoidId, expansionId, 'liquid', dn.branchLiquid, `${refrigerant} liquid DN${dn.branchLiquid}`);
                connect(expansionId, evaporatorId, 'liquid', dn.branchLiquid, `${refrigerant} expansion feed DN${dn.branchLiquid}`);
            } else {
                const feedValveId = addNode({ x: x - 95, y, label: 'Gravity Feed Valve', componentType: 'globe_valve', tag: `GV-FEED-${String(index + 1).padStart(2, '0')}`, roomId: evaporator.roomId, roomName: evaporator.roomName, details: { service: 'gravity liquid feed', refrigerant } });
                connect(liquidHeaderId, feedValveId, 'liquid', dn.branchLiquid, `${refrigerant} gravity feed DN${dn.branchLiquid}`, { branch: evaporator.roomId });
                connect(feedValveId, evaporatorId, 'liquid', dn.branchLiquid, `${refrigerant} liquid feed DN${dn.branchLiquid}`);
            }
            const suctionValveId = addNode({ x: x + 125, y: y + 60, label: 'Suction Service Valve', componentType: 'globe_valve', tag: `SV-SUC-${String(index + 1).padStart(2, '0')}`, roomId: evaporator.roomId, roomName: evaporator.roomName, details: { service: 'suction', refrigerant } });
            connect(evaporatorId, suctionValveId, 'suction', dn.branchSuction, `${refrigerant} ${feedMethod === 'pumped_recirculated' ? 'wet return' : 'suction'} DN${dn.branchSuction}`);
            connect(suctionValveId, lowPressureSeparatorId, 'suction', dn.branchSuction, `${refrigerant} ${feedMethod === 'pumped_recirculated' ? 'wet return header' : 'suction header'} DN${dn.branchSuction}`, { branch: evaporator.roomId });
        });

        const safetyDeviceMap = {
            'ammonia detection': ['Ammonia Gas Detector', 'gas_detector'],
            'mechanical ventilation': ['Emergency Ventilation Fan', 'ventilation_fan'],
            'emergency ventilation': ['Emergency Ventilation Fan', 'ventilation_fan'],
            'emergency shutdown': ['Emergency Shutdown Panel', 'emergency_shutdown'],
            'pressure relief review': ['Pressure Relief Review Point', 'relief_valve']
        };
        profile.safeguards.forEach((requirement, index) => {
            const mapped = safetyDeviceMap[requirement] || [requirement, 'safety_control'];
            addNode({ x: 60 + (index % 2) * 145, y: 105 + Math.floor(index / 2) * 75, label: mapped[0], componentType: mapped[1], tag: `SAFE-${String(index + 1).padStart(2, '0')}`, mounting: 'wall', details: { safetyRequirement: requirement, refrigerant, profile: profile.id } });
        });

        return {
            nodes,
            edges,
            rooms: rooms.map((room, index) => ({ id: room.id || room.name || `ROOM-${index + 1}`, name: room.name || `Room ${index + 1}`, type: room.processType || room.type || 'cold-room', width: room.length || null, depth: room.width || null, height3D: room.height || null })),
            metadata: {
                generator: 'GFDDE Semantic Refrigerant Topology', refrigerant, topology: profile.topology, cycle: profile.cycle,
                assemblyTitle: `${refrigerant} P&ID TO BIM ASSEMBLY`, semanticCycle: semantic,
                profile: { id: profile.id, family: profile.family, safetyClass: profile.safetyClass, componentPolicy: profile.componentPolicy, safeguards: profile.safeguards, pipingMaterial: profile.piping.material },
                jointPolicy: profile.piping.policy,
                sizingStatus: 'Every line without a finite DN is explicitly marked hydraulic-sizing-required. No placeholder DN is issued.',
                elevationStatus: project?.plantLayout ? 'declared-layout-input-present-review-required' : 'layout-input-required',
                totalLoad
            }
        };
    }
}

module.exports = AdvancedPIDGenerator;
