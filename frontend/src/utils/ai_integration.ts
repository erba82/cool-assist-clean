// ai_integration.ts
// AI Integration Module for HVAC Load Calculator

// Types and interfaces
export interface AIAssistanceRequest {
  userInput: Record<string, any>;
  calculationType: 'cooling' | 'heating' | 'ventilation' | 'all';
  buildingLocation: string;
  buildingType: string;
  previousCalculations?: {
    cooling?: any;
    heating?: any;
    ventilation?: any;
  };
  userPreferences: {
    energyEfficiency: 'low' | 'medium' | 'high';
    budget: 'low' | 'medium' | 'high';
    comfort: 'low' | 'medium' | 'high';
    sustainability: 'low' | 'medium' | 'high';
  };
}

export interface AIAssistanceResponse {
  enhancedInput: Record<string, any>;
  missingFields: string[];
  suggestedValues: Record<string, any>;
  intelligentDefaults: Record<string, any>;
  enhancedRecommendations: string[];
  explanations: Record<string, string>;
  optimizationSuggestions: string[];
}

// Import types from other calculation modules
import { BuildingInfo, CLIMATE_DATA, CoolingLoadResult } from './cooling_load_calculations';
import { HeatingLoadResult } from './heating_load_calculations';
import { VentilationRequirements } from './ventilation_calculations';

// Default values based on building types
const BUILDING_TYPE_DEFAULTS: Record<string, Record<string, any>> = {
  'apartment': {
    occupantDensity: 0.04, // persons per m²
    lightingDensity: 10, // W/m²
    equipmentDensity: 15, // W/m²
    infiltrationRate: 0.5, // ACH
    wallConstructionType: 'brick-with-insulation',
    windowType: 'double-glazed',
    roofType: 'flat-built-up'
  },
  'house': {
    occupantDensity: 0.03, // persons per m²
    lightingDensity: 8, // W/m²
    equipmentDensity: 12, // W/m²
    infiltrationRate: 0.6, // ACH
    wallConstructionType: 'wood-frame-with-insulation',
    windowType: 'double-glazed',
    roofType: 'flat-built-up'
  },
  'office': {
    occupantDensity: 0.1, // persons per m²
    lightingDensity: 12, // W/m²
    equipmentDensity: 20, // W/m²
    infiltrationRate: 0.3, // ACH
    wallConstructionType: 'concrete-with-insulation',
    windowType: 'double-glazed-low-e',
    roofType: 'flat-built-up'
  },
  'retail': {
    occupantDensity: 0.15, // persons per m²
    lightingDensity: 18, // W/m²
    equipmentDensity: 15, // W/m²
    infiltrationRate: 0.4, // ACH
    wallConstructionType: 'metal-panel-with-insulation',
    windowType: 'double-glazed-low-e',
    roofType: 'flat-built-up'
  },
  'restaurant': {
    occupantDensity: 0.7, // persons per m²
    lightingDensity: 15, // W/m²
    equipmentDensity: 40, // W/m²
    infiltrationRate: 0.5, // ACH
    wallConstructionType: 'brick-with-insulation',
    windowType: 'double-glazed',
    roofType: 'flat-built-up'
  }
};

// Default values for any building type
const DEFAULT_BUILDING_VALUES = {
  occupantDensity: 0.05, // persons per m²
  lightingDensity: 10, // W/m²
  equipmentDensity: 15, // W/m²
  infiltrationRate: 0.5, // ACH
  wallConstructionType: 'brick-with-insulation',
  windowType: 'double-glazed',
  roofType: 'flat-built-up'
};

// Climate-specific recommendations
const CLIMATE_RECOMMENDATIONS: Record<string, string[]> = {
  'hot-dry': [
    'Consider high-efficiency cooling systems with economizers',
    'Implement external shading devices to reduce solar heat gain',
    'Use light-colored roof and wall finishes to reflect solar radiation',
    'Consider evaporative cooling strategies where appropriate'
  ],
  'hot-humid': [
    'Prioritize dehumidification capabilities in cooling systems',
    'Implement vapor barriers to control moisture migration',
    'Consider energy recovery ventilation to reduce latent cooling loads',
    'Use materials resistant to mold and mildew growth'
  ],
  'temperate': [
    'Implement mixed-mode ventilation strategies',
    'Consider heat pumps for efficient heating and cooling',
    'Design for natural ventilation during shoulder seasons',
    'Optimize thermal mass to moderate temperature swings'
  ],
  'cold': [
    'Prioritize high-performance building envelope with enhanced insulation',
    'Consider heat recovery ventilation to reduce heating loads',
    'Implement condensation control strategies',
    'Design for passive solar heating where possible'
  ]
};

// Determine climate type based on location
function determineClimateType(location: string): string {
  const climateData = CLIMATE_DATA[location];
  
  if (!climateData) return 'temperate';
  
  if (climateData.summerDesignTemp > 35) {
    return climateData.summerDesignWetBulb > 25 ? 'hot-humid' : 'hot-dry';
  } else if (climateData.winterDesignTemp < -5) {
    return 'cold';
  } else {
    return 'temperate';
  }
}

// Main function to provide AI assistance
export function provideAIAssistance(request: AIAssistanceRequest): AIAssistanceResponse {
  const { userInput, calculationType, buildingLocation, buildingType, previousCalculations, userPreferences } = request;
  
  // Initialize response
  const response: AIAssistanceResponse = {
    enhancedInput: { ...userInput },
    missingFields: [],
    suggestedValues: {},
    intelligentDefaults: {},
    enhancedRecommendations: [],
    explanations: {},
    optimizationSuggestions: []
  };
  
  // Check for missing required fields
  if (!userInput.totalArea || parseFloat(userInput.totalArea) <= 0) {
    response.missingFields.push('totalArea');
    
    // Suggest default area based on building type
    let suggestedArea = 100; // Default
    if (buildingType === 'house') suggestedArea = 150;
    if (buildingType === 'apartment') suggestedArea = 80;
    if (buildingType === 'office') suggestedArea = 500;
    if (buildingType === 'retail') suggestedArea = 300;
    
    response.suggestedValues.totalArea = suggestedArea;
  }
  
  if (!userInput.occupants || parseInt(userInput.occupants) <= 0) {
    response.missingFields.push('occupants');
    
    // Calculate suggested occupants based on building type and area
    const area = parseFloat(userInput.totalArea) || 100;
    const defaults = BUILDING_TYPE_DEFAULTS[buildingType] || DEFAULT_BUILDING_VALUES;
    const suggestedOccupants = Math.ceil(area * defaults.occupantDensity);
    
    response.suggestedValues.occupants = suggestedOccupants;
  }
  
  // Provide intelligent defaults based on building type
  const defaults = BUILDING_TYPE_DEFAULTS[buildingType] || DEFAULT_BUILDING_VALUES;
  
  if (!userInput.lightingDensity) {
    response.intelligentDefaults.lightingDensity = defaults.lightingDensity;
    response.enhancedInput.lightingDensity = defaults.lightingDensity.toString();
  }
  
  if (!userInput.equipmentDensity) {
    response.intelligentDefaults.equipmentDensity = defaults.equipmentDensity;
    response.enhancedInput.equipmentDensity = defaults.equipmentDensity.toString();
  }
  
  if (!userInput.infiltrationRate) {
    response.intelligentDefaults.infiltrationRate = defaults.infiltrationRate;
    response.enhancedInput.infiltrationRate = defaults.infiltrationRate.toString();
  }
  
  if (!userInput.wallConstructionType) {
    response.intelligentDefaults.wallConstructionType = defaults.wallConstructionType;
    response.enhancedInput.wallConstructionType = defaults.wallConstructionType;
  }
  
  if (!userInput.windowType) {
    response.intelligentDefaults.windowType = defaults.windowType;
    response.enhancedInput.windowType = defaults.windowType;
  }
  
  if (!userInput.roofType) {
    response.intelligentDefaults.roofType = defaults.roofType;
    response.enhancedInput.roofType = defaults.roofType;
  }
  
  // Generate climate-specific recommendations
  const climateType = determineClimateType(buildingLocation);
  const climateRecommendations = CLIMATE_RECOMMENDATIONS[climateType] || [];
  
  // Generate enhanced recommendations based on user preferences
  const enhancedRecommendations: string[] = [];
  
  // Add climate-specific recommendations
  enhancedRecommendations.push(...climateRecommendations);
  
  // Add energy efficiency recommendations based on user preference
  if (userPreferences.energyEfficiency === 'high') {
    enhancedRecommendations.push('Implement high-efficiency HVAC equipment with variable speed drives');
    enhancedRecommendations.push('Consider advanced building automation systems for optimal control');
    enhancedRecommendations.push('Implement comprehensive commissioning and monitoring');
  } else if (userPreferences.energyEfficiency === 'medium') {
    enhancedRecommendations.push('Use energy-efficient HVAC equipment with good SEER/EER ratings');
    enhancedRecommendations.push('Implement basic building controls with programmable thermostats');
  }
  
  // Add comfort recommendations based on user preference
  if (userPreferences.comfort === 'high') {
    enhancedRecommendations.push('Implement zoning to provide personalized comfort control');
    enhancedRecommendations.push('Consider radiant heating/cooling for improved thermal comfort');
    enhancedRecommendations.push('Use displacement ventilation for better air quality and thermal comfort');
  }
  
  // Add sustainability recommendations based on user preference
  if (userPreferences.sustainability === 'high') {
    enhancedRecommendations.push('Consider renewable energy sources to power HVAC systems');
    enhancedRecommendations.push('Implement rainwater harvesting for cooling tower makeup water');
    enhancedRecommendations.push('Use environmentally friendly refrigerants with low global warming potential');
  }
  
  // Add budget-conscious recommendations based on user preference
  if (userPreferences.budget === 'low') {
    enhancedRecommendations.push('Focus on low-cost energy efficiency measures with quick payback');
    enhancedRecommendations.push('Consider phased implementation of HVAC improvements');
    enhancedRecommendations.push('Prioritize proper maintenance to extend equipment life and maintain efficiency');
  }
  
  // Remove duplicates and limit to 8 recommendations
  response.enhancedRecommendations = Array.from(new Set(enhancedRecommendations)).slice(0, 8);
  
  // Generate optimization suggestions based on previous calculations
  if (previousCalculations) {
    const optimizationSuggestions: string[] = [];
    
    if (previousCalculations.cooling) {
      const coolingResult = previousCalculations.cooling as CoolingLoadResult;
      
      // Check sensible heat ratio
      const sensibleHeatRatio = coolingResult.totalSensible / coolingResult.total;
      if (sensibleHeatRatio < 0.7) {
        optimizationSuggestions.push('Focus on dehumidification strategies to handle the high latent load');
      }
      
      // Check window solar load
      const windowSolarPercentage = coolingResult.breakdown.windows.solar / coolingResult.total * 100;
      if (windowSolarPercentage > 20) {
        optimizationSuggestions.push('Focus on solar control strategies and reducing internal heat gains');
      }
    }
    
    if (previousCalculations.heating) {
      const heatingResult = previousCalculations.heating as HeatingLoadResult;
      
      // Check envelope losses
      const envelopeLossPercentage = (heatingResult.breakdown.walls + heatingResult.breakdown.windows + heatingResult.breakdown.roof) / heatingResult.total * 100;
      if (envelopeLossPercentage > 70) {
        optimizationSuggestions.push('Implement envelope improvements first, then upgrade mechanical systems');
      }
    }
    
    // Add general optimization suggestions
    optimizationSuggestions.push('Consider high-performance HVAC systems such as VRF or ground-source heat pumps');
    optimizationSuggestions.push('Implement demand-controlled ventilation based on CO2 sensors');
    
    response.optimizationSuggestions = optimizationSuggestions;
  }
  
  // Generate explanations for key concepts
  response.explanations = {
    'sensibleHeatRatio': 'The ratio of sensible cooling load to total cooling load. A lower ratio indicates a higher dehumidification requirement.',
    'infiltration': 'Unintentional air leakage into a building through cracks, gaps, and openings in the building envelope.',
    'ventilation': 'The intentional introduction of outdoor air into a building to maintain indoor air quality.',
    'U-value': 'The rate of heat transfer through a building element (wall, window, roof) per unit area per degree of temperature difference.',
    'SHGC': 'Solar Heat Gain Coefficient - the fraction of incident solar radiation that enters through a window as heat.'
  };
  
  return response;
}

// Generate natural language explanation of calculation results
export function generateNaturalLanguageExplanation(
  coolingResult: CoolingLoadResult | null,
  heatingResult: HeatingLoadResult | null,
  ventilationResult: VentilationRequirements | null
): string {
  if (!coolingResult || !heatingResult || !ventilationResult) return '';
  
  return `
## Cooling Load Analysis

Your building requires ${(coolingResult.total / 1000).toFixed(2)} kW (${(coolingResult.total * 3.412 / 1000).toFixed(2)} MBH) of cooling capacity to maintain comfortable conditions during peak summer conditions. This includes ${(coolingResult.totalSensible / 1000).toFixed(2)} kW of sensible cooling (temperature reduction) and ${(coolingResult.totalLatent / 1000).toFixed(2)} kW of latent cooling (dehumidification).

The cooling load is distributed across several components:

- **External Heat Gains**: ${((coolingResult.breakdown.walls + coolingResult.breakdown.windows.conduction + coolingResult.breakdown.windows.solar + coolingResult.breakdown.roof) / coolingResult.total * 100).toFixed(1)}% of the total load comes from heat entering through the building envelope, with solar gain through windows being ${(coolingResult.breakdown.windows.solar / coolingResult.total * 100).toFixed(1)}% of the total.
- **Internal Heat Gains**: ${((coolingResult.breakdown.occupants.sensible + coolingResult.breakdown.occupants.latent + coolingResult.breakdown.lighting + coolingResult.breakdown.equipment.sensible + coolingResult.breakdown.equipment.latent) / coolingResult.total * 100).toFixed(1)}% of the total load is generated within the building from occupants, lighting, and equipment.
- **Ventilation and Infiltration**: ${((coolingResult.breakdown.infiltration.sensible + coolingResult.breakdown.infiltration.latent + coolingResult.breakdown.ventilation.sensible + coolingResult.breakdown.ventilation.latent) / coolingResult.total * 100).toFixed(1)}% of the total load is due to outdoor air entering the building.

The peak cooling load occurs at hour ${coolingResult.peakHour} when the outdoor temperature is ${coolingResult.psychrometrics.outdoorTemp.toFixed(1)}°C.

## Heating Load Analysis

Your building requires ${(heatingResult.total / 1000).toFixed(2)} kW (${(heatingResult.total * 3.412 / 1000).toFixed(2)} MBH) of heating capacity to maintain comfortable conditions during peak winter conditions. This calculation is based on an outdoor design temperature of ${heatingResult.designTemperature.outdoor.toFixed(1)}°C and an indoor temperature of ${heatingResult.designTemperature.indoor.toFixed(1)}°C.

The heating load is distributed across several components:

- **Envelope Heat Loss**: ${((heatingResult.breakdown.walls + heatingResult.breakdown.windows + heatingResult.breakdown.roof + heatingResult.breakdown.floor) / heatingResult.total * 100).toFixed(1)}% of the total load is due to heat escaping through the building envelope, with windows accounting for ${(heatingResult.breakdown.windows / heatingResult.total * 100).toFixed(1)}% of the total.
- **Air Exchange**: ${((heatingResult.breakdown.infiltration + heatingResult.breakdown.ventilation) / heatingResult.total * 100).toFixed(1)}% of the total load is due to infiltration and ventilation requirements.

The heating system should be designed to deliver air at ${heatingResult.systemSizing.supplyAirTemp.toFixed(1)}°C with an airflow rate of ${(heatingResult.systemSizing.airflow * 2118.88).toFixed(0)} CFM to meet the peak heating demand.

## Ventilation Analysis

Based on ASHRAE Standard 62.1, your building requires ${(ventilationResult.totalOutdoorAirflow * 2118.88).toFixed(0)} CFM (${(ventilationResult.totalOutdoorAirflow).toFixed(4)} m³/s) of outdoor air ventilation. This provides ${ventilationResult.airChangesPerHour.toFixed(2)} air changes per hour, which is ${ventilationResult.airChangesPerHour >= 0.35 ? 'sufficient' : 'below the recommended minimum of 0.35'} for good indoor air quality.

With this ventilation rate, the estimated CO2 concentration will be ${ventilationResult.iaqAnalysis.co2Concentration.toFixed(0)} ppm, which is ${ventilationResult.iaqAnalysis.co2Concentration <= 1000 ? 'within acceptable limits' : 'above the recommended limit of 1000 ppm'}. The relative humidity is expected to range from ${ventilationResult.iaqAnalysis.relativeHumidityRange.min.toFixed(0)}% to ${ventilationResult.iaqAnalysis.relativeHumidityRange.max.toFixed(0)}%.

The energy impact of ventilation is estimated at ${ventilationResult.energyImpact.annualHeatingLoad.toFixed(0)} kWh for heating and ${ventilationResult.energyImpact.annualCoolingLoad.toFixed(0)} kWh for cooling annually. ${ventilationResult.energyImpact.annualHeatingLoad + ventilationResult.energyImpact.annualCoolingLoad > 10000 ? 'Energy recovery ventilation is strongly recommended to reduce this impact.' : 'Consider energy recovery ventilation to further reduce energy consumption.'}

## System Recommendations

Your building has relatively balanced heating and cooling loads. Consider systems that efficiently provide both heating and cooling, such as heat pumps or variable refrigerant flow (VRF) systems.

For cooling, a ${(coolingResult.total / 3500).toFixed(1)} ton (${(coolingResult.total / 1000).toFixed(2)} kW) system is recommended. ${coolingResult.total / 3500 < 5 ? 'Split systems or packaged units would be appropriate for this cooling capacity.' : coolingResult.total / 3500 < 20 ? 'Packaged rooftop units or VRF systems would be appropriate for this cooling capacity.' : 'A chilled water system would be most appropriate for this cooling capacity.'}

For heating, a ${(heatingResult.total / 1000).toFixed(2)} kW (${(heatingResult.total * 3.412 / 1000).toFixed(0)} MBH) system is recommended. ${heatingResult.total * 3.412 < 100000 ? 'Furnaces, heat pumps, or small boilers would be appropriate for this heating capacity.' : heatingResult.total * 3.412 < 400000 ? 'Boilers or large furnaces would be appropriate for this heating capacity.' : 'A central boiler system would be most appropriate for this heating capacity.'}

## Conclusion

These calculations provide a solid foundation for selecting and sizing HVAC equipment for your building. The results are based on industry-standard methods from ASHRAE and account for your specific building characteristics and local climate conditions. For final equipment selection, consult with a qualified HVAC professional who can consider additional factors such as equipment availability, installation constraints, and budget considerations.
  `;
}

// Generate input form fields based on building type
export function generateInputFormFields(buildingType: string): Record<string, any> {
  const defaults = BUILDING_TYPE_DEFAULTS[buildingType] || DEFAULT_BUILDING_VALUES;
  
  // Basic fields for all building types
  const fields = {
    totalArea: {
      label: 'Total Area (m²)',
      type: 'number',
      required: true
    },
    floors: {
      label: 'Number of Floors',
      type: 'number',
      required: false
    },
    occupants: {
      label: 'Number of Occupants',
      type: 'number',
      required: true,
      hint: `Typical occupancy for ${buildingType}: ${defaults.occupantDensity} persons/m²`
    }
  };
  
  // Add building-specific fields
  if (buildingType === 'apartment' || buildingType === 'house') {
    Object.assign(fields, {
      bedrooms: {
        label: 'Number of Bedrooms',
        type: 'number',
        required: false
      },
      bathrooms: {
        label: 'Number of Bathrooms',
        type: 'number',
        required: false
      }
    });
  }
  
  if (buildingType === 'office' || buildingType === 'retail') {
    Object.assign(fields, {
      operatingHours: {
        label: 'Operating Hours per Day',
        type: 'number',
        required: false,
        defaultValue: 10
      },
      serverRoom: {
        label: 'Server Room Area (m²)',
        type: 'number',
        required: false
      }
    });
  }
  
  if (buildingType === 'restaurant') {
    Object.assign(fields, {
      kitchenArea: {
        label: 'Kitchen Area (m²)',
        type: 'number',
        required: false
      },
      seatingCapacity: {
        label: 'Seating Capacity',
        type: 'number',
        required: false
      }
    });
  }
  
  return fields;
}
