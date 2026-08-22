'use strict';

const { CatalogueRepository } = require('./CatalogueRepository');

function stringOrNull(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function arrayOf(value) {
  return Array.isArray(value) ? value : (value ? [value] : []);
}

function numberOrZero(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function operatingPointOf(selection) {
  const fields = [
    'evaporatingTemp',
    'condensingTemp',
    'thermodynamicCoolingDutyKw',
    'thermodynamicCompressorPowerKw',
    'heatRejection',
    'massFlowRate',
    'suctionPressure',
    'dischargePressure'
  ];
  return fields.reduce((result, field) => {
    if (selection && selection[field] !== undefined && selection[field] !== null) {
      result[field] = selection[field];
    }
    return result;
  }, {});
}

function categoryForSelection(category) {
  const labels = {
    compressor: 'Compressor',
    condenser: 'Condenser',
    evaporator: 'Evaporator / air cooler',
    separator: 'Separator vessel',
    receiver: 'Liquid receiver',
    thermosiphon: 'Thermosiphon vessel',
    pump: 'Refrigerant pump',
    valve: 'Industrial valve',
    pipe: 'Refrigerant pipe'
  };
  return labels[category] || category;
}

function categoryToCatalogue(category) {
  if (category === 'compressor') return 'compressor';
  if (category === 'condenser') return 'condenser';
  if (category === 'evaporator') return 'evaporator';
  if (category === 'pump') return 'pump';
  if (category === 'valve') return 'valve';
  return null;
}

/**
 * Produces procurement rows only.  Price fields remain null until a supplier
 * quotation is attached; no price, lead time, or contingency is estimated.
 */
class BomGenerator {
  constructor({ catalogueRepository = new CatalogueRepository() } = {}) {
    this.catalogueRepository = catalogueRepository;
  }

  generate({ project, calculations = {}, pidData = null }) {
    const refrigerant = project?.refrigerant;
    const selections = this._extractSelections(calculations, pidData);
    const rows = selections.map((selection, index) => this._toRow(selection, index + 1, refrigerant));

    const legacyItems = rows.map(row => ({
      category: row.category,
      tag: row.tag || '—',
      description: row.description,
      quantity: row.quantity,
      unit: row.unit,
      manufacturer: row.manufacturer,
      unitPrice: null,
      totalPrice: null,
      leadTime: null,
      priceStatus: row.procurement.priceStatus
    }));

    const inquiry = {
      documentType: 'price-inquiry',
      templateReference: '99-07-07listofvalvesformachineroom.xlsx / فرم استعلام بها',
      currency: null,
      priceStatus: 'supplier-quotation-required',
      suppliers: [],
      rows: rows.map(row => ({
        row: row.row,
        description: row.description,
        quantity: row.quantity,
        unit: row.unit,
        applicationZone: row.applicationZone,
        supplierQuotes: []
      }))
    };

    return {
      schemaVersion: '1.0.0',
      project: {
        name: project?.name || null,
        refrigerant: refrigerant || null,
        generatedAt: new Date().toISOString()
      },
      procurementRequest: {
        documentType: 'purchase-request',
        templateReference: '99-07-07listofvalvesformachineroom.xlsx / فرم درخواست خرید',
        priceStatus: 'not-priced',
        rows
      },
      priceInquiry: inquiry,
      goodsRequest: {
        documentType: 'goods-request',
        templateReference: '99-07-07listofvalvesformachineroom.xlsx / فرم درخواست کالا',
        rows
      },
      // Legacy report consumers use these fields; null values explicitly prevent synthetic currency totals.
      items: legacyItems,
      currency: null,
      subtotal: null,
      contingency: null,
      contingencyAmount: null,
      total: null,
      totals: {
        lineCount: rows.length,
        requestedQuantity: rows.reduce((sum, row) => sum + (Number.isFinite(Number(row.quantity)) ? Number(row.quantity) : 0), 0),
        pricedLineCount: 0,
        currency: null,
        total: null,
        priceStatus: 'supplier-quotation-required'
      },
      traceability: {
        noEstimatedPricing: true,
        catalogueMappedLineCount: rows.filter(row => row.catalogue.status === 'verified').length,
        catalogueUnmappedLineCount: rows.filter(row => row.catalogue.status === 'unmapped').length,
        sourceTemplate: '99-07-07listofvalvesformachineroom.xlsx'
      }
    };
  }

  _extractSelections(calculations, pidData) {
    const selections = [];
    arrayOf(calculations.compressors).forEach(item => selections.push({ category: 'compressor', item }));
    arrayOf(calculations.condensers).forEach(item => selections.push({ category: 'condenser', item }));
    arrayOf(calculations.evaporators).forEach(item => selections.push({ category: 'evaporator', item }));
    arrayOf(calculations.separators).forEach(item => selections.push({ category: 'separator', item }));
    if (calculations.receiver) selections.push({ category: 'receiver', item: calculations.receiver });
    if (calculations.thermosiphon) selections.push({ category: 'thermosiphon', item: calculations.thermosiphon });
    arrayOf(calculations.pumps).forEach(item => selections.push({ category: 'pump', item }));
    arrayOf(pidData?.valves).forEach(item => selections.push({ category: 'valve', item }));
    arrayOf(calculations.piping?.suction).forEach(item => selections.push({ category: 'pipe', item: { ...item, service: 'suction' } }));
    arrayOf(calculations.piping?.discharge).forEach(item => selections.push({ category: 'pipe', item: { ...item, service: 'discharge' } }));
    arrayOf(calculations.piping?.liquid).forEach(item => selections.push({ category: 'pipe', item: { ...item, service: 'liquid' } }));
    return selections;
  }

  _toRow({ category, item }, row, refrigerant) {
    const catalogueCategory = categoryToCatalogue(category);
    const catalogue = catalogueCategory
      ? this.catalogueRepository.resolve(catalogueCategory, item, refrigerant)
      : { status: 'not-applicable', category: null, record: null, reason: 'No catalogue family is registered for this generated construction item.' };
    const evidenceBackedCandidate = catalogue.status === 'verified' && Boolean(catalogue.manufacturer) && Boolean(catalogue.model);
    const selectionStatus = item.selectionStatus || (evidenceBackedCandidate ? 'verified-candidate' : 'manufacturer-map-required');
    const quantity = selectionStatus === 'verified-selection' && Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0
      ? Number(item.quantity) : null;
    const model = evidenceBackedCandidate ? catalogue.model : null;
    const manufacturer = evidenceBackedCandidate ? catalogue.manufacturer : null;
    const nominalDiameter = stringOrNull(item.dn || item.size || item.nominalDiameter || item.nominalDiameterMm);
    const zone = stringOrNull(item.applicationZone || item.zone || item.roomName || item.temperatureLevel || item.service) || 'machine room';
    const descriptionTokens = [
      categoryForSelection(category),
      evidenceBackedCandidate ? manufacturer : 'manufacturer model/performance map required',
      evidenceBackedCandidate ? model : null,
      nominalDiameter ? `DN / size ${nominalDiameter}` : null
    ].filter(Boolean);

    return {
      row,
      category,
      tag: stringOrNull(item.tag || item.id),
      description: descriptionTokens.join(' — '),
      model,
      manufacturer,
      refrigerant: refrigerant || null,
      quantity,
      unit: category === 'pipe' ? 'm (route length to be confirmed)' : 'EA',
      applicationZone: zone,
      nominalDiameter,
      connectionType: stringOrNull(item.connectionType || item.jointType || item.connection),
      selectionStatus,
      operatingPoint: operatingPointOf(item),
      catalogue: {
        status: catalogue.status,
        category: catalogue.category,
        modelId: catalogue.catalogueModelId || null,
        compatibleWithSelectedRefrigerant: catalogue.compatibleWithSelectedRefrigerant ?? null,
        sourceRefs: catalogue.sourceRefs || [],
        reason: catalogue.reason || null
      },
      procurement: {
        requiredBy: null,
        leadTime: null,
        temporaryReceiptNumber: null,
        unitPrice: null,
        totalPrice: null,
        currency: null,
        priceStatus: 'supplier-quotation-required',
        selectionGate: selectionStatus === 'verified-selection'
          ? 'selection-verified'
          : 'engineering-review-and-manufacturer-map-required'
      }
    };
  }
}

module.exports = BomGenerator;
