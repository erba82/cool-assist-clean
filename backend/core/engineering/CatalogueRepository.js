'use strict';

const { normalizeRefrigerant } = require('../data/RefrigerantProfiles');

const compressorCatalogue = require('../../../frontend/src/catalogue/catalogueCompressorModels.json');
const condenserCatalogue = require('../../../frontend/src/catalogue/condensers_catalog.json');
const pumpCatalogue = require('../../../frontend/src/catalogue/pumps_catalog.json');
const evaporatorCatalogue = require('../../../frontend/src/catalogue/evaporators_catalog.json');
const valveCatalogue = require('../../../frontend/src/catalogue/valves_catalog.json');

const COLLECTIONS = Object.freeze({
  compressor: compressorCatalogue.models || [],
  condenser: condenserCatalogue.models || [],
  pump: pumpCatalogue.models || [],
  evaporator: evaporatorCatalogue.models || [],
  valve: valveCatalogue.models || valveCatalogue.valves || []
});

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function readModelId(record) {
  return String(record?.id || record?.modelId || record?.catalogueId || record?.model || '');
}

function readModelName(record) {
  return String(record?.model || record?.name || record?.id || '');
}

function declaredRefrigerants(record) {
  const candidates = record?.refrigerants || record?.compatibleRefrigerants || record?.compatibility?.refrigerants || [];
  return Array.isArray(candidates) ? candidates.map(normalizeRefrigerant).filter(Boolean) : [];
}

function sourceReferences(record) {
  const refs = record?.sourceRefs || record?.sources || record?.verification?.sourceRefs || [];
  return Array.isArray(refs) ? refs : [];
}

class CatalogueRepository {
  collections() {
    return COLLECTIONS;
  }

  list(category) {
    const records = COLLECTIONS[category];
    if (!records) {
      throw new Error(`Unknown catalogue category: ${category}`);
    }
    return records.slice();
  }

  find(category, { model, manufacturer, refrigerant } = {}) {
    const records = this.list(category);
    const requestedModel = normalizeText(model);
    const requestedManufacturer = normalizeText(manufacturer);
    const requestedRefrigerant = refrigerant ? normalizeRefrigerant(refrigerant) : null;

    return records.filter(record => {
      const modelId = normalizeText(readModelId(record));
      const modelName = normalizeText(readModelName(record));
      const recordManufacturer = normalizeText(record.manufacturer || record.brand);
      const refrigerants = declaredRefrigerants(record);
      const modelMatches = !requestedModel || modelId === requestedModel || modelName === requestedModel ||
        modelId.includes(requestedModel) || requestedModel.includes(modelId) ||
        modelName.includes(requestedModel) || requestedModel.includes(modelName);
      const manufacturerMatches = !requestedManufacturer || recordManufacturer === requestedManufacturer ||
        recordManufacturer.includes(requestedManufacturer) || requestedManufacturer.includes(recordManufacturer);
      const refrigerantMatches = !requestedRefrigerant || refrigerants.length === 0 || refrigerants.includes(requestedRefrigerant);
      return modelMatches && manufacturerMatches && refrigerantMatches;
    });
  }

  resolve(category, selection, refrigerant) {
    const requestedRefrigerant = normalizeRefrigerant(refrigerant);
    const candidates = this.find(category, {
      model: selection?.catalogueModelId || selection?.model,
      manufacturer: selection?.manufacturer || selection?.brand,
      refrigerant: requestedRefrigerant
    });

    if (!candidates.length) {
      return {
        status: 'unmapped',
        category,
        requested: {
          model: selection?.model || null,
          manufacturer: selection?.manufacturer || selection?.brand || null,
          refrigerant: requestedRefrigerant
        },
        record: null,
        reason: 'No compatible manufacturer-backed catalogue record matches this selection.'
      };
    }

    const exact = candidates.find(record => {
      const recordRefrigerants = declaredRefrigerants(record);
      return recordRefrigerants.includes(requestedRefrigerant);
    }) || candidates[0];

    const refrigerants = declaredRefrigerants(exact);
    const sourceRefs = sourceReferences(exact);
    const compatibilityDeclared = refrigerants.includes(requestedRefrigerant);
    return {
      status: compatibilityDeclared
        ? (sourceRefs.length ? 'verified' : 'catalogued-without-source-reference')
        : 'catalogued-compatibility-review-required',
      category,
      record: exact,
      catalogueModelId: readModelId(exact),
      model: readModelName(exact),
      manufacturer: exact.manufacturer || exact.brand || null,
      declaredRefrigerants: refrigerants,
      compatibleWithSelectedRefrigerant: compatibilityDeclared,
      sourceRefs,
      reason: compatibilityDeclared
        ? null
        : 'The catalogue record has no explicit manufacturer declaration for the selected refrigerant. Keep the semantic equipment class, but require manufacturer compatibility evidence before selection or procurement.'
    };
  }
}

module.exports = {
  CatalogueRepository,
  COLLECTIONS,
  declaredRefrigerants,
  readModelId,
  readModelName,
  sourceReferences
};
