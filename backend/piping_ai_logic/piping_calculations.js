
// C:\Users\Erfan\cool-assist-clean\backend\piping_ai_logic\piping_calculations.js

/**
 * توابع کمکی برای محاسبات اولیه پایپینگ و شبیه‌سازی داده‌ها
 * برگرفته از منطق piping ai
 */

// محاسبه قطر لوله (منطق Placeholder - با فرمول‌های واقعی جایگزین شود)
function calculatePipeDiameter(evaporatorCapacity, refrigerantType, flowRate) {
    console.log(`[Piping Calc] Calculating pipe diameter. Capacity: ${evaporatorCapacity}, Refrigerant: ${refrigerantType}, Flow: ${flowRate}`);
    const baseDiameter = 50; // mm
    const capacityFactor = (evaporatorCapacity || 0) / 50;
    const flowFactor = (flowRate || 0) * 10;
    let calculated = baseDiameter + capacityFactor + flowFactor;

    // اطمینان از معقول بودن قطر (مثلاً بین 10 تا 1000 میلی‌متر)
    calculated = Math.max(10, Math.min(calculated, 1000));
    console.log(`[Piping Calc] Calculated diameter: ${calculated} mm`);
    return calculated;
}

// تعیین جزئیات ولو (منطق Placeholder - با منطق انتخاب ولو واقعی جایگزین شود)
function determineValveDetails(refrigerantType, pipeDiameter, operatingPressure) {
    console.log(`[Piping Calc] Determining valve details. Refrigerant: ${refrigerantType}, Diameter: ${pipeDiameter}, Pressure: ${operatingPressure}`);
    let valveSize = pipeDiameter > 75 ? '3 inch' : '2 inch';
    if ((operatingPressure || 0) > 20) {
        valveSize = pipeDiameter > 75 ? '4 inch' : '3 inch';
    }
    // استفاده از Danfoss به عنوان پیش‌فرض طبق درخواست
    const valveType = `Danfoss Ball Valve - ${(refrigerantType || 'Generic')} compatible`;
    console.log(`[Piping Calc] Determined valve size: ${valveSize}, type: ${valveType}`);
    return { valveSize, valveType };
}

// تعیین قطر محوری (منطق Placeholder - با منطق استاندارد واقعی جایگزین شود)
function determineAxialDiameter(designStandard, componentsString, flowRate) {
    console.log(`[Piping Calc] Determining axial diameter. Standard: ${designStandard}, Components: ${componentsString}, Flow: ${flowRate}`);
    let axialDiameter = (designStandard || '').includes('80') ? 80 : 40; // mm
    if ((componentsString || '').includes('pumps') && (flowRate || 0) > 5) {
        axialDiameter = 80;
    }
    console.log(`[Piping Calc] Determined axial diameter: ${axialDiameter} mm`);
    return axialDiameter;
}

// شبیه‌سازی لیست قطعات موجود (از ابزار getAutoCadComponents در piping ai)
function getSimulatedAutoCadComponents() {
   console.log('[Piping Calc] Getting simulated AutoCAD component list.');
   return [
        'Danfoss Ball Valve (Air Conditioning)', 'Danfoss Ball Valve (Refrigeration)',
        'Danfoss Check Valve (Air Conditioning)', 'Danfoss Check Valve (Refrigeration)',
        'Danfoss Expansion Valve (Air Conditioning)', 'Danfoss Expansion Valve (Refrigeration)',
        'Danfoss Solenoid Valve (Air Conditioning)', 'Danfoss Solenoid Valve (Refrigeration)',
        'Air Conditioning Compressor', 'Refrigeration Compressor', 'Evaporator', 'Condenser',
        'Expansion Tank', 'Safety Valve', 'Steel Pipe', 'Oil Separator', 'Liquid Receiver',
        'Piston Compressor', 'Compressor capacity control with hot gas bypass',
        'Crankcase pressure control', 'Reverse flow control', 'Filter Drier',
        'Pressure Gauge', 'Thermostat', 'Flow Meter',
        'Step Controller EKC331', // Air Cooled
        'Pressure Controller RT', // Evaporative
        'Water Valve', // Water Cooled
        'Motor Valve', // Water Cooled
        'Cooling Tower' // Water Cooled
    ];
}

module.exports = {
    calculatePipeDiameter,
    determineValveDetails,
    determineAxialDiameter,
    getSimulatedAutoCadComponents
};