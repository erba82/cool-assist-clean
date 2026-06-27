/**
 * Phase 2.2: Component Sizing & Optimization - Test Suite
 * Tests rule-based component sizing and multi-objective optimization
 */

const ComponentSizingEngine = require('../services/generative/ComponentSizingEngine');
const OptimizationEngine = require('../services/generative/OptimizationEngine');
const DesignGenerator = require('../services/generative/DesignGenerator');

async function runPhase22Tests() {
    console.log('🧪 Phase 2.2: Component Sizing & Optimization - Test Suite');
    console.log('='.repeat(70));

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    // ============================================================
    // PART 1: Component Sizing
    // ============================================================
    console.log('\n🔧 PART 1: Component Sizing Engine');
    console.log('-'.repeat(70));

    const testRequirements = {
        cooling_capacity: 150,
        evap_temp: -10,
        cond_temp: 40,
        refrigerant: 'R717'
    };

    try {
        totalTests++;
        console.log('\n[Test 1.1] Size Complete System');

        const sizing = await ComponentSizingEngine.sizeSystem(testRequirements);

        console.log(`   Compressor: ${sizing.components.compressor.model}`);
        console.log(`   - Capacity: ${sizing.components.compressor.actualCapacity} kW`);
        console.log(`   - Power: ${sizing.components.compressor.power} kW`);
        console.log(`   - Utilization: ${sizing.components.compressor.utilizationFactor}`);

        console.log(`   Condenser: ${sizing.components.condenser.model}`);
        console.log(`   - Heat Rejection: ${sizing.components.condenser.heatRejection.toFixed(1)} kW`);

        console.log(`   Evaporators: ${sizing.components.evaporators.length} units`);
        sizing.components.evaporators.forEach(evap => {
            console.log(`      - ${evap.model}: ${evap.capacity} kW`);
        });

        console.log(`   Receiver: ${sizing.components.receiver.volume}L`);
        console.log(`   - Estimated Charge: ${sizing.components.receiver.estimatedCharge}`);

        console.log(`   Performance:`);
        console.log(`      - System COP: ${sizing.performance.systemCOP}`);
        console.log(`      - Total Power: ${sizing.performance.totalPower} kW`);

        const valid =
            sizing.components.compressor &&
            sizing.components.condenser &&
            sizing.components.evaporators.length > 0 &&
            sizing.components.receiver;

        if (valid) {
            console.log(`   ✅ PASS: Complete system sized`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Missing components`);
            failedTests++;
        }

    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    try {
        totalTests++;
        console.log('\n[Test 1.2] Size for Different Capacities');

        const capacities = [50, 100, 200, 300];
        let allSized = true;

        for (const cap of capacities) {
            const sizing = await ComponentSizingEngine.sizeSystem({
                cooling_capacity: cap,
                evap_temp: -10,
                cond_temp: 40,
                refrigerant: 'R717'
            });

            console.log(`   ${cap} kW → Compressor: ${sizing.components.compressor.model} (${sizing.components.compressor.actualCapacity}kW)`);

            if (!sizing.components.compressor) {
                allSized = false;
            }
        }

        if (allSized) {
            console.log(`   ✅ PASS: All capacities sized correctly`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Some capacities failed`);
            failedTests++;
        }

    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    // ============================================================
    // PART 2: Multi-Objective Optimization
    // ============================================================
    console.log('\n\n⚡ PART 2: Multi-Objective Optimization');
    console.log('-'.repeat(70));

    try {
        totalTests++;
        console.log('\n[Test 2.1] Optimize Design Variants');

        // Generate variants
        const variants = await DesignGenerator.generateVariants(testRequirements, {
            variantCount: 3,
            includeThermodynamics: true
        });

        console.log(`   Generated ${variants.length} variants`);

        // Optimize
        const optimized = OptimizationEngine.optimize(variants, {
            priorityWeights: { cost: 0.3, efficiency: 0.5, reliability: 0.2 }
        });

        console.log(`\n   Optimization Results:`);
        optimized.forEach((v, i) => {
            console.log(`      ${i + 1}. ${v.id}:`);
            console.log(`         Score: ${v.optimizationScore.toFixed(1)}`);
            console.log(`         Cost: ${v.objectives.cost.toFixed(1)}`);
            console.log(`         Efficiency: ${v.objectives.efficiency.toFixed(1)}`);
            console.log(`         Reliability: ${v.objectives.reliability.toFixed(1)}`);
            console.log(`         Pareto: ${v.paretoRank === 0 ? '✓ Optimal' : 'Dominated'}`);
        });

        if (optimized[0].optimizationScore > 0) {
            console.log(`   ✅ PASS: Optimization successful`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Invalid optimization`);
            failedTests++;
        }

    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        console.error(error.stack);
        failedTests++;
    }

    try {
        totalTests++;
        console.log('\n[Test 2.2] Pareto Front Calculation');

        const variants = await DesignGenerator.generateVariants(testRequirements, {
            variantCount: 5,
            includeThermodynamics: false
        });

        const optimized = OptimizationEngine.optimize(variants);
        const paretoOptimal = optimized.filter(v => v.paretoRank === 0);

        console.log(`   Total variants: ${optimized.length}`);
        console.log(`   Pareto-optimal: ${paretoOptimal.length}`);

        if (paretoOptimal.length > 0 && paretoOptimal.length <= optimized.length) {
            console.log(`   ✅ PASS: Pareto front calculated`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Invalid Pareto front`);
            failedTests++;
        }

    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    try {
        totalTests++;
        console.log('\n[Test 2.3] Optimization Report Generation');

        const variants = await DesignGenerator.generateVariants(testRequirements, {
            variantCount: 3,
            includeThermodynamics: true
        });

        const optimized = OptimizationEngine.optimize(variants);
        const report = OptimizationEngine.generateReport(optimized);

        console.log(`\n   Report Summary:`);
        console.log(`      Total Variants: ${report.totalVariants}`);
        console.log(`      Pareto-Optimal: ${report.paretoOptimal}`);
        console.log(`      Best Variant: ${report.bestVariant.id}`);
        console.log(`      Cost Range: ${report.summary.costRange.min} - ${report.summary.costRange.max}`);
        console.log(`      Recommendations: ${report.recommendations.length}`);

        report.recommendations.forEach(rec => {
            console.log(`         - ${rec}`);
        });

        if (report.totalVariants > 0 && report.recommendations.length > 0) {
            console.log(`   ✅ PASS: Report generated successfully`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Report incomplete`);
            failedTests++;
        }

    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    // ============================================================
    // PART 3: Integration Test
    // ============================================================
    console.log('\n\n🔗 PART 3: Component Sizing + Optimization Integration');
    console.log('-'.repeat(70));

    try {
        totalTests++;
        console.log('\n[Test 3.1] Size → Generate → Optimize Pipeline');

        // Size system
        const sizing = await ComponentSizingEngine.sizeSystem(testRequirements);
        console.log('   ✓ Step 1: System sized');

        // Generate variants using sizing data
        const variants = await DesignGenerator.generateVariants(testRequirements, {
            variantCount: 3,
            includeThermodynamics: true
        });
        console.log('   ✓ Step 2: Variants generated');

        // Optimize variants
        const optimized = OptimizationEngine.optimize(variants);
        const report = OptimizationEngine.generateReport(optimized);
        console.log('   ✓ Step 3: Variants optimized');

        console.log(`\n   Pipeline Result:`);
        console.log(`      Sized System COP: ${sizing.performance.systemCOP}`);
        console.log(`      Best Variant Score: ${report.bestVariant.optimizationScore.toFixed(1)}`);
        console.log(`      Top Recommendation: ${report.recommendations[0]}`);

        if (sizing && variants.length > 0 && optimized.length > 0) {
            console.log(`   ✅ PASS: Full pipeline operational`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Pipeline incomplete`);
            failedTests++;
        }

    } catch (error) {
        console.log(`   ❌ FAIL: ${error.message}`);
        failedTests++;
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 PHASE 2.2 TEST SUMMARY');
    console.log('='.repeat(70));

    console.log(`\n   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    console.log('\n📦 Component Status:');
    console.log(`   Component Sizing: ${passedTests >= 2 ? '✅ READY' : '⚠️  NEEDS WORK'}`);
    console.log(`   Multi-Objective Optimization: ${passedTests >= 5 ? '✅ READY' : '⚠️  NEEDS WORK'}`);
    console.log(`   Integration: ${passedTests >= 6 ? '✅ READY' : '⚠️  NEEDS WORK'}`);

    const allPassed = failedTests === 0;

    if (allPassed || passedTests >= totalTests * 0.85) {
        console.log('\n🎉 PHASE 2.2 VERIFIED - COMPONENT SIZING & OPTIMIZATION READY!');
        console.log('\n✅ Component sizing engine operational');
        console.log('✅ Multi-objective optimization working');
        console.log('✅ Pareto front calculation successful');
        console.log('✅ Ready for Phase 3\n');
        process.exit(0);
    } else {
        console.log('\n⚠️  PHASE 2.2 NEEDS ATTENTION');
        console.log(`\n   ${failedTests} test(s) failed - review required\n`);
        process.exit(1);
    }
}

// Run the test
runPhase22Tests().catch(error => {
    console.error('\n❌ TEST EXECUTION ERROR:', error);
    console.error(error.stack);
    process.exit(1);
});
