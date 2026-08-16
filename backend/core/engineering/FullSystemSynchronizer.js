'use strict';

const BomGenerator = require('./BomGenerator');
const { CatalogueRepository } = require('./CatalogueRepository');
const { LocationAwareProcurementEngine } = require('./LocationAwareProcurementEngine');
const { getRefrigerantProfile, normalizeRefrigerant } = require('../data/RefrigerantProfiles');

function toArray(value) {
  return Array.isArray(value) ? value : (value ? [value] : []);
}

function safeId(value, fallback) {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function selectionCategoryList(calculations) {
  return [
    ['compressor', toArray(calculations.compressors)],
    ['condenser', toArray(calculations.condensers)],
    ['evaporator', toArray(calculations.evaporators)],
    ['separator', toArray(calculations.separators)],
    ['receiver', toArray(calculations.receiver)],
    ['thermosiphon', toArray(calculations.thermosiphon)],
    ['pump', toArray(calculations.pumps)]
  ];
}

function catalogueCategory(category) {
  return ['compressor', 'condenser', 'evaporator', 'pump'].includes(category) ? category : null;
}

function declaredRefrigerantMismatch(catalogue, selectedRefrigerant) {
  return catalogue.status === 'verified' && catalogue.compatibleWithSelectedRefrigerant === false
    ? `Catalogue record ${catalogue.model || catalogue.catalogueModelId} is not declared compatible with ${selectedRefrigerant}.`
    : null;
}

class FullSystemSynchronizer {
  constructor({
    catalogueRepository = new CatalogueRepository(),
    bomGenerator = null,
    procurementEngine = null
  } = {}) {
    this.catalogueRepository = catalogueRepository;
    this.bomGenerator = bomGenerator || new BomGenerator({ catalogueRepository });
    this.procurementEngine = procurementEngine || new LocationAwareProcurementEngine();
  }

  synchronize({ project, calculations = {}, pidData = null }) {
    const refrigerant = normalizeRefrigerant(project?.refrigerant);
    const profile = getRefrigerantProfile(refrigerant);
    if (!profile) {
      throw new Error(`No refrigerant profile is registered for ${project?.refrigerant || '(missing refrigerant)'}.`);
    }

    const equipment = [];
    const issues = [];
    for (const [category, records] of selectionCategoryList(calculations)) {
      records.forEach((selection, index) => {
        const catalogueKind = catalogueCategory(category);
        const catalogue = catalogueKind
          ? this.catalogueRepository.resolve(catalogueKind, selection, refrigerant)
          : { status: 'not-applicable', category: null, record: null, sourceRefs: [] };
        const id = safeId(selection.id || selection.tag, `${category}-${index + 1}`);
        const tag = safeId(selection.tag, id);
        const model = catalogue.model || selection.model || selection.type || null;
        const record = {
          id,
          tag,
          category,
          refrigerant,
          profileId: profile.id,
          manufacturer: catalogue.manufacturer || selection.manufacturer || selection.brand || null,
          model,
          catalogueModelId: catalogue.catalogueModelId || null,
          catalogueStatus: catalogue.status,
          catalogueSourceRefs: catalogue.sourceRefs || [],
          operatingPoint: this._operatingPoint(selection),
          quantity: Number(selection.quantity || selection.count || selection.totalUnits || 1),
          render: {
            instanceId: id,
            requestedFamily: selection.bimFamily || null,
            mounting: selection.mounting || null,
            applicationZone: selection.applicationZone || selection.roomName || selection.temperatureLevel || 'machine room'
          }
        };
        equipment.push(record);

        const mismatch = declaredRefrigerantMismatch(catalogue, refrigerant);
        if (mismatch) issues.push(this._issue('error', 'CATALOGUE_REFRIGERANT_MISMATCH', mismatch, { equipmentId: id }));
        if (catalogue.status === 'unmapped' && catalogueKind) {
          issues.push(this._issue('warning', 'CATALOGUE_MODEL_UNMAPPED', `No manufacturer-backed ${category} model is mapped for ${tag}.`, { equipmentId: id, requestedModel: selection.model || null }));
        }
      });
    }

    const piping = this._pipingContract(calculations.piping, refrigerant, profile);
    const bom = this.bomGenerator.generate({ project: { ...project, refrigerant }, calculations, pidData });
    const procurement = this.procurementEngine.evaluate({
      project: { ...project, refrigerant },
      bom,
      equipment,
      requestedTier: project?.procurement?.selectedTier || project?.procurement?.tier || null
    });
    const pid = this._pidContract(pidData, refrigerant, profile, equipment, piping);
    const bim = this._bimContract(refrigerant, profile, equipment, piping, pid);
    this._validateRefrigerantTopology({ refrigerant, profile, equipment, pid, issues });

    const blockingIssueCount = issues.filter(issue => issue.severity === 'error').length;
    return {
      schemaVersion: '1.0.0',
      status: blockingIssueCount ? 'review-required' : 'synchronized',
      generatedAt: new Date().toISOString(),
      refrigerant: {
        id: profile.id,
        family: profile.family,
        safetyClass: profile.safetyClass,
        cycle: profile.cycle,
        topology: profile.topology,
        piping: profile.piping,
        safeguards: profile.safeguards
      },
      equipment,
      piping,
      bom,
      procurement,
      pid,
      bim,
      validation: {
        blockingIssueCount,
        issueCount: issues.length,
        issues,
        traceability: {
          thermodynamicProperties: 'Property provider must attach source identifier and applicability range before calculated thermodynamic results are approved.',
          hydraulicModel: 'Darcy–Weisbach with Colebrook–White is required for explicitly supplied single-phase inputs; no implicit pressure-drop estimate is accepted.',
          procurementPricing: 'Observed public prices and authorised live quotes must retain source URL, observed timestamp, currency and price basis. Freight, duty, taxes and landed cost remain unavailable until supplier-quoted.'
        }
      }
    };
  }

  _operatingPoint(selection) {
    return [
      'evaporatingTemp', 'condensingTemp', 'designLoad', 'capacityPerUnit', 'heatRejection', 'massFlowRate', 'suctionPressure', 'dischargePressure'
    ].reduce((result, key) => {
      if (selection?.[key] !== undefined && selection?.[key] !== null) result[key] = selection[key];
      return result;
    }, {});
  }

  _pipingContract(piping = {}, refrigerant, profile) {
    const lineGroups = ['suction', 'discharge', 'liquid'];
    const lines = [];
    lineGroups.forEach(service => {
      toArray(piping?.[service]).forEach((line, index) => {
        lines.push({
          id: safeId(line.id, `${service}-${index + 1}`),
          service,
          refrigerant,
          dn: line.dn || line.size || null,
          insideDiameterMm: line.actualID || line.insideDiameterMm || null,
          massFlowKgPerS: line.massFlow ?? line.massFlowRate ?? null,
          velocityMPerS: line.velocity ?? null,
          pressureDrop: line.pressureDrop ?? line.pressureDropPa ?? null,
          calculationMethod: line.method || line.model || null,
          jointPolicy: profile.piping.jointType,
          material: profile.piping.material,
          insulation: Boolean(line.insulated),
          sourceEquipmentId: line.sourceEquipmentId || null,
          targetEquipmentId: line.targetEquipmentId || null,
          sourcePortId: line.sourcePortId || null,
          targetPortId: line.targetPortId || null
        });
      });
    });
    return { lines, summary: piping?.summary || {} };
  }

  _pidContract(pidData, refrigerant, profile, equipment, piping) {
    const nodes = toArray(pidData?.equipment || pidData?.nodes);
    const edges = toArray(pidData?.pipes || pidData?.edges);
    const deviceIds = new Set(equipment.map(item => item.id));
    const disconnected = edges.filter(edge => {
      const source = String(edge.source || edge.sourceEquipmentId || '');
      const target = String(edge.target || edge.targetEquipmentId || '');
      return source && target && (!deviceIds.has(source) || !deviceIds.has(target));
    });
    return {
      source: pidData ? 'generated' : 'not-generated',
      refrigerant,
      profileId: profile.id,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      serviceColorAuthority: 'frontend line-service palette; colors must be keyed by service id, not refrigerant name alone',
      flowArrowRequirement: 'all generated P&ID edges require explicit direction metadata',
      disconnectedEdges: disconnected.map(edge => edge.id || null),
      edgeEquipmentConnectivityRequired: true,
      lineRegister: piping.lines
    };
  }

  _bimContract(refrigerant, profile, equipment, piping, pid) {
    return {
      refrigerant,
      profileId: profile.id,
      equipmentInstances: equipment.map(item => ({
        id: item.id,
        tag: item.tag,
        catalogueModelId: item.catalogueModelId,
        catalogueStatus: item.catalogueStatus,
        mounting: item.render.mounting,
        applicationZone: item.render.applicationZone
      })),
      pipeRuns: piping.lines.map(line => ({
        id: line.id,
        service: line.service,
        dn: line.dn,
        sourceEquipmentId: line.sourceEquipmentId,
        targetEquipmentId: line.targetEquipmentId,
        sourcePortId: line.sourcePortId,
        targetPortId: line.targetPortId,
        jointPolicy: line.jointPolicy
      })),
      renderingPolicy: {
        pipeJointType: profile.piping.jointType,
        pipeMaterial: profile.piping.material,
        requirePortTerminations: true,
        requireOrthogonalRouting: true,
        requireLongRadiusElbows: true,
        useRoofMountingForAirCooledCondensers: profile.heatRejection?.type === 'air_cooled_condenser'
      },
      readiness: pid.source === 'generated' && pid.disconnectedEdges.length === 0 ? 'topology-ready' : 'requires-pid-connectivity-review'
    };
  }

  _validateRefrigerantTopology({ refrigerant, profile, equipment, pid, issues }) {
    const categories = new Set(equipment.map(item => item.category));
    const ammonia = refrigerant === 'R717';
    if (!ammonia && categories.has('pump')) {
      issues.push(this._issue('error', 'UNEXPECTED_REFRIGERANT_PUMP', `A refrigerant pump was selected for ${refrigerant}; confirm that the cycle explicitly requires pumped recirculation.`, {}));
    }
    if (!ammonia && profile.piping.jointType === 'welded') {
      issues.push(this._issue('error', 'PROFILE_JOINT_POLICY_MISMATCH', `${refrigerant} profile must not inherit an ammonia welded-pipe default.`, {}));
    }
    if (pid.disconnectedEdges.length) {
      issues.push(this._issue('error', 'PID_EDGE_EQUIPMENT_MISMATCH', 'One or more P&ID edges do not resolve to shared equipment instance identifiers.', { edges: pid.disconnectedEdges }));
    }
  }

  _issue(severity, code, message, context) {
    return { severity, code, message, context };
  }
}

module.exports = FullSystemSynchronizer;
