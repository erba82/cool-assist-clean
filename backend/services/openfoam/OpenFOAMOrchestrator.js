/**
 * OpenFOAM Orchestrator - Main Integration Layer
 * Unified interface for OpenFOAM simulations (WSL2 or Docker)
 */

const WSL2Runner = require('./WSL2Runner');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class OpenFOAMOrchestrator {
    constructor() {
        this.wsl2Runner = new WSL2Runner();
        this.dockerUrl = 'http://localhost:5004';
        this.mode = null; // 'wsl2', 'docker', or null
    }

    /**
     * Initialize and detect available mode
     */
    async initialize() {
        console.log('[OpenFOAM] Checking available modes...');

        // Check WSL2 first (preferred)
        const wsl2Status = await this.wsl2Runner.getStatus();

        if (wsl2Status.ready) {
            this.mode = 'wsl2';
            console.log('[OpenFOAM] ✅ Using WSL2 mode');
            return { mode: 'wsl2', available: true };
        }

        // Check Docker
        try {
            const response = await axios.get(`${this.dockerUrl}/health`, { timeout: 2000 });
            if (response.data.status === 'healthy') {
                this.mode = 'docker';
                console.log('[OpenFOAM] ✅ Using Docker mode');
                return { mode: 'docker', available: true };
            }
        } catch (error) {
            // Docker not available
        }

        console.log('[OpenFOAM] ⚠️  No OpenFOAM backend available');
        this.mode = null;
        return { mode: null, available: false };
    }

    /**
     * Generate OpenFOAM case from P&ID design
     */
    async generateCase(pidData, options = {}) {
        console.log('[OpenFOAM] Generating case from P&ID...');

        const caseName = options.caseName || `case_${Date.now()}`;
        const solver = options.solver || 'buoyantSimpleFoam';

        // Extract geometry and parameters
        const geometry = this.extractGeometry(pidData);
        const thermalLoads = this.calculateThermalLoads(pidData);
        const boundaryConditions = this.generateBoundaryConditions(pidData);

        // Create case structure
        const caseConfig = {
            caseName,
            solver,
            geometry,
            thermalLoads,
            boundaryConditions,
            mesh: {
                type: 'blockMesh', // or 'snappyHexMesh'
                cellSize: options.meshSize || 0.1
            }
        };

        console.log(`[OpenFOAM] Case: ${caseName}`);
        console.log(`[OpenFOAM] Solver: ${solver}`);
        console.log(`[OpenFOAM] Thermal loads: ${thermalLoads.total} kW`);

        return caseConfig;
    }

    /**
     * Run complete CFD simulation
     */
    async runSimulation(pidData, options = {}) {
        if (!this.mode) {
            await this.initialize();
        }

        if (!this.mode) {
            return {
                success: false,
                error: 'No OpenFOAM backend available',
                simulated: false
            };
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔬 Starting OpenFOAM Simulation (${this.mode.toUpperCase()})`);
        console.log('='.repeat(60));

        try {
            // Step 1: Generate case
            const caseConfig = await this.generateCase(pidData, options);

            // Step 2: Create case directory and files
            await this.createCaseFiles(caseConfig);

            // Step 3: Run mesh
            const meshResult = await this.runMesh(caseConfig.caseName);

            if (!meshResult.success) {
                throw new Error(`Mesh generation failed: ${meshResult.error}`);
            }

            // Step 4: Run solver
            const solveResult = await this.runSolver(
                caseConfig.caseName,
                caseConfig.solver
            );

            if (!solveResult.success) {
                throw new Error(`Solver failed: ${solveResult.error}`);
            }

            // Step 5: Extract results
            const results = await this.extractResults(caseConfig.caseName);

            console.log('='.repeat(60));
            console.log('✅ Simulation Complete!');
            console.log('='.repeat(60));

            return {
                success: true,
                simulated: true,
                mode: this.mode,
                caseName: caseConfig.caseName,
                mesh: {
                    cells: meshResult.cells
                },
                solver: {
                    converged: solveResult.converged,
                    iterations: solveResult.iterations
                },
                results: {
                    temperature: results.temperature,
                    hotSpots: this.detectHotSpots(results.temperature),
                    vtkPath: results.vtkPath
                }
            };

        } catch (error) {
            console.error(`[OpenFOAM] ❌ Simulation failed: ${error.message}`);

            return {
                success: false,
                simulated: false,
                error: error.message
            };
        }
    }

    /**
     * Create OpenFOAM case files
     */
    async createCaseFiles(caseConfig) {
        console.log(`[OpenFOAM] Creating case files for ${caseConfig.caseName}...`);

        if (this.mode === 'wsl2') {
            // Create in WSL2
            await this.wsl2Runner.createCaseDir(caseConfig.caseName);
            await this.wsl2Runner.runCommand(`cp -r /opt/openfoam10/tutorials/basic/buoyantSimpleFoam/hotRoom ${this.wsl2Runner.casesDir}/${caseConfig.caseName}`, { timeout: 30000 });

            // TODO: Modify case files with caseConfig parameters

        } else if (this.mode === 'docker') {
            // Create via Docker API
            await axios.post(`${this.dockerUrl}/case/create`, {
                case_name: caseConfig.caseName,
                template: 'buoyantSimpleFoam'
            });
        }

        console.log(`[OpenFOAM] ✅ Case files created`);
    }

    /**
     * Run meshing
     */
    async runMesh(caseName) {
        console.log(`[OpenFOAM] Running mesh generation...`);

        if (this.mode === 'wsl2') {
            return await this.wsl2Runner.runBlockMesh(caseName);
        } else if (this.mode === 'docker') {
            const response = await axios.post(`${this.dockerUrl}/mesh/blockmesh`, {
                case_name: caseName
            });
            return response.data;
        }
    }

    /**
     * Run solver
     */
    async runSolver(caseName, solver) {
        console.log(`[OpenFOAM] Running solver: ${solver}...`);

        if (this.mode === 'wsl2') {
            return await this.wsl2Runner.runSolver(caseName, solver);
        } else if (this.mode === 'docker') {
            const response = await axios.post(`${this.dockerUrl}/solve`, {
                case_name: caseName,
                solver: solver
            });
            return response.data;
        }
    }

    /**
     * Extract simulation results
     */
    async extractResults(caseName) {
        console.log(`[OpenFOAM] Extracting results...`);

        let tempStats, vtkPath;

        if (this.mode === 'wsl2') {
            const stats = await this.wsl2Runner.extractFieldStats(caseName, 'T');
            const vtk = await this.wsl2Runner.exportVTK(caseName);

            tempStats = stats.stats || {};
            vtkPath = vtk.windowsPath || null;

        } else if (this.mode === 'docker') {
            const response = await axios.post(`${this.dockerUrl}/results/extract`, {
                case_name: caseName
            });

            tempStats = response.data.temperature || {};
            vtkPath = response.data.vtk?.path || null;
        }

        return {
            temperature: tempStats,
            vtkPath
        };
    }

    // Helper methods

    extractGeometry(pidData) {
        // Extract bounding box from components
        const components = [
            ...(pidData.components.compressors || []),
            ...(pidData.components.evaporators || []),
            ...(pidData.components.condensers || [])
        ];

        // Calculate domain size
        // For now, use defaults - can be enhanced based on equipment size
        return {
            width: 5.0,  // meters
            height: 3.0,
            depth: 2.0
        };
    }

    calculateThermalLoads(pidData) {
        let totalLoad = 0;

        // Evaporator cooling load
        const evaporators = pidData.components.evaporators || [];
        evaporators.forEach(evap => {
            totalLoad += evap.capacity || 0;
        });

        // Compressor heat rejection
        const compressors = pidData.components.compressors || [];
        compressors.forEach(comp => {
            totalLoad += (comp.power || 0) * 0.2; // Approximate heat rejection
        });

        return {
            total: totalLoad,
            evaporators: evaporators.reduce((sum, e) => sum + (e.capacity || 0), 0),
            compressors: compressors.reduce((sum, c) => sum + (c.power || 0), 0)
        };
    }

    generateBoundaryConditions(pidData) {
        // Generate boundary conditions based on design
        const evapTemp = pidData.requirements?.evap_temp || -10;
        const condTemp = pidData.requirements?.cond_temp || 40;

        return {
            inlet: {
                T: 273 + evapTemp,  // Convert to Kelvin
                U: [0.1, 0, 0]      // m/s
            },
            outlet: {
                p: 101325           // Pa
            },
            walls: {
                T: 273 + condTemp
            }
        };
    }

    detectHotSpots(tempStats) {
        if (!tempStats.max || !tempStats.min) return [];

        const threshold = tempStats.min + 0.8 * (tempStats.max - tempStats.min);

        return [{
            temperature: tempStats.max,
            location: 'Maximum temperature point',
            severity: tempStats.max > 353 ? 'high' : 'normal' // 80°C threshold
        }];
    }

    /**
     * Get status
     */
    async getStatus() {
        const status = {
            initialized: this.mode !== null,
            mode: this.mode,
            available: false
        };

        if (this.mode === 'wsl2') {
            const wslStatus = await this.wsl2Runner.getStatus();
            status.available = wslStatus.ready;
            status.details = wslStatus;
        } else if (this.mode === 'docker') {
            try {
                const response = await axios.get(`${this.dockerUrl}/health`, { timeout: 2000 });
                status.available = response.data.status === 'healthy';
                status.details = response.data;
            } catch {
                status.available = false;
            }
        }

        return status;
    }
}

module.exports = new OpenFOAMOrchestrator();
