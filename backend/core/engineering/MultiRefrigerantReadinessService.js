'use strict';

const { listCapabilities, capabilityFor } = require('./RefrigerantCapabilityService');
const { CatalogueRepository, declaredRefrigerants, readModelId, sourceReferences } = require('./CatalogueRepository');

const CATEGORIES = Object.freeze(['compressor', 'condenser', 'pump', 'evaporator', 'valve']);

function catalogueReadinessFor(refrigerant, repository = new CatalogueRepository()) {
  const categories = {};
  for (const category of CATEGORIES) {
    const explicit = repository.list(category).filter((record) => declaredRefrigerants(record).includes(refrigerant));
    const sourceBacked = explicit.filter((record) => sourceReferences(record).length > 0);
    categories[category] = {
      declaredCompatibleModelCount: explicit.length,
      sourceBackedModelCount: sourceBacked.length,
      status: sourceBacked.length
        ? 'manufacturer-backed-candidates-review-required'
        : explicit.length
          ? 'declared-candidates-source-review-required'
          : 'manufacturer-compatible-catalogue-records-required',
      models: sourceBacked.map((record) => ({
        id: readModelId(record),
        manufacturer: record.manufacturer || record.brand || null,
        sourceRefCount: sourceReferences(record).length
      }))
    };
  }
  return categories;
}

function readinessFor(refrigerant, repository = new CatalogueRepository()) {
  const capability = capabilityFor(refrigerant);
  if (!capability.supported) return capability;
  const categories = catalogueReadinessFor(capability.code, repository);
  const sourceBackedCategories = Object.values(categories).filter((entry) => entry.sourceBackedModelCount > 0).length;
  return {
    ...capability,
    catalogueReadiness: {
      categories,
      sourceBackedCategories,
      policy: 'Only records with explicit refrigerant compatibility and source references are candidate manufacturer-backed selections. Missing records do not authorize cross-refrigerant substitution.'
    },
    endToEndReadiness: {
      semanticCycle: capability.defaultSelectionIntent.template ? 'available-review-required' : 'template-pending',
      propertyCalculation: capability.calculationReadiness.propertyStatus,
      equipment: sourceBackedCategories ? 'partial-catalogue-coverage-review-required' : 'catalogue-evidence-required',
      pid: capability.status,
      bim: 'semantic-to-catalogue-mapping-review-required',
      finalSelection: 'manufacturer-map-and-engineering-review-required'
    }
  };
}

function listReadiness(repository = new CatalogueRepository()) {
  return listCapabilities().map((capability) => readinessFor(capability.code, repository));
}

module.exports = { CATEGORIES, catalogueReadinessFor, readinessFor, listReadiness };
