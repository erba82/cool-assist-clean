// heating_load_calculations.ts
// HVAC Heating Load Calculation Module based on ASHRAE procedures

// Types and interfaces
export interface HeatingLoadResult {
  total: number;
  breakdown: {
    walls: number;
    windows: number;
    roof: number;
    floor: number;
    infiltration: number;
    ventilation: number;
  };
  designTemperature: {
    outdoor: number;
    indoor: number;
  };
  systemSizing: {
    heatOutput: number;
    airflow: number;
    supplyAirTemp: number;
  };
  recommendations: string[];
}

// Import climate data from cooling load calculations
import { CLIMATE_DATA, BuildingInfo } from './cooling_load_calculations';

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

const ROOF_U_VALUES: Record<string, number> = {
  'flat-built-up': 0.3,
  'metal-with-insulation': 0.35,
  'concrete-with-insulation': 0.4,
  'green-roof': 0.25
};

const FLOOR_U_VALUES: Record<string, number> = {
  'slab-on-grade': 0.3,
  'suspended-with-insulation': 0.25,
  'basement': 0.35
};

// Calculate heating load using ASHRAE procedures
export function calculateHeatingLoad(
  buildingInfo: BuildingInfo,
  climateData: any,
  indoorTemp: number,
  includePickupLoad: boolean,
  setbackTemp?: number
): HeatingLoadResult {
  // Calculate wall area (simplified)
  const wallHeight = 3; // meters
  const buildingPerimeter = Math.sqrt(buildingInfo.totalArea) * 4;
  const wallArea = buildingPerimeter * wallHeight * buildingInfo.floors;
  
  // Window area (assumed as 30% of wall area)
  const windowArea = wallArea * 0.3;
  const netWallArea = wallArea - windowArea;
  
  // Roof area
  const roofArea = buildingInfo.totalArea;
  
  // Floor area
  const floorArea = buildingInfo.totalArea;
  
  // Temperature difference
  const tempDiff = indoorTemp - climateData.winterDesignTemp;
  
  // Calculate conduction heat losses
  const wallHeatLoss = netWallArea * WALL_U_VALUES[buildingInfo.wallConstructionType] * tempDiff;
  const windowHeatLoss = windowArea * WINDOW_U_VALUES[buildingInfo.windowType] * tempDiff;
  const roofHeatLoss = roofArea * ROOF_U_VALUES[buildingInfo.roofType] * tempDiff;
  const floorHeatLoss = floorArea * FLOOR_U_VALUES['slab-on-grade'] * tempDiff * 0.5; // Reduced by 50% for ground contact
  
  // Calculate infiltration heat loss
  const roomVolume = buildingInfo.totalArea * wallHeight;
  const infiltrationAirflow = roomVolume * buildingInfo.infiltrationRate / 3600; // m³/s
  const airDensity = 1.2; // kg/m³
  const specificHeat = 1000; // J/kg·K
  const infiltrationHeatLoss = infiltrationAirflow * airDensity * specificHeat * tempDiff;
  
  // Ventilation heat loss (simplified)
  const ventilationAirflow = buildingInfo.totalArea * 0.0003; // m³/s (based on typical ventilation rates)
  const ventilationHeatLoss = ventilationAirflow * airDensity * specificHeat * tempDiff;
  
  // Calculate total heat loss
  let totalHeatLoss = wallHeatLoss + windowHeatLoss + roofHeatLoss + floorHeatLoss + 
                     infiltrationHeatLoss + ventilationHeatLoss;
  
  // Add pickup load if required
  if (includePickupLoad && setbackTemp) {
    const pickupTempDiff = indoorTemp - setbackTemp;
    const buildingMass = buildingInfo.totalArea * 250; // kg/m² (typical value)
    const specificHeatBuilding = 1000; // J/kg·K
    const pickupTime = 1 * 3600; // 1 hour in seconds
    
    const pickupLoad = buildingMass * specificHeatBuilding * pickupTempDiff / pickupTime;
    totalHeatLoss += pickupLoad;
  }
  
  // Add safety factor (10%)
  totalHeatLoss *= 1.1;
  
  // Calculate supply air flow rate and temperature
  const supplyAirTemp = 40; // °C
  const airflow = totalHeatLoss / (airDensity * specificHeat * (supplyAirTemp - indoorTemp));
  
  // Generate recommendations based on the calculation results
  const recommendations = generateRecommendations(buildingInfo, totalHeatLoss);
  
  return {
    total: totalHeatLoss,
    breakdown: {
      walls: wallHeatLoss,
      windows: windowHeatLoss,
      roof: roofHeatLoss,
      floor: floorHeatLoss,
      infiltration: infiltrationHeatLoss,
      ventilation: ventilationHeatLoss
    },
    designTemperature: {
      outdoor: climateData.winterDesignTemp,
      indoor: indoorTemp
    },
    systemSizing: {
      heatOutput: totalHeatLoss * 1.2, // Add 20% safety factor for system sizing
      airflow: airflow,
      supplyAirTemp: supplyAirTemp
    },
    recommendations
  };
}

// Generate recommendations based on calculation results
function generateRecommendations(buildingInfo: BuildingInfo, totalLoad: number): string[] {
  const recommendations: string[] = [];
  
  // System sizing recommendation
  const btuPerHour = totalLoad * 3.412; // Convert W to BTU/hr
  recommendations.push(`Consider a ${Math.round(btuPerHour / 1000)} MBH (${(totalLoad / 1000).toFixed(1)} kW) furnace for heating`);
  
  // Envelope recommendations
  if (buildingInfo.windowType === 'single-glazed' || buildingInfo.windowType === 'double-glazed') {
    recommendations.push("Improve wall insulation to reduce heat loss");
  }
  
  // Control recommendations
  recommendations.push("Install programmable thermostats with night setback");
  
  // Energy efficiency recommendations
  if (buildingInfo.totalArea > 300) {
    recommendations.push("Consider heat recovery ventilation to reduce energy consumption");
  }
  
  return recommendations;
}

// Main function to calculate heating load from form data
export function calculateHeatingLoadFromFormData(formData: any): HeatingLoadResult {
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
  const indoorTemp = parseFloat(formData.indoorTempHeating || '21');
  const includePickupLoad = formData.includePickupLoad === 'true' || formData.includePickupLoad === true;
  const setbackTemp = parseFloat(formData.setbackTemp || '15');
  
  // Calculate heating load
  return calculateHeatingLoad(buildingInfo, climateData, indoorTemp, includePickupLoad, setbackTemp);
}
