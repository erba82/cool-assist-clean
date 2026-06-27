/**
 * Test enhanced CoolProp wrapper
 */

const CoolPropWrapper = require('../services/physics/CoolPropWrapper');

async function testEnhancedWrapper() {
    console.log('🧪 Testing Enhanced CoolProp Wrapper\n');
    console.log('='.repeat(60));

    // Test 1: Service availability
    console.log('\n📡 Test 1: Service Availability Check');
    const isAvailable = await CoolPropWrapper.isServiceAvailable();
    console.log(`   Service Available: ${isAvailable ? '✅ YES' : '❌ NO'}`);

    // Test 2: Ammonia Cycle (uses wrapper convenience method)
    console.log('\n🔄 Test 2: Ammonia Cycle Calculation');
    try {
        const cycle = await CoolPropWrapper.calculateAmmoniaCycle(
            -10,  // Evap temp °C
            40,   // Cond temp °C  
            5,    // Superheat K
            3     // Subcool K
        );

        console.log(`   ✅ COP: ${cycle.performance.COP.toFixed(2)}`);
        console.log(`   ✅ Pressure Ratio: ${cycle.performance.pressure_ratio.toFixed(2)}`);
        console.log(`   ✅ Cooling Capacity: ${(cycle.performance.cooling_capacity_per_kg / 1000).toFixed(2)} kJ/kg`);
    } catch (error) {
        console.log(`   ❌ ${error.message}`);
    }

    // Test 3: Properties with retry (valid request)
    console.log('\n🌡️  Test 3: Property Calculation (with retry)');
    try {
        const props = await CoolPropWrapper.calculateProperties(
            'R717',
            'PT',
            500000,   // 5 bar
            273.15,   // 0°C
            ['H', 'S', 'D']
        );

        console.log(`   ✅ Enthalpy: ${(props.H / 1000).toFixed(2)} kJ/kg`);
        console.log(`   ✅ Entropy: ${props.S.toFixed(2)} J/kg/K`);
        console.log(`   ✅ Density: ${props.D.toFixed(2)} kg/m³`);

        if (props._fallback) {
            console.log(`   ⚠️  Using fallback: ${props._note}`);
        }
    } catch (error) {
        console.log(`   ❌ ${error.message}`);
    }

    // Test 4: VLE calculation
    console.log('\n💧 Test 4: VLE Calculation');
    try {
        const vle = await CoolPropWrapper.calculateVLE('R717', 273.15);
        console.log(`   ✅ Saturation Pressure: ${(vle.saturation_pressure / 1000).toFixed(2)} kPa`);
        console.log(`   ✅ Latent Heat: ${(vle.latent_heat / 1000).toFixed(2)} kJ/kg`);
    } catch (error) {
        console.log(`   ❌ ${error.message}`);
    }

    // Test 5: Psychrometric
    console.log('\n🌫️  Test 5: Psychrometric Calculation');
    try {
        const psych = await CoolPropWrapper.calculatePsychrometric(25, 101325, 'RH', 50);
        console.log(`   ✅ Wet Bulb: ${psych.wet_bulb_temp.toFixed(2)} °C`);
        console.log(`   ✅ Dew Point: ${psych.dew_point_temp.toFixed(2)} °C`);
        console.log(`   ✅ Humidity Ratio: ${psych.humidity_ratio.toFixed(4)} kg/kg`);
    } catch (error) {
        console.log(`   ❌ ${error.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Enhanced Wrapper Test Complete\n');
}

testEnhancedWrapper().catch(console.error);
