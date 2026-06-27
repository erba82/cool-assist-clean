// ventilation_calculations.ts
// HVAC Ventilation Calculation Module based on ASHRAE Standard 62.1

// Types and interfaces
export interface VentilationRequirements {
  totalOutdoorAirflow: number;
  zoneRequirements: Array<{
    zoneName: string;
    peopleOutdoorAirflow: number;
    areaOutdoorAirflow: number;
    totalOutdoorAirflow: number;
    airChangesPerHour: number;
  }>;
  systemEffectiveness: number;
  systemOutdoorAirflow: number;
  airChangesPerHour: number;
  iaqAnalysis: {
    co2Concentration: number;
    contaminantLevels: Record<string, number>;
    relativeHumidityRange: {
      min: number;
      max: number;
    };
  };
  energyImpact: {
    annualHeatingLoad: number;
    annualCoolingLoad: number;
  };
  recommendations: string[];
}

// Import building info from cooling load calculations
import { BuildingInfo, CLIMATE_DATA } from './cooling_load_calculations';

// Ventilation rates based on ASHRAE Standard 62.1-2019
const OUTDOOR_AIR_RATES: Record<string, { people: number; area: number }> = {
  // Residential
  'apartment': { people: 0.0025, area: 0.0003 },
  'house': { people: 0.0025, area: 0.0003 },
  'townhouse': { people: 0.0025, area: 0.0003 },
  
  // Commercial
  'office': { people: 0.0025, area: 0.0003 },
  'retail': { people: 0.0038, area: 0.0006 },
  'restaurant': { people: 0.0038, area: 0.0009 },
  
  // Industrial
  'industrial': { people: 0.0025, area: 0.0006 },
  'warehouse': { people: 0.0025, area: 0.0003 },
  'manufacturing': { people: 0.0025, area: 0.0006 }
};

// Default values for building types not explicitly defined
const DEFAULT_OUTDOOR_AIR_RATE = { people: 0.0025, area: 0.0003 };

// Calculate ventilation requirements based on ASHRAE Standard 62.1
export function calculateVentilationRequirements(
  buildingInfo: BuildingInfo,
  occupancyDensity: number
): VentilationRequirements {
  // Get ventilation rates for the building type
  const ventRates = OUTDOOR_AIR_RATES[buildingInfo.buildingType] || DEFAULT_OUTDOOR_AIR_RATE;
  
  // Calculate outdoor airflow rate based on people and area
  const peopleOutdoorAirflow = buildingInfo.occupants * ventRates.people;
  const areaOutdoorAirflow = buildingInfo.totalArea * ventRates.area;
  const totalOutdoorAirflow = peopleOutdoorAirflow + areaOutdoorAirflow;
  
  // Calculate air changes per hour
  const roomHeight = 3; // meters
  const roomVolume = buildingInfo.totalArea * roomHeight;
  const airChangesPerHour = (totalOutdoorAirflow * 3600) / roomVolume;
  
  // Calculate system effectiveness (simplified)
  const systemEffectiveness = 0.8; // Typical value for well-designed systems
  
  // Calculate system outdoor airflow
  const systemOutdoorAirflow = totalOutdoorAirflow / systemEffectiveness;
  
  // Calculate CO2 concentration (simplified)
  const co2Generation = 0.005; // L/s per person
  const co2Concentration = 400 + (co2Generation * 1000 * buildingInfo.occupants) / totalOutdoorAirflow;
  
  // Calculate relative humidity range (simplified)
  const relativeHumidityRange = {
    min: 30,
    max: 60
  };
  
  // Calculate energy impact (simplified)
  const heatingDegreeDays = 2500; // Typical value, would be location-specific
  const coolingDegreeDays = 1500; // Typical value, would be location-specific
  const annualHeatingLoad = systemOutdoorAirflow * 1.2 * 1000 * 24 * heatingDegreeDays * 0.000277; // kWh
  const annualCoolingLoad = systemOutdoorAirflow * 1.2 * 1000 * 24 * coolingDegreeDays * 0.000277 * 0.7; // kWh, reduced by 30% for latent load
  
  // Generate recommendations
  const recommendations = generateRecommendations(buildingInfo, airChangesPerHour, co2Concentration);
  
  return {
    totalOutdoorAirflow,
    zoneRequirements: [
      {
        zoneName: 'Main Zone',
        peopleOutdoorAirflow,
        areaOutdoorAirflow,
        totalOutdoorAirflow,
        airChangesPerHour
      }
    ],
    systemEffectiveness,
    systemOutdoorAirflow,
    airChangesPerHour,
    iaqAnalysis: {
      co2Concentration,
      contaminantLevels: {
        'voc': 500 // Simplified value
      },
      relativeHumidityRange
    },
    energyImpact: {
      annualHeatingLoad,
      annualCoolingLoad
    },
    recommendations
  };
}

// Generate recommendations based on calculation results
function generateRecommendations(
  buildingInfo: BuildingInfo,
  airChangesPerHour: number,
  co2Concentration: number
): string[] {
  const recommendations: string[] = [];
  
  // Check if ventilation rate is sufficient
  if (airChangesPerHour < 0.35) {
    recommendations.push("Increase ventilation rate to meet minimum requirements");
  }
  
  // CO2 concentration recommendations
  if (co2Concentration > 1000) {
    recommendations.push("Implement CO2-based demand-controlled ventilation");
  }
  
  // Energy efficiency recommendations
  if (buildingInfo.totalArea > 500) {
    recommendations.push("Consider energy recovery ventilation to reduce energy consumption");
  }
  
  // IAQ recommendations
  recommendations.push("Use MERV 13 or higher filters to improve indoor air quality");
  
  // Distribution recommendations
  recommendations.push("Ensure proper air distribution to avoid dead zones");
  
  return recommendations;
}

// Main function to calculate ventilation requirements from form data
export function calculateVentilationRequirementsFromFormData(formData: any): VentilationRequirements {
  // Parse form data
  const buildingInfo: BuildingInfo = {
    calculationType: formData.calculationType,
    buildingType: formData.buildingType,
    totalArea: parseFloat(formData.totalArea),
    floors: parseInt(formData.floors || '1'),
    occupants: parseInt(formData.occupants || '4'),
    wallConstructionType: formData.wallConstructionType || 'brick-with-insulation',
    windowType: formData.windowType || 'double-glazed',
    roofType: formData.roofType || 'flat-built-up',
    lightingDensity: parseFloat(formData.lightingDensity || '10'),
    equipmentDensity: parseFloat(formData.equipmentDensity || '15'),
    infiltrationRate: parseFloat(formData.infiltrationRate || '0.5')
  };
  
  // Calculate occupancy density
  const occupancyDensity = buildingInfo.occupants / buildingInfo.totalArea;
  
  // Calculate ventilation requirements
  return calculateVentilationRequirements(buildingInfo, occupancyDensity);
}
