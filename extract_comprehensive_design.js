const fs = require('fs');
const path = process.argv[2];
const raw = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
const doc = JSON.parse(raw);
const root = doc?.data?.pidData || doc?.pidData || doc?.data || doc;
const nodes = root?.nodes || root?.equipment || [];
const edges = root?.edges || root?.pipes || [];
const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
const nodeRows = nodes.map((n) => ({
  id: n.id,
  tag: n.data?.tag || n.tag || n.id,
  label: n.data?.label || n.label || '',
  componentType: n.data?.componentType || n.componentType || n.type || '',
  position: n.position || null,
  ports: n.data?.ports || n.ports || null,
}));
const edgeRows = edges.map((e) => ({
  id: e.id,
  source: e.source || e.from || e.sourceId || '',
  sourceTag: byId[e.source || e.from || e.sourceId]?.data?.tag || '',
  target: e.target || e.to || e.targetId || '',
  targetTag: byId[e.target || e.to || e.targetId]?.data?.tag || '',
  service: e.data?.service || e.service || e.data?.lineType || e.lineType || '',
  dn: e.data?.dn || e.dn || e.data?.nominalDiameter || '',
  size: e.data?.size || e.size || '',
  style: e.style || null,
}));
console.log(JSON.stringify({
  topLevelKeys: Object.keys(doc || {}),
  rootKeys: Object.keys(root || {}),
  metadata: root?.metadata || {},
  refrigerant: root?.refrigerant || doc?.refrigerant || '',
  projectName: root?.projectName || doc?.projectName || '',
  nodeCount: nodeRows.length,
  edgeCount: edgeRows.length,
  nodes: nodeRows,
  edges: edgeRows,
  calculations: doc?.data?.calculations || doc?.calculations || null,
  equipmentSchedule: doc?.data?.equipmentSchedule || doc?.equipmentSchedule || null,
}, null, 2));
