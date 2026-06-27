/**
 * WSL2 Runner - Execute OpenFOAM commands in WSL2
 * Windows-native solution for OpenFOAM integration
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs').promises;
const path = require('path');

class WSL2Runner {
    constructor() {
        this.wslAvailable = null;
        this.openfoamAvailable = null;
        this.casesDir = '/home/erfan/cases'; // WSL path
        this.windowsCasesDir = '\\\\wsl$\\Ubuntu-22.04\\home\\erfan\\cases'; // Windows path
    }

    /**
     * Check if WSL2 is available
     */
    async checkWSL() {
        try {
            const { stdout } = await execPromise('wsl --status');
            this.wslAvailable = stdout.includes('Default Version: 2');

            if (this.wslAvailable) {
                console.log('[WSL2] ✅ WSL2 available');
            } else {
                console.log('[WSL2] ⚠️  WSL2 not found');
            }

            return this.wslAvailable;
        } catch (error) {
            console.log('[WSL2] ❌ WSL not installed');
            this.wslAvailable = false;
            return false;
        }
    }

    /**
     * Check if OpenFOAM is installed in WSL
     */
    async checkOpenFOAM() {
        try {
            const { stdout } = await this.runCommand('which blockMesh');

            this.openfoamAvailable = stdout.includes('/opt/openfoam');

            if (this.openfoamAvailable) {
                console.log('[WSL2] ✅ OpenFOAM available');
            } else {
                console.log('[WSL2] ⚠️  OpenFOAM not found in WSL');
            }

            return this.openfoamAvailable;
        } catch (error) {
            console.log('[WSL2] ❌ OpenFOAM not installed');
            this.openfoamAvailable = false;
            return false;
        }
    }

    /**
     * Run command in WSL2
     */
    async runCommand(command, options = {}) {
        const timeout = options.timeout || 300000; // 5 minutes default
        const cwd = options.cwd || this.casesDir;

        // Build WSL command
        const wslCommand = `wsl bash -c "cd ${cwd} && source /opt/openfoam10/etc/bashrc && ${command}"`;

        try {
            const { stdout, stderr } = await execPromise(wslCommand, {
                timeout,
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            });

            return {
                success: true,
                stdout,
                stderr
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                stdout: error.stdout || '',
                stderr: error.stderr || ''
            };
        }
    }

    /**
     * Create case directory in WSL
     */
    async createCaseDir(caseName) {
        const caseDir = `${this.casesDir}/${caseName}`;

        const result = await this.runCommand(`mkdir -p ${caseDir}`);

        if (result.success) {
            console.log(`[WSL2] Created case directory: ${caseDir}`);
            return caseDir;
        } else {
            throw new Error(`Failed to create case directory: ${result.error}`);
        }
    }

    /**
     * Copy file from Windows to WSL
     */
    async copyFileToWSL(windowsPath, wslPath) {
        try {
            // Convert Windows path to WSL path
            const wslSource = windowsPath.replace(/\\/g, '/').replace('C:', '/mnt/c');

            await this.runCommand(`cp "${wslSource}" "${wslPath}"`);

            console.log(`[WSL2] Copied: ${windowsPath} → ${wslPath}`);
            return true;
        } catch (error) {
            console.error(`[WSL2] Copy failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Copy file from WSL to Windows
     */
    async copyFileFromWSL(wslPath, windowsPath) {
        try {
            const wslDest = windowsPath.replace(/\\/g, '/').replace('C:', '/mnt/c');

            await this.runCommand(`cp "${wslPath}" "${wslDest}"`);

            console.log(`[WSL2] Copied: ${wslPath} → ${windowsPath}`);
            return true;
        } catch (error) {
            console.error(`[WSL2] Copy failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Run blockMesh
     */
    async runBlockMesh(caseName) {
        console.log(`[WSL2] Running blockMesh for ${caseName}...`);

        const caseDir = `${this.casesDir}/${caseName}`;

        const result = await this.runCommand('blockMesh', {
            cwd: caseDir,
            timeout: 60000
        });

        if (result.success) {
            const cells = this.extractCellCount(result.stdout);
            console.log(`[WSL2] ✅ blockMesh complete: ${cells} cells`);

            return {
                success: true,
                cells,
                output: result.stdout
            };
        } else {
            console.error(`[WSL2] ❌ blockMesh failed: ${result.error}`);
            return {
                success: false,
                error: result.error,
                output: result.stderr
            };
        }
    }

    /**
     * Run OpenFOAM solver
     */
    async runSolver(caseName, solver = 'buoyantSimpleFoam') {
        console.log(`[WSL2] Running ${solver} for ${caseName}...`);

        const caseDir = `${this.casesDir}/${caseName}`;

        const result = await this.runCommand(solver, {
            cwd: caseDir,
            timeout: 600000 // 10 minutes
        });

        if (result.success || result.stdout.includes('End')) {
            const converged = result.stdout.includes('converged') ||
                result.stdout.includes('SIMPLE solution');
            const iterations = this.extractIterations(result.stdout);

            console.log(`[WSL2] ✅ ${solver} complete: ${iterations} iterations`);

            return {
                success: true,
                converged,
                iterations,
                output: result.stdout
            };
        } else {
            console.error(`[WSL2] ❌ ${solver} failed: ${result.error}`);
            return {
                success: false,
                error: result.error,
                output: result.stderr
            };
        }
    }

    /**
     * Extract field statistics
     */
    async extractFieldStats(caseName, field = 'T') {
        console.log(`[WSL2] Extracting ${field} statistics for ${caseName}...`);

        const caseDir = `${this.casesDir}/${caseName}`;

        // Use postProcess to get min/max
        const result = await this.runCommand(
            `postProcess -func "fieldMinMax(${field})" -latestTime`,
            { cwd: caseDir, timeout: 30000 }
        );

        if (result.success) {
            const stats = this.parseFieldStats(result.stdout, field);
            console.log(`[WSL2] ✅ ${field} stats: min=${stats.min}, max=${stats.max}`);

            return {
                success: true,
                stats
            };
        } else {
            return {
                success: false,
                error: result.error
            };
        }
    }

    /**
     * Export to VTK for ParaView
     */
    async exportVTK(caseName) {
        console.log(`[WSL2] Exporting VTK for ${caseName}...`);

        const caseDir = `${this.casesDir}/${caseName}`;

        const result = await this.runCommand(
            'foamToVTK -latestTime',
            { cwd: caseDir, timeout: 60000 }
        );

        if (result.success) {
            const vtkDir = `${caseDir}/VTK`;
            console.log(`[WSL2] ✅ VTK exported to: ${vtkDir}`);

            return {
                success: true,
                vtkDir: vtkDir,
                windowsPath: `${this.windowsCasesDir}\\${caseName}\\VTK`
            };
        } else {
            return {
                success: false,
                error: result.error
            };
        }
    }

    // Helper methods

    extractCellCount(output) {
        const match = output.match(/cells:\s*(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    extractIterations(output) {
        const matches = output.match(/Time = \d+/g);
        return matches ? matches.length : 0;
    }

    parseFieldStats(output, field) {
        const stats = {};

        const minMatch = output.match(new RegExp(`min\\(${field}\\)\\s*=\\s*([\\d.e+-]+)`));
        const maxMatch = output.match(new RegExp(`max\\(${field}\\)\\s*=\\s*([\\d.e+-]+)`));

        if (minMatch) stats.min = parseFloat(minMatch[1]);
        if (maxMatch) stats.max = parseFloat(maxMatch[1]);

        return stats;
    }

    /**
     * Check system status
     */
    async getStatus() {
        const wslOk = await this.checkWSL();
        const openfoamOk = await this.checkOpenFOAM();

        return {
            wsl2: wslOk,
            openfoam: openfoamOk,
            ready: wslOk && openfoamOk,
            casesDir: this.casesDir,
            windowsCasesDir: this.windowsCasesDir
        };
    }
}

module.exports = WSL2Runner;
