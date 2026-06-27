// Scenario comparison utilities

function compareOptions(options) {
  // options: [{name, cap_kW, cop, energy_kWh_cooling, energy_kWh_heating, cost}] => compute annual cost
  return options.map(o => ({
    ...o,
    annualCost: (o.energy_kWh_cooling + o.energy_kWh_heating) * (o.energyCost_EUR_kWh ?? 0.12),
  })).sort((a, b) => a.annualCost - b.annualCost);
}

module.exports = { compareOptions };
