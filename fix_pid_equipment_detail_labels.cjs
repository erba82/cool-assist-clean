'use strict';
const fs = require('fs');
const path = require('path');
const target = path.resolve(process.cwd(), 'frontend/src/components/ProfessionalPIDCanvas.tsx');
let source = fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');

const find = `        if (nodes.length > 0 || edges.length > 0) {
            console.log('[PIDCanvas] Mapping P&ID topology:', nodes.length, 'equipment nodes and', edges.length, 'pipe edges');
            return {
                compressors: nodes.filter((n: any) => n.data?.componentType?.includes('compressor')).map((n: any) => ({ x: n.position.x * 2.5 + 200, y: n.position.y * 2.5 + 100, tag: n.data.tag, model: n.data.label, power: n.data.details })),
                condensers: nodes.filter((n: any) => n.data?.componentType === 'evaporative_condenser').map((n: any) => ({ x: n.position.x * 2.5 + 200, y: n.position.y * 2.5 + 100, tag: n.data.tag, model: n.data.label, capacity: n.data.details })),
                evaporators: nodes.filter((n: any) => n.data?.componentType === 'evaporator').map((n: any) => ({ x: n.position.x * 2.5 + 200, y: n.position.y * 2.5 + 100, tag: n.data.tag, capacity: n.data.details })),
                vessels: nodes.filter((n: any) => n.data?.componentType?.includes('vessel')).map((n: any) => ({ x: n.position.x * 2.5 + 200, y: n.position.y * 2.5 + 100, tag: n.data.tag, type: n.data.label, volume: n.data.details })),`;
const replacement = `        if (nodes.length > 0 || edges.length > 0) {
            console.log('[PIDCanvas] Mapping P&ID topology:', nodes.length, 'equipment nodes and', edges.length, 'pipe edges');
            const equipmentDetailLabel = (details: any) => {
                if (details === null || details === undefined) return 'N/A';
                if (typeof details === 'string' || typeof details === 'number') return String(details);
                if (typeof details === 'object') {
                    const capacity = details.capacity ?? details.capacityKW ?? details.designLoad ?? details.totalCapacity;
                    if (capacity !== undefined && capacity !== null) return String(capacity) + (typeof capacity === 'number' ? ' kW' : '');
                    const model = details.model ?? details.manufacturer ?? details.refrigerant;
                    if (model !== undefined && model !== null) return String(model);
                }
                return 'See equipment schedule';
            };
            return {
                compressors: nodes.filter((n: any) => n.data?.componentType?.includes('compressor')).map((n: any) => ({ x: n.position.x * 2.5 + 200, y: n.position.y * 2.5 + 100, tag: n.data.tag, model: n.data.label, power: equipmentDetailLabel(n.data.details) })),
                condensers: nodes.filter((n: any) => n.data?.componentType === 'evaporative_condenser').map((n: any) => ({ x: n.position.x * 2.5 + 200, y: n.position.y * 2.5 + 100, tag: n.data.tag, model: n.data.label, capacity: equipmentDetailLabel(n.data.details) })),
                evaporators: nodes.filter((n: any) => n.data?.componentType === 'evaporator').map((n: any) => ({ x: n.position.x * 2.5 + 200, y: n.position.y * 2.5 + 100, tag: n.data.tag, capacity: equipmentDetailLabel(n.data.details) })),
                vessels: nodes.filter((n: any) => n.data?.componentType?.includes('vessel')).map((n: any) => ({ x: n.position.x * 2.5 + 200, y: n.position.y * 2.5 + 100, tag: n.data.tag, type: n.data.label, volume: equipmentDetailLabel(n.data.details) })),`;

const first = source.indexOf(find);
if (first < 0 || source.indexOf(find, first + find.length) >= 0) {
  throw new Error('Expected exactly one P&ID topology mapping block.');
}
source = source.slice(0, first) + replacement + source.slice(first + find.length);
fs.writeFileSync(target, source, 'utf8');
console.log('Normalized P&ID equipment-detail labels for safe SVG rendering.');
