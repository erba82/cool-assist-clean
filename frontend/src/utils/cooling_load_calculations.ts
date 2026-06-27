// cooling_load_calculations.ts
// HVAC Cooling Load Calculation Module based on ASHRAE Heat Balance Method

// Types and interfaces
export interface BuildingInfo {
  calculationType: string;
  buildingType: string;
  totalArea: number;
  floors: number;
  occupants: number;
  wallConstructionType: string;
  windowType: string;
  roofType: string;
  lightingDensity: number;
  equipmentDensity: number;
  infiltrationRate: number;
}

export interface ClimateData {
  location: string;
  latitude: number;
  longitude: number;
  elevation: number;
  summerDesignTemp: number;
  summerDesignWetBulb: number;
  summerDailyRange: number;
  winterDesignTemp: number;
  clearSkyRadiation: number;
  atmosphericClearness: number;
}

export interface CoolingLoadResult {
  totalSensible: number;
  totalLatent: number;
  total: number;
  breakdown: {
    walls: number;
    windows: {
      conduction: number;
      solar: number;
    };
    roof: number;
    occupants: {
      sensible: number;
      latent: number;
    };
    lighting: number;
    equipment: {
      sensible: number;
      latent: number;
    };
    infiltration: {
      sensible: number;
      latent: number;
    };
    ventilation: {
      sensible: number;
      latent: number;
    };
  };
  peakHour: number;
  psychrometrics: {
    outdoorTemp: number;
    outdoorHumidity: number;
    indoorTemp: number;
    indoorHumidity: number;
    supplyAirTemp: number;
    supplyAirFlow: number;
  };
  recommendations: string[];
}

// Climate data for different locations
export const CLIMATE_DATA: Record<string, ClimateData> = {
  'tehran': {
    location: 'Tehran, Iran',
    latitude: 35.7,
    longitude: 51.4,
    elevation: 1191,
    summerDesignTemp: 36.5,
    summerDesignWetBulb: 21.2,
    summerDailyRange: 14.2,
    winterDesignTemp: -3.5,
    clearSkyRadiation: 1000,
    atmosphericClearness: 0.85,
  },
  'dubai': {
    location: 'Dubai, UAE',
    latitude: 25.3,
    longitude: 55.3,
    elevation: 5,
    summerDesignTemp: 43.3,
    summerDesignWetBulb: 29.4,
    summerDailyRange: 11.7,
    winterDesignTemp: 12.6,
    clearSkyRadiation: 1050,
    atmosphericClearness: 0.9,
  },
  'new-york': {
    location: 'New York, USA',
    latitude: 40.7,
    longitude: -74.0,
    elevation: 10,
    summerDesignTemp: 31.7,
    summerDesignWetBulb: 23.9,
    summerDailyRange: 8.3,
    winterDesignTemp: -8.3,
    clearSkyRadiation: 950,
    atmosphericClearness: 0.8,
  },
  'london': {
    location: 'London, UK',
    latitude: 51.5,
    longitude: -0.1,
    elevation: 25,
    summerDesignTemp: 28.2,
    summerDesignWetBulb: 20.1,
    summerDailyRange: 10.5,
    winterDesignTemp: -3.9,
    clearSkyRadiation: 850,
    atmosphericClearness: 0.7,
  },
  'tokyo': {
    location: 'Tokyo, Japan',
    latitude: 35.7,
    longitude: 139.8,
    elevation: 40,
    summerDesignTemp: 33.1,
    summerDesignWetBulb: 27.0,
    summerDailyRange: 8.0,
    winterDesignTemp: 0.1,
    clearSkyRadiation: 900,
    atmosphericClearness: 0.75,
  }
};

// U-values for different construction types (W/m²·K)
const WALL_U_VALUES: Record<string, number> = {
  'brick-with-insulation': 0.35,
  'concrete-with-insulation': 0.4,
  'metal-panel-with-insulation': 0.3,
  'wood-frame-with-insulation': 0.25,
  'curtain-wall': 0.6
};

const WINDOW_U_VALUES: Record<string, number> = {
  'single-glazed': 5.8,
  'double-glazed': 2.8,
  'double-glazed-low-e': 1.8,
  'triple-glazed': 1.4,
  'triple-glazed-low-e': 0.8
};

const WINDOW_SHGC: Record<string, number> = {
  'single-glazed': 0.86,
  'double-glazed': 0.76,
  'double-glazed-low-e': 0.4,
  'triple-glazed': 0.68,
  'triple-glazed-low-e': 0.33
};

const ROOF_U_VALUES: Record<string, number> = {
  'flat-built-up': 0.3,
  'metal-with-insulation': 0.35,
  'concrete-with-insulation': 0.4,
  'green-roof': 0.25
};

// Occupant heat gain values (W/person)
const OCCUPANT_SENSIBLE_HEAT = 70;
const OCCUPANT_LATENT_HEAT = 45;

// Calculate cooling load using ASHRAE Heat Balance Method
export function calculateCoolingLoad(
  buildingInfo: BuildingInfo,
  climateData: ClimateData,
  indoorTemp: number,
  indoorHumidity: number
): CoolingLoadResult {
  // Calculate wall area (simplified)
  const wallHeight = 3; // meters
  const buildingPerimeter = Math.sqrt(buildingInfo.totalArea) * 4;
  const wallArea = buildingPerimeter * wallHeight * buildingInfo.floors;
  
  // Window area (assumed as 30% of wall area)
  const windowArea = wallArea * 0.3;
  const netWallArea = wallArea - windowArea;
  
  // Roof area
  const roofArea = buildingInfo.totalArea;
  
  // Temperature difference
  const tempDiff = climateData.summerDesignTemp - indoorTemp;
  
  // Calculate conduction heat gains
  const wallHeatGain = netWallArea * WALL_U_VALUES[buildingInfo.wallConstructionType] * tempDiff;
  const windowConductionHeatGain = windowArea * WINDOW_U_VALUES[buildingInfo.windowType] * tempDiff;
  
  // Calculate solar heat gain through windows
  const solarHeatGain = windowArea * WINDOW_SHGC[buildingInfo.windowType] * climateData.clearSkyRadiation * climateData.atmosphericClearness;
  
  // Calculate roof heat gain
  const roofHeatGain = roofArea * ROOF_U_VALUES[buildingInfo.roofType] * tempDiff;
  
  // Calculate internal heat gains
  const occupantSensibleHeatGain = buildingInfo.occupants * OCCUPANT_SENSIBLE_HEAT;
  const occupantLatentHeatGain = buildingInfo.occupants * OCCUPANT_LATENT_HEAT;
  
  const lightingHeatGain = buildingInfo.totalArea * buildingInfo.lightingDensity;
  
  const equipmentSensibleHeatGain = buildingInfo.totalArea * buildingInfo.equipmentDensity * 0.9;
  const equipmentLatentHeatGain = buildingInfo.totalArea * buildingInfo.equipmentDensity * 0.1;
  
  // Calculate infiltration heat gain
  const roomVolume = buildingInfo.totalArea * wallHeight;
  const infiltrationAirflow = roomVolume * buildingInfo.infiltrationRate / 3600; // m³/s
  const airDensity = 1.2; // kg/m³
  const specificHeat = 1000; // J/kg·K
  const infiltrationSensibleHeatGain = infiltrationAirflow * airDensity * specificHeat * tempDiff;
  
  // Latent heat calculation for infiltration
  const outdoorHumidityRatio = calculateHumidityRatio(climateData.summerDesignTemp, climateData.summerDesignWetBulb);
  const indoorHumidityRatio = calculateHumidityRatio(indoorTemp, calculateWetBulbTemp(indoorTemp, indoorHumidity));
  const latentHeatOfVaporization = 2450000; // J/kg
  const infiltrationLatentHeatGain = infiltrationAirflow * airDensity * latentHeatOfVaporization * (outdoorHumidityRatio - indoorHumidityRatio);
  
  // Ventilation heat gain (simplified)
  const ventilationAirflow = buildingInfo.totalArea * 0.0003; // m³/s (based on typical ventilation rates)
  const ventilationSensibleHeatGain = ventilationAirflow * airDensity * specificHeat * tempDiff;
  const ventilationLatentHeatGain = ventilationAirflow * airDensity * latentHeatOfVaporization * (outdoorHumidityRatio - indoorHumidityRatio);
  
  // Calculate total sensible and latent heat gains
  const totalSensible = wallHeatGain + windowConductionHeatGain + solarHeatGain + roofHeatGain + 
                        occupantSensibleHeatGain + lightingHeatGain + equipmentSensibleHeatGain + 
                        infiltrationSensibleHeatGain + ventilationSensibleHeatGain;
  
  const totalLatent = occupantLatentHeatGain + equipmentLatentHeatGain + 
                      infiltrationLatentHeatGain + ventilationLatentHeatGain;
  
  const total = totalSensible + totalLatent;
  
  // Calculate supply air flow rate
  const supplyAirTemp = 13; // °C
  const supplyAirFlow = totalSensible / (airDensity * specificHeat * (indoorTemp - supplyAirTemp));
  
  // Generate recommendations based on the calculation results
  const recommendations = generateRecommendations(buildingInfo, total, totalSensible / total);
  
  return {
    totalSensible,
    totalLatent,
    total,
    breakdown: {
      walls: wallHeatGain,
      windows: {
        conduction: windowConductionHeatGain,
        solar: solarHeatGain
      },
      roof: roofHeatGain,
      occupants: {
        sensible: occupantSensibleHeatGain,
        latent: occupantLatentHeatGain
      },
      lighting: lightingHeatGain,
      equipment: {
        sensible: equipmentSensibleHeatGain,
        latent: equipmentLatentHeatGain
      },
      infiltration: {
        sensible: infiltrationSensibleHeatGain,
        latent: infiltrationLatentHeatGain
      },
      ventilation: {
        sensible: ventilationSensibleHeatGain,
        latent: ventilationLatentHeatGain
      }
    },
    peakHour: 15, // Assumed peak hour
    psychrometrics: {
      outdoorTemp: climateData.summerDesignTemp,
      outdoorHumidity: calculateRelativeHumidity(climateData.summerDesignTemp, climateData.summerDesignWetBulb),
      indoorTemp,
      indoorHumidity,
      supplyAirTemp,
      supplyAirFlow
    },
    recommendations
  };
}

// Helper function to calculate humidity ratio from temperature and wet-bulb temperature
function calculateHumidityRatio(dryBulbTemp: number, wetBulbTemp: number): number {
  // Simplified calculation
  const saturationPressureAtWetBulb = calculateSaturationPressure(wetBulbTemp);
  const saturationPressureAtDryBulb = calculateSaturationPressure(dryBulbTemp);
  
  const psychrometricConstant = 0.000662; // kPa/°C
  const humidityRatioAtWetBulb = 0.622 * saturationPressureAtWetBulb / (101.325 - saturationPressureAtWetBulb);
  
  return humidityRatioAtWetBulb - psychrometricConstant * (dryBulbTemp - wetBulbTemp);
}

// Helper function to calculate saturation pressure
function calculateSaturationPressure(temperature: number): number {
  // Simplified calculation based on ASHRAE
  const T = temperature + 273.15; // Convert to Kelvin
  return Math.exp(23.196 - 3816.44 / (T - 46.13)) / 1000; // kPa
}

// Helper function to calculate wet-bulb temperature from relative humidity
function calculateWetBulbTemp(dryBulbTemp: number, relativeHumidity: number): number {
  // Simplified calculation
  const saturationPressure = calculateSaturationPressure(dryBulbTemp);
  const vaporPressure = saturationPressure * relativeHumidity / 100;
  
  // Iterative calculation would be more accurate, but this is a simplified approximation
  return dryBulbTemp - (dryBulbTemp - 15) * (1 - relativeHumidity / 100);
}

// Helper function to calculate relative humidity from dry-bulb and wet-bulb temperatures
function calculateRelativeHumidity(dryBulbTemp: number, wetBulbTemp: number): number {
  const saturationPressureAtDryBulb = calculateSaturationPressure(dryBulbTemp);
  const humidityRatio = calculateHumidityRatio(dryBulbTemp, wetBulbTemp);
  
  const vaporPressure = humidityRatio * 101.325 / (0.622 + humidityRatio);
  return (vaporPressure / saturationPressureAtDryBulb) * 100;
}

// Generate recommendations based on calculation results
function generateRecommendations(buildingInfo: BuildingInfo, totalLoad: number, sensibleHeatRatio: number): string[] {
  const recommendations: string[] = [];
  
  // System sizing recommendation
  const tonnage = totalLoad / 3500; // Convert W to tons
  recommendations.push(`Install a ${tonnage.toFixed(1)} ton air conditioner for optimal cooling`);
  
  // System type recommendation based on building type and size
  if (buildingInfo.totalArea > 500) {
    recommendations.push("Consider a VRF system for better zoning and efficiency");
  } else {
    recommendations.push("A split system would be suitable for this building size");
  }
  
  // Envelope recommendations
  if (buildingInfo.windowType === 'single-glazed' || buildingInfo.windowType === 'double-glazed') {
    recommendations.push("Improve window insulation to reduce thermal loss");
  }
  
  // Control recommendations
  recommendations.push("Install programmable thermostats for better energy efficiency");
  
  // Additional recommendations based on sensible heat ratio
  if (sensibleHeatRatio < 0.7) {
    recommendations.push("Consider a dehumidification system to handle the high latent load");
  }
  
  return recommendations;
}

// Main function to calculate cooling load from form data
export function calculateCoolingLoadFromFormData(formData: any): CoolingLoadResult {
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
  
  // Get climate data
  const climateData = CLIMATE_DATA[formData.location] || CLIMATE_DATA['tehran'];
  
  // Get indoor conditions
  const indoorTemp = parseFloat(formData.indoorTempCooling || '24');
  const indoorHumidity = parseFloat(formData.indoorHumidityCooling || '50');
  
  // Calculate cooling load
  return calculateCoolingLoad(buildingInfo, climateData, indoorTemp, indoorHumidity);
}
