'use strict';

const procurementRegistry = require('./project_procurement_bom.json');

const TIERS = ['premium', 'standard', 'budget'];
const COUNTRY_CODES = {
  unitedarabemirates: 'AE', uae: 'AE', dubai: 'AE', abuDhabi: 'AE',
  oman: 'OM', muscat: 'OM',
  iran: 'IR', tehran: 'IR', shiraz: 'IR',
  afghanistan: 'AF', kabul: 'AF',
  saudiarabia: 'SA', riyadh: 'SA',
  qatar: 'QA', doha: 'QA',
  turkey: 'TR', istanbul: 'TR'
};

const normalise = value => String(value || '').trim().toLowerCase().replace(/[\s_\-]+/g, '');
const asArray = value => Array.isArray(value) ? value : (value ? [value] : []);
const textContains = (source, needle) => normalise(source).includes(normalise(needle));

class LocationAwareProcurementEngine {
  constructor({ registry = procurementRegistry, now = () => new Date() } = {}) {
    this.registry = registry;
    this.now = now;
  }

  evaluate({ project = {}, bom = {}, equipment = [], requestedTier = null } = {}) {
    const location = this._resolveLocation(project);
    const tier = this._resolveTier(requestedTier || project?.procurement?.selectedTier || project?.procurement?.tier);
    const rows = asArray(bom?.procurementRequest?.rows || bom?.items);
    const selected = rows.map((row, index) => this._evaluateRow({
      row,
      index,
      project,
      location,
      tier,
      equipment
    }));
    return {
      schemaVersion: '1.0.0',
      engine: 'Location-Aware Smart Procurement & Cost Estimator',
      generatedAt: this.now().toISOString(),
      location,
      selectedTier: tier,
      tierDefinitions: this._tierDefinitions(),
      currency: this._currencyContext(location),
      rows: selected,
      equipmentOverrides: selected.map(item => item.graphicalSelection).filter(Boolean),
      financialSummary: this._summary(selected),
      traceability: {
        publicPriceReferencesOnly: true,
        unquotedFreightDutyTax: true,
        sourceRegistryVersion: this.registry.schemaVersion,
        liveRefresh: {
          status: 'connector-or-authorised-provider-required',
          reason: 'The installed engine retains observed public prices with timestamps. Live prices must arrive through project.procurement.liveQuotes or an approved supplier/API connector; arbitrary storefront scraping is intentionally not executed in production.'
        }
      }
    };
  }

  _evaluateRow({ row, index, project, location, tier, equipment }) {
    const category = normalise(row?.category || 'unknown');
    const equipmentId = String(row?.tag || row?.id || `bom-${index + 1}`);
    const offerCandidates = this._offersFor({ row, category, project, location });
    const offersByTier = TIERS.reduce((result, tierKey) => {
      const offer = this._selectBestOffer(offerCandidates.filter(candidate => candidate.tier === tierKey), location);
      result[tierKey] = offer ? this._quoteOffer(offer, location) : this._unavailableTier(tierKey, category, location);
      return result;
    }, {});
    const selectedOffer = offersByTier[tier];
    const baseEquipment = equipment.find(item => String(item?.id || item?.tag || '') === equipmentId) || null;
    const graphicalSelection = this._graphicalSelection({ equipmentId, baseEquipment, selectedOffer, tier });
    return {
      equipmentId,
      tag: row?.tag || null,
      category: row?.category || null,
      description: row?.description || null,
      capacity: row?.operatingPoint?.designLoad ?? row?.operatingPoint?.capacityPerUnit ?? null,
      nominalDiameter: row?.nominalDiameter || null,
      refrigerant: row?.refrigerant || project?.refrigerant || null,
      quantity: Number(row?.quantity || 1),
      locationAvailability: this._brandAvailability(selectedOffer?.brand || row?.manufacturer, location),
      offersByTier,
      selectedTier: tier,
      selectedOffer,
      graphicalSelection
    };
  }

  _offersFor({ row, category, project, location }) {
    const liveQuotes = asArray(project?.procurement?.liveQuotes).map(quote => this._normaliseLiveQuote(quote, location));
    const observed = this.registry.offers.map(offer => ({ ...offer, sourceClass: 'observed-public-price' }));
    const all = [...liveQuotes, ...observed];
    return all.filter(offer => this._isApplicableOffer(offer, row, category, project?.refrigerant));
  }

  _isApplicableOffer(offer, row, category, refrigerant) {
    if (normalise(offer.equipmentCategory) !== category) return false;
    if (refrigerant && Array.isArray(offer.applicableRefrigerants) && !offer.applicableRefrigerants.includes(refrigerant)) return false;
    const modelText = `${row?.model || ''} ${row?.description || ''} ${row?.tag || ''}`;
    const offerText = `${offer.model || ''} ${offer.supplierSku || ''}`;
    if (category === 'valve') return /evra|evrat|solenoid|valve/.test(normalise(modelText)) || /evra|valve/.test(normalise(offerText));
    return textContains(offerText, row?.model) || textContains(row?.description, offer?.model);
  }

  _selectBestOffer(offers, location) {
    if (!offers.length) return null;
    return [...offers].sort((a, b) => {
      const aScore = this._availabilityScore(a, location);
      const bScore = this._availabilityScore(b, location);
      if (aScore !== bScore) return bScore - aScore;
      return Date.parse(b.observedAt || 0) - Date.parse(a.observedAt || 0);
    })[0];
  }

  _availabilityScore(offer, location) {
    const brandAvailability = this._brandAvailability(offer.brand, location);
    const score = { 'official-contact': 4, 'authorised-distributor-claim': 3, 'independent-seller': 2, 'public-price-outside-project-market': 1, 'unverified': 0, 'not-found': 0 };
    return Math.max(score[brandAvailability.status] || 0, score[offer.availability] || 0);
  }

  _quoteOffer(offer, location) {
    const conversion = this._convertPrice(offer.basePrice, location);
    return {
      offerId: offer.offerId || offer.quoteId || null,
      tier: offer.tier,
      brand: offer.brand,
      model: offer.model,
      supplierSku: offer.supplierSku || null,
      capacity: offer.capacity ?? null,
      locationAvailability: this._brandAvailability(offer.brand, location),
      basePrice: offer.basePrice || null,
      convertedPrice: conversion,
      freight: { amount: null, currency: location.currency || null, status: 'supplier-quote-required' },
      duty: { amount: null, currency: location.currency || null, status: 'supplier-quote-required' },
      taxes: { amount: null, currency: location.currency || null, status: 'supplier-quote-required' },
      landedCost: { amount: null, currency: location.currency || null, status: 'not-calculated-without-quoted-logistics-and-tax' },
      supplierSource: offer.supplierSource || offer.sourceUrl || null,
      observedAt: offer.observedAt || null,
      sourceClass: offer.sourceClass || 'observed-public-price',
      requiresQuote: offer.requiresQuote !== false,
      engineeringCompatibility: offer.engineeringCompatibility || 'review-required',
      catalogueModelId: offer.catalogueModelId || null,
      sourceTerms: offer.sourceTerms || null
    };
  }

  _normaliseLiveQuote(quote, location) {
    if (!quote || typeof quote !== 'object') return {};
    const price = quote.basePrice || quote.price;
    if (!price || !Number.isFinite(Number(price.amount)) || !price.currency || !quote.sourceUrl || !quote.observedAt) {
      throw new Error('Each live procurement quote must include numeric basePrice.amount, basePrice.currency, sourceUrl and observedAt.');
    }
    return {
      ...quote,
      offerId: quote.offerId || `live-${normalise(quote.brand)}-${normalise(quote.model)}-${quote.observedAt}`,
      availability: quote.availability || 'unverified',
      sourceClass: 'live-connector-quote',
      engineeringCompatibility: quote.engineeringCompatibility || 'review-required',
      requiresQuote: quote.requiresQuote !== false,
      supplierLocation: quote.supplierLocation || { countryCode: location.countryCode || null, city: null }
    };
  }

  _convertPrice(basePrice, location) {
    if (!basePrice || !basePrice.currency) return { status: 'not-available', reason: 'No base price currency is available.' };
    const currency = basePrice.currency;
    const target = location.currency;
    const hasFixedAmount = basePrice.amount !== null && basePrice.amount !== undefined && Number.isFinite(Number(basePrice.amount));
    const minimum = basePrice.minimum !== null && basePrice.minimum !== undefined && Number.isFinite(Number(basePrice.minimum)) ? Number(basePrice.minimum) : null;
    const maximum = basePrice.maximum !== null && basePrice.maximum !== undefined && Number.isFinite(Number(basePrice.maximum)) ? Number(basePrice.maximum) : null;
    if (!target) return { status: 'not-available', reason: 'Project location does not map to a supported traceable currency source.' };
    const exchange = currency === target
      ? { rate: 1, sourceId: null, sourceUrl: null, sourceType: 'same-currency', observedAt: null, rateDirection: `${target}-per-${currency}`, useScope: 'No conversion required.' }
      : this.registry.exchangeRateSources.find(rate => rate.countryCode === location.countryCode && rate.baseCurrency === currency && Number.isFinite(Number(rate.rate)));
    if (!exchange) return { status: 'not-available', reason: `No traceable ${currency}→${target} reference is registered for this project location.` };
    const rate = Number(exchange.rate);
    const source = exchange.sourceId ? { id: exchange.sourceId, url: exchange.sourceUrl, type: exchange.sourceType, scope: exchange.useScope } : null;
    if (hasFixedAmount) {
      return {
        status: currency === target ? 'same-currency' : 'converted-reference-rate',
        amount: Math.round(Number(basePrice.amount) * rate * 100) / 100,
        currency: target,
        rate,
        rateDirection: exchange.rateDirection,
        observedAt: exchange.observedAt,
        source
      };
    }
    if (minimum !== null || maximum !== null) {
      return {
        status: currency === target ? 'same-currency-range' : 'converted-reference-rate-range',
        minimum: minimum === null ? null : Math.round(minimum * rate * 100) / 100,
        maximum: maximum === null ? null : Math.round(maximum * rate * 100) / 100,
        currency: target,
        rate,
        rateDirection: exchange.rateDirection,
        observedAt: exchange.observedAt,
        source,
        reason: 'The source publishes a price range. The converted range is for reference only and is not a landed-cost estimate.'
      };
    }
    return { status: 'range-or-quote-only', currency: target, minimum: null, maximum: null, reason: 'The source does not contain a numeric price or a convertible range.' };
  }

  _brandAvailability(brand, location) {
    const match = this.registry.sourceRegistry.find(source => normalise(source.brand) === normalise(brand) && source.countryCode === location.countryCode);
    if (match) return { status: match.availability, supplierName: match.supplierName, city: match.city || null, sourceUrl: match.sourceUrl, observedAt: match.observedAt, evidence: match.evidence };
    return { status: 'not-found', supplierName: null, city: null, sourceUrl: null, observedAt: null, evidence: 'No verified local supplier entry is presently registered.' };
  }

  _currencyContext(location) {
    const sources = this.registry.exchangeRateSources
      .filter(source => source.countryCode === location.countryCode)
      .map(source => ({
        sourceId: source.sourceId,
        currency: source.currency,
        baseCurrency: source.baseCurrency,
        rate: source.rate,
        rateDirection: source.rateDirection,
        observedAt: source.observedAt,
        sourceType: source.sourceType,
        sourceUrl: source.sourceUrl,
        useScope: source.useScope
      }));
    return {
      currency: location.currency || null,
      status: location.currency ? (sources.some(source => Number.isFinite(Number(source.rate)) || source.rate === null) ? 'source-registered' : 'source-required') : 'location-required',
      sources
    };
  }

  _resolveLocation(project) {
    const rawCountry = String(project?.location?.country || project?.country || '').trim();
    const rawCity = String(project?.location?.city || project?.city || '').trim();
    const direct = String(project?.location?.countryCode || project?.countryCode || '').toUpperCase();
    const countryCode = /^[A-Z]{2}$/.test(direct) ? direct : (COUNTRY_CODES[normalise(rawCountry)] || COUNTRY_CODES[normalise(rawCity)] || null);
    const currency = ({ AE: 'AED', OM: 'OMR', IR: 'IRR', SA: 'SAR', QA: 'QAR', TR: 'TRY', AF: 'AFN' })[countryCode] || null;
    return { city: rawCity || null, country: rawCountry || null, countryCode, currency, resolutionStatus: countryCode ? 'resolved' : 'requires-country-code-or-supported-city-country' };
  }

  _resolveTier(value) {
    const normalized = normalise(value || 'premium');
    if (['premium', 'tier1', 'tierone', '1'].includes(normalized)) return 'premium';
    if (['standard', 'tier2', 'tiertwo', '2'].includes(normalized)) return 'standard';
    if (['budget', 'tier3', 'tierthree', '3'].includes(normalized)) return 'budget';
    throw new Error(`Unsupported procurement tier: ${value}. Use premium, standard or budget.`);
  }

  _tierDefinitions() {
    return {
      premium: { label: 'Tier 1 / Premium', policy: 'Global-leading brand shortlist; manufacturer-backed model and regional support prioritised.' },
      standard: { label: 'Tier 2 / Standard', policy: 'Recognised alternative shortlist; complete operating-point and approval review remains mandatory.' },
      budget: { label: 'Tier 3 / Budget', policy: 'Lowest observed initial-price shortlist; no automatic interchangeability or BIM-family substitution is permitted.' }
    };
  }

  _unavailableTier(tier, category, location) {
    return {
      offerId: null,
      tier,
      brand: null,
      model: null,
      supplierSku: null,
      capacity: null,
      locationAvailability: { status: 'not-found', evidence: `No traceable ${tier} offer is registered for ${category} in the current registry.` },
      basePrice: null,
      convertedPrice: { status: 'not-available', reason: 'No suitable sourced offer is registered.' },
      freight: { amount: null, currency: location.currency || null, status: 'supplier-quote-required' },
      duty: { amount: null, currency: location.currency || null, status: 'supplier-quote-required' },
      taxes: { amount: null, currency: location.currency || null, status: 'supplier-quote-required' },
      landedCost: { amount: null, currency: location.currency || null, status: 'not-available' },
      supplierSource: null,
      observedAt: null,
      sourceClass: 'not-found',
      requiresQuote: true,
      engineeringCompatibility: 'not-assessed',
      catalogueModelId: null,
      sourceTerms: null
    };
  }

  _graphicalSelection({ equipmentId, baseEquipment, selectedOffer, tier }) {
    if (!baseEquipment) return null;
    const safeCatalogueSwap = selectedOffer?.catalogueModelId && selectedOffer.engineeringCompatibility === 'model-specific';
    return {
      equipmentId,
      selectedTier: tier,
      selectedBrand: selectedOffer?.brand || baseEquipment.manufacturer || null,
      selectedModel: selectedOffer?.model || baseEquipment.model || null,
      selectedCatalogueModelId: safeCatalogueSwap ? selectedOffer.catalogueModelId : baseEquipment.catalogueModelId || null,
      renderUpdateStatus: safeCatalogueSwap ? 'catalogue-model-approved' : 'display-brand-selection-only',
      reason: safeCatalogueSwap ? 'A model-specific catalogue link is registered.' : 'No verified parametric catalogue family is registered for this offer; existing approved BIM/P&ID geometry is preserved while the selected commercial alternative is labelled for engineering review.',
      engineeringCompatibility: selectedOffer?.engineeringCompatibility || 'not-assessed'
    };
  }

  _summary(rows) {
    const selected = rows.map(row => row.selectedOffer);
    const available = selected.filter(offer => offer?.offerId);
    const byCurrency = {};
    available.forEach(offer => {
      const local = offer?.convertedPrice;
      if (local?.status === 'same-currency' || local?.status === 'converted-reference-rate') {
        byCurrency[local.currency] = byCurrency[local.currency] || { currency: local.currency, observedBaseSubtotal: 0, quotedFreightDutyTax: null, landedTotal: null, lineCount: 0 };
        byCurrency[local.currency].observedBaseSubtotal += Number(local.amount || 0);
        byCurrency[local.currency].lineCount += 1;
      }
    });
    Object.values(byCurrency).forEach(total => { total.observedBaseSubtotal = Math.round(total.observedBaseSubtotal * 100) / 100; });
    return {
      lineCount: rows.length,
      selectedOfferCount: available.length,
      totalsByCurrency: Object.values(byCurrency),
      projectLandedCost: null,
      projectLandedCostStatus: 'not-calculated-without-supplier-quoted-freight-duty-tax-and-confirmed-commercial-terms'
    };
  }
}

module.exports = { LocationAwareProcurementEngine, TIERS };
