// Notebook assembly according to the prompt structure

function assembleNotebook({ project, inputs, climate, loads, equipment, ventilation, ducts, refrigerants, controls, scenarios }) {
  return {
    cover: {
      projectName: project?.name,
      location: project?.location,
      engineer: 'AI HVAC Designer',
      standards: ['ASHRAE 90.1', 'ASHRAE 62.1', 'EN/ISO local as applicable'],
      date: new Date().toISOString(),
    },
    executiveSummary: {
      coolingCapacity_kW: (loads?.designCooling_W ?? 0) / 1000,
      heatingCapacity_kW: (loads?.designHeating_W ?? 0) / 1000,
      refrigerantRecommendations: refrigerants?.map(r => r.code),
      notes: 'Calculated per provided design prompt with 15% safety margins.',
    },
    inputs,
    climate,
    loadCalculations: loads,
    equipmentSelection: equipment,
    ventilation,
    ducts,
    controls,
    scenarios,
  };
}

module.exports = { assembleNotebook };
