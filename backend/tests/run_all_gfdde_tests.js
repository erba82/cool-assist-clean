// backend/tests/run_all_gfdde_tests.js
/**
 * Master Test Runner for GFDDE
 * Executes integration tests for all 5 phases
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
    'gfdde_phase1_test.js',
    'gfdde_phase2_test.js',
    'gfdde_phase3_test.js',
    'gfdde_phase4_test.js',
    'gfdde_phase5_test.js'
];

async function runTest(testFile) {
    return new Promise((resolve, reject) => {
        console.log(`\n🚀 Running ${testFile}...`);
        console.log('----------------------------------------');

        const testProcess = spawn('node', [path.join(__dirname, testFile)], {
            stdio: 'inherit',
            cwd: __dirname
        });

        testProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`\n✅ ${testFile} PASSED`);
                resolve(true);
            } else {
                console.error(`\n❌ ${testFile} FAILED (Exit code: ${code})`);
                resolve(false);
            }
        });

        testProcess.on('error', (err) => {
            console.error(`\n❌ Error starting ${testFile}:`, err);
            resolve(false);
        });
    });
}

async function runAll() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║      GFDDE FULL SYSTEM VERIFICATION        ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log(`Time: ${new Date().toISOString()}`);

    const results = [];

    for (const test of tests) {
        const passed = await runTest(test);
        results.push({ test, passed });
    }

    console.log('\n\n╔════════════════════════════════════════════╗');
    console.log('║           FINAL TEST REPORT                ║');
    console.log('╚════════════════════════════════════════════╝');

    let allPassed = true;
    results.forEach(r => {
        const status = r.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${r.test.padEnd(25)} : ${status}`);
        if (!r.passed) allPassed = false;
    });

    console.log('----------------------------------------');
    if (allPassed) {
        console.log('🎉 SYSTEM STATUS: OPERATIONAL (100% PASS)');
        process.exit(0);
    } else {
        console.log('⚠️  SYSTEM STATUS: ISSUES DETECTED');
        process.exit(1);
    }
}

runAll();
