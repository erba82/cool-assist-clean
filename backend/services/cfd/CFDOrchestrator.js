/**
 * CFD Orchestrator
 * Node.js integration layer for CFD simulations
 */

const axios = require('axios');

class CFDOrchestrator {
    constructor() {
        this.cfdServiceUrl = process.env.CFD_SERVICE_URL || 'http://127.0.0.1:5003';
        this.serviceAvailable = false;
        this.checkService();
    }

    /**
     * Check if CFD service is available
     */
    async checkService() {
        try {
            const response = await axios.get(`${this.cfdServiceUrl}/health`, { timeout: 2000 });
            this.serviceAvailable = response.data.status === 'healthy';
            if (this.serviceAvailable) {
                console.log('[CFD] ✅ CFD Service connected');
                console.log(`[CFD]    Capabilities: ${response.data.capabilities.join(', ')}`);
            }
        } catch (error) {
            this.serviceAvailable = false;
            console.warn('[CFD] ⚠️  CFD Service unavailable');
        }
    }

    /**
     * Extract geometry from P&ID design
     */
    extractGeometry(designData) {
        // Convert refrigeration design to CFD-compatible geometry
        const components = [];

        // Add evaporators as coolers
        if (designData.components && designData.components.evaporators) {
            designData.components.evaporators.forEach((evap, idx) => {
                components.push({
                    type: 'cooler',
                    x: 2.0 + idx * 3.0,  // Distribute evenly
                    y: 2.5,
                    capacity: evap.capacity || 50000,  // Watts
                    radius: 0.5
                });
            });
        }

        // Add compressors as heat sources
        if (designData.components && designData.components.compressors) {
            designData.components.compressors.forEach((comp, idx) => {
                components.push({
                    type: 'heat_source',
                    x: 8.0,
                    y: 2.5,
                    power: comp.power * 1000 || 30000,  // kW to W
                    radius: 0.5
                });
            });
        }

        return {
            width: 10.0,  // meters
            height: 5.0,
            mesh_size: 0.2,  // 20cm cells
            components
        };
    }

    /**
     * Infer boundary conditions from design
     */
    inferBoundaryConditions(designData) {
        const ambientTemp = designData.requirements?.room_temp || 25.0;

        return {
            ambient_temp: ambientTemp,
            walls: 'dirichlet'  // Fixed temperature walls
        };
    }

    /**
     * Run CFD simulation for a design
     */
    async runSimulation(designData, options = {}) {
        console.log('[CFD] Starting CFD simulation...');

        // Check service availability
        await this.checkService();

        if (!this.serviceAvailable) {
            console.warn('[CFD] ⚠️  CFD service not available, skipping simulation');
            return {
                success: false,
                error: 'CFD service not available',
                simulated: false
            };
        }

        try {
            // Prepare geometry
            const geometry = options.geometry || this.extractGeometry(designData);
            const boundary_conditions = options.boundary_conditions ||
                this.inferBoundaryConditions(designData);

            // Simulation configuration
            const simulation_config = {
                mode: options.mode || 'steady',
                solver_tolerance: options.tolerance || 1e-6,
                max_iterations: options.max_iterations || 5000
            };

            // Request payload
            const request = {
                geometry,
                components: geometry.components,
                boundary_conditions,
                simulation_config
            };

            console.log(`[CFD]   Components: ${geometry.components.length}`);
            console.log(`[CFD]   Grid: ${geometry.width}m x ${geometry.height}m`);

            // Call CFD service
            const response = await axios.post(
                `${this.cfdServiceUrl}/cfd/simulate/2d`,
                request,
                { timeout: 60000 }  // 60 second timeout
            );

            if (!response.data.success) {
                throw new Error(response.data.error);
            }

            const results = response.data.results;
            console.log(`[CFD] ✅ Simulation complete`);
            console.log(`[CFD]    Max temp: ${results.max_temperature.toFixed(1)}°C`);
            console.log(`[CFD]    Min temp: ${results.min_temperature.toFixed(1)}°C`);
            console.log(`[CFD]    Hot spots: ${results.hot_spots.length}`);

            return {
                success: true,
                simulated: true,
                results: {
                    max_temperature: results.max_temperature,
                    min_temperature: results.min_temperature,
                    mean_temperature: results.mean_temperature,
                    hot_spots: results.hot_spots,
                    grid_info: results.grid
                },
                solver_info: response.data.solver_info,
                visualizations: response.data.visualizations,
                metadata: response.data.metadata
            };

        } catch (error) {
            console.error('[CFD] ❌ Simulation failed:', error.message);
            return {
                success: false,
                error: error.message,
                simulated: false
            };
        }
    }

    /**
     * Generate mesh for geometry
     */
    async generateMesh(width, height, cellSize) {
        try {
            const response = await axios.post(
                `${this.cfdServiceUrl}/cfd/mesh/generate`,
                { width, height, cell_size: cellSize }
            );

            return response.data;
        } catch (error) {
            console.error('[CFD] Mesh generation failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Validate thermal design using CFD
     */
    async validateThermalDesign(designData) {
        console.log('[CFD] Validating thermal design with CFD...');

        const cfdResults = await this.runSimulation(designData);

        if (!cfdResults.success) {
            return {
                valid: false,
                issues: ['CFD simulation failed'],
                cfd_results: cfdResults
            };
        }

        // Check for thermal issues
        const issues = [];
        const results = cfdResults.results;

        // Check maximum temperature
        if (results.max_temperature > 60) {
            issues.push(`High temperature detected: ${results.max_temperature.toFixed(1)}°C`);
        }

        // Check hot spots
        if (results.hot_spots.length > 5) {
            issues.push(`Multiple hot spots detected: ${results.hot_spots.length} locations`);
        }

        // Temperature uniformity
        const tempRange = results.max_temperature - results.min_temperature;
        if (tempRange > 40) {
            issues.push(`Large temperature gradient: ${tempRange.toFixed(1)}°C range`);
        }

        return {
            valid: issues.length === 0,
            issues,
            cfd_results: cfdResults,
            thermal_performance: {
                max_temperature: results.max_temperature,
                temperature_range: tempRange,
                hot_spot_count: results.hot_spots.length
            }
        };
    }
}

module.exports = new CFDOrchestrator();
