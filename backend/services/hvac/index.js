// HVAC Calculation Engine - Public API
// Modularized per specification: climate, psychrometrics, envelope, gains, loads, ventilation, ducts, refrigerants, equipment, controls, scenarios, notebook

const climate = require('./modules/climate');
const psychro = require('./modules/psychrometrics');
const envelope = require('./modules/envelope');
const gains = require('./modules/internalGains');
const cooling = require('./modules/coolingLoad');
const heating = require('./modules/heatingLoad');
const ventilation = require('./modules/ventilation');
const ducts = require('./modules/ducts');
const refrigerants = require('./modules/refrigerants');
const equipment = require('./modules/equipment');
const controls = require('./modules/controls');
const scenarios = require('./modules/scenarios');
const notebook = require('./modules/notebook');

module.exports = {
  climate,
  psychro,
  envelope,
  gains,
  cooling,
  heating,
  ventilation,
  ducts,
  refrigerants,
  equipment,
  controls,
  scenarios,
  notebook,
};
