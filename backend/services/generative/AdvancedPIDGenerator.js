class AdvancedPIDGenerator {
    _isAmmonia(refrigerant) {
        return /^(R?717|NH3|AMMONIA)$/i.test(String(refrigerant || '').replace(/[\s-]/g, ''));
    }

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

    _findNominalDiameter(calculations, service, fallback) {
        const piping = calculations?.piping || {};
        const lines = Array.isArray(piping.lines) ? piping.lines
            : Array.isArray(piping.segments) ? piping.segments
                : Array.isArray(piping.sizes) ? piping.sizes : [];
        const candidate = lines.find(line => {
            const name = String(line.service || line.type || line.name || line.description || '').toLowerCase();
            return name.includes(service.toLowerCase());
        });
        const value = Number(candidate?.dn || candidate?.nominalDiameter || candidate?.sizeDN || candidate?.diameter);
        return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
    }

    _compressorType(compressor, refrigerant, totalLoad) {
        const description = `${compressor?.type || ''} ${compressor?.model || ''} ${compressor?.technology || ''}`.toLowerCase();
        if (/screw/.test(description) || (this._isAmmonia(refrigerant) && totalLoad >= 100)) return 'screw_compressor';
        return 'reciprocating_compressor';
    }

    async generate(results = {}, project = {}) {
        const calculations = results.calculations || {};
        const refrigerant = String(project.refrigerant || results?.project?.refrigerant || 'R404A').toUpperCase().replace(/\s+/g, '');
        const isAmmonia = this._isAmmonia(refrigerant);
        const totalLoad = Number(results?.summary?.totalCoolingLoad || calculations?.totalCoolingLoad || 0);
        const selectedCompressors = Array.isArray(calculations.compressors) && calculations.compressors.length
            ? calculations.compressors
            : [{ model: isAmmonia ? 'HSN8571' : 'Copeland ZB Series', type: isAmmonia ? 'Screw' : 'Reciprocating' }];
        const requestedCount = Number(project?.designIntent?.compressorCount);
        const compressorCount = Number.isFinite(requestedCount) && requestedCount > 0 ? requestedCount : selectedCompressors.length;
        const compressors = Array.from({ length: compressorCount }, (_, index) => {
            const source = selectedCompressors[index] || selectedCompressors[index % selectedCompressors.length] || {};
            return {
                ...source,
                tag: source.tag || `COMP-${String(index + 1).padStart(2, '0')}`,
                model: source.model || (isAmmonia ? 'HSN8571' : 'Copeland ZB Series')
            };
        });
        const rawEvaporators = Array.isArray(calculations.evaporators) && calculations.evaporators.length
            ? calculations.evaporators : [];
        const rooms = Array.isArray(project.rooms) && project.rooms.length ? project.rooms : [];
        const evaporatorCount = Math.max(rawEvaporators.length, rooms.length, 1);
        const evaporators = Array.from({ length: evaporatorCount }, (_, index) => {
            const source = rawEvaporators[index] || rawEvaporators[index % Math.max(1, rawEvaporators.length)] || {};
            const room = rooms[index] || {};
            return {
                ...source,
                tag: source.tag || `EVP-${String(index + 1).padStart(2, '0')}`,
                model: source.model || (isAmmonia ? 'Industrial Unit Cooler' : 'DX Unit Cooler'),
                roomId: source.roomId || room.id || `ROOM-${String(index + 1).padStart(2, '0')}`,
                roomName: source.roomName || room.name || `Cold Room ${index + 1}`,
                roomType: source.roomType || room.type || 'cold-storage',
                temperature: source.temperature ?? room.temperature ?? null,
                capacity: source.capacity || source.capacityPerUnit || room.capacity || null
            };
        });

        const dn = {
            discharge: this._findNominalDiameter(calculations, 'discharge', isAmmonia ? 100 : 50),
            liquid: this._findNominalDiameter(calculations, 'liquid', isAmmonia ? 80 : 32),
            suction: this._findNominalDiameter(calculations, 'suction', isAmmonia ? 125 : 65),
            branchLiquid: this._findNominalDiameter(calculations, 'branch liquid', isAmmonia ? 32 : 20),
            branchSuction: this._findNominalDiameter(calculations, 'branch suction', isAmmonia ? 50 : 32),
            oil: this._findNominalDiameter(calculations, 'oil', 25)
        };
        const nodes = [];
        const edges = [];
        let nodeNumber = 1;
        let edgeNumber = 1;
        const addNode = ({ x, y, label, componentType, tag, details = {}, roomId, roomName, mounting, elevation }) => {
            const id = `node-${nodeNumber++}`;
            nodes.push({
                id,
                type: 'industrial',
                position: { x, y },
                data: { label, componentType, tag, details, roomId, roomName, mounting, elevation, refrigerant }
            });
            return id;
        };
        const connect = (source, target, service, nominalDiameter, label, extra = {}) => {
            const id = `edge-${edgeNumber++}`;
            edges.push({
                id,
                source,
                target,
                type: 'smoothstep',
                label: label || `${refrigerant} ${service} DN${nominalDiameter}`,
                service,
                dn: nominalDiameter,
                data: {
                    service,
                    dn: nominalDiameter,
                    nominalDiameter,
                    medium: refrigerant,
                    jointType: 'welded',
                    connectionType: 'welded',
                    ...extra
                },
                style: this._serviceStyle(service)
            });
            return id;
        };

        const condenser = calculations.condensers?.[0] || {};
        const condenserId = addNode({
            x: 700, y: 110,
            label: condenser.model || (isAmmonia ? 'Evaporative Condenser' : 'Air-Cooled Condenser'),
            componentType: isAmmonia ? 'evaporative_condenser' : 'air_cooled_condenser',
            tag: condenser.tag || 'COND-01',
            mounting: 'roof',
            elevation: 7.3,
            details: { capacity: condenser.capacity || condenser.heatRejection || null, refrigerant }
        });

        const receiverId = addNode({
            x: 700, y: 270,
            label: isAmmonia ? 'HP Receiver' : 'Liquid Receiver',
            componentType: 'horizontal_vessel',
            tag: isAmmonia ? 'REC-HP-01' : 'REC-LP-01',
            details: { function: 'liquid receiver', volume: calculations.receiver?.volume || null, refrigerant }
        });

        const needsOilSeparator = isAmmonia || compressors.length > 1 || Boolean(calculations.oilSeparators?.length);
        const oilSeparatorId = needsOilSeparator ? addNode({
            x: 510, y: 360,
            label: 'Oil Separator',
            componentType: 'oil_separator',
            tag: 'SEP-OIL-01',
            details: { function: 'discharge oil separation', refrigerant }
        }) : null;

        const liquidConditioningId = isAmmonia ? addNode({
            x: 845, y: 270,
            label: 'Liquid Pump',
            componentType: 'centrifugal_pump',
            tag: 'PMP-LIQ-01',
            details: { function: 'pumped liquid feed', refrigerant }
        }) : addNode({
            x: 845, y: 270,
            label: 'Filter Drier',
            componentType: 'strainer',
            tag: 'FD-01',
            details: { function: 'liquid line filtration', refrigerant }
        });
        const liquidHeaderId = addNode({
            x: 980, y: 300,
            label: 'Liquid Header',
            componentType: 'horizontal_vessel',
            tag: 'HDR-LIQ-01',
            details: { function: 'liquid distribution header', refrigerant }
        });
        const suctionHeaderId = addNode({
            x: 465, y: 650,
            label: isAmmonia ? 'Low-Pressure Suction Separator' : 'Suction Accumulator',
            componentType: 'horizontal_vessel',
            tag: isAmmonia ? 'SEP-LP-01' : 'ACC-SUC-01',
            details: { function: 'common suction header / liquid protection', refrigerant }
        });

        const compressorTrain = compressors.map((compressor, index) => {
            const y = 440 + index * 175;
            const compressorId = addNode({
                x: 225, y,
                label: compressor.model,
                componentType: this._compressorType(compressor, refrigerant, totalLoad),
                tag: compressor.tag,
                details: { capacity: compressor.capacity || compressor.capacityKW || null, refrigerant, type: compressor.type || null }
            });
            const dischargeCheckId = addNode({
                x: 350, y: y - 35,
                label: 'Discharge Check Valve',
                componentType: 'check_valve',
                tag: `CV-DIS-${String(index + 1).padStart(2, '0')}`,
                details: { service: 'discharge', refrigerant }
            });
            const suctionStrainerId = addNode({
                x: 350, y: y + 50,
                label: 'Suction Strainer',
                componentType: 'strainer',
                tag: `STR-SUC-${String(index + 1).padStart(2, '0')}`,
                details: { service: 'suction', refrigerant }
            });
            connect(suctionStrainerId, compressorId, 'suction', dn.suction, `${refrigerant} suction DN${dn.suction}`);
            connect(compressorId, dischargeCheckId, 'discharge', dn.discharge, `${refrigerant} discharge DN${dn.discharge}`);
            return { compressorId, dischargeCheckId, suctionStrainerId };
        });

        compressorTrain.forEach((train, index) => {
            if (oilSeparatorId) {
                connect(train.dischargeCheckId, oilSeparatorId, 'discharge', dn.discharge, `${refrigerant} discharge header DN${dn.discharge}`);
            } else {
                connect(train.dischargeCheckId, condenserId, 'discharge', dn.discharge, `${refrigerant} discharge DN${dn.discharge}`);
            }
            connect(suctionHeaderId, train.suctionStrainerId, 'suction', dn.suction, `${refrigerant} suction header DN${dn.suction}`, { branch: `compressor-${index + 1}` });
        });
        if (oilSeparatorId) {
            connect(oilSeparatorId, condenserId, 'discharge', dn.discharge, `${refrigerant} hot gas DN${dn.discharge}`);
            connect(oilSeparatorId, compressorTrain[0].compressorId, 'oil', dn.oil, 'Oil return DN25', { function: 'oil return' });
        }
        connect(condenserId, receiverId, 'liquid', dn.liquid, `${refrigerant} liquid DN${dn.liquid}`);
        connect(receiverId, liquidConditioningId, 'liquid', dn.liquid, `${refrigerant} liquid DN${dn.liquid}`);
        connect(liquidConditioningId, liquidHeaderId, 'liquid', dn.liquid, `${refrigerant} liquid header DN${dn.liquid}`);

        evaporators.forEach((evaporator, index) => {
            const column = Math.floor(index / 3);
            const row = index % 3;
            const x = 1170 + column * 420;
            const y = 250 + row * 240;
            const solenoidId = addNode({
                x: x - 170, y,
                label: 'Liquid Solenoid',
                componentType: 'solenoid_valve',
                tag: `SV-LIQ-${String(index + 1).padStart(2, '0')}`,
                roomId: evaporator.roomId,
                roomName: evaporator.roomName,
                details: { service: 'liquid', refrigerant }
            });
            const tevId = addNode({
                x: x - 80, y,
                label: isAmmonia ? 'Hand Expansion Valve' : 'Thermostatic Expansion Valve',
                componentType: 'tev',
                tag: `TEV-${String(index + 1).padStart(2, '0')}`,
                roomId: evaporator.roomId,
                roomName: evaporator.roomName,
                details: { service: 'liquid expansion', refrigerant }
            });
            const evaporatorId = addNode({
                x, y,
                label: evaporator.model,
                componentType: 'evaporator',
                tag: evaporator.tag,
                roomId: evaporator.roomId,
                roomName: evaporator.roomName,
                details: { capacity: evaporator.capacity, temperature: evaporator.temperature, refrigerant }
            });
            const suctionValveId = addNode({
                x: x + 125, y: y + 60,
                label: 'Suction Service Valve',
                componentType: 'globe_valve',
                tag: `SV-SUC-${String(index + 1).padStart(2, '0')}`,
                roomId: evaporator.roomId,
                roomName: evaporator.roomName,
                details: { service: 'suction', refrigerant }
            });
            connect(liquidHeaderId, solenoidId, 'liquid', dn.branchLiquid, `${refrigerant} liquid branch DN${dn.branchLiquid}`, { branch: evaporator.roomId });
            connect(solenoidId, tevId, 'liquid', dn.branchLiquid, `${refrigerant} liquid DN${dn.branchLiquid}`);
            connect(tevId, evaporatorId, 'liquid', dn.branchLiquid, `${refrigerant} expansion feed DN${dn.branchLiquid}`);
            connect(evaporatorId, suctionValveId, 'suction', dn.branchSuction, `${refrigerant} suction branch DN${dn.branchSuction}`);
            connect(suctionValveId, suctionHeaderId, 'suction', dn.branchSuction, `${refrigerant} suction header branch DN${dn.branchSuction}`, { branch: evaporator.roomId });
        });

        const assemblyTitle = `${refrigerant} P&ID TO BIM ASSEMBLY`;
        return {
            nodes,
            edges,
            metadata: {
                generator: 'GFDDE Refrigerant-Aware Topology',
                refrigerant,
                topology: isAmmonia ? 'pumped-ammonia-industrial' : 'direct-expansion-refrigeration',
                assemblyTitle,
                jointPolicy: isAmmonia ? 'R717 process piping: welded connections by default; flanges only when explicitly specified.' : `${refrigerant} design: refrigerant-specific equipment and closed-loop topology generated from the submitted design.`,
                sizingStatus: 'preliminary DN values; final sizes require verified pressure-drop calculation inputs.',
                timestamp: new Date().toISOString()
            }
        };
    }
}

module.exports = AdvancedPIDGenerator;
