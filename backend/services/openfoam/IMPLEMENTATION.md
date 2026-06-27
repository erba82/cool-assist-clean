# Phase 5: OpenFOAM Integration - Professional Implementation
## Windows-Compatible Docker-Based Approach

> **Challenge**: OpenFOAM is Linux-native  
> **Solution**: Docker containerization for cross-platform support  
> **Strategy**: Professional, production-ready CFD pipeline

---

## Architecture: Docker-Based OpenFOAM Service

```
┌────────────────────────────────────────────────────────┐
│  Windows Host (Node.js Backend)                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  OpenFOAM Orchestrator (Node.js)                │ │
│  │  ├── CaseManager.js    - Case lifecycle        │ │
│  │  ├── DockerRunner.js   - Container management  │ │
│  │  ├── GeometryBuilder.js - 3D from P&ID        │ │
│  │  └── ResultsParser.js  - Extract data         │ │
│  └────────────────┬─────────────────────────────────┘ │
└───────────────────┼───────────────────────────────────┘
                    │ Docker API
┌───────────────────┴───────────────────────────────────┐
│  Docker Container (OpenFOAM)                           │
│  ┌──────────────────────────────────────────────────┐ │
│  │  OpenFOAM v10 (Ubuntu 22.04)                    │ │
│  │  ├── blockMesh         - Mesh generation       │ │
│  │  ├── snappyHexMesh     - Advanced meshing      │ │
│  │  ├── buoyantSimpleFoam - Steady solver         │ │
│  │  ├── chtMultiRegionFoam - CHT solver           │ │
│  │  └── foamToVTK         - Export results       │ │
│  └──────────────────────────────────────────────────┘ │
│  Volume Mounts: /cases (shared with host)              │
└────────────────────────────────────────────────────────┘
```

---

## Component 1: Docker Setup

### Dockerfile for OpenFOAM Service

**File**: `backend/services/openfoam/Dockerfile`

```dockerfile
# Official OpenFOAM image (optimized)
FROM openfoam/openfoam10-paraview510

# Install Python for scripting
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-numpy \
    python3-vtk9 \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip3 install flask flask-cors

# Set working directory
WORKDIR /openfoam

# Copy Python scripts
COPY openfoam_wrapper.py /openfoam/
COPY case_templates/ /openfoam/templates/

# Source OpenFOAM environment
RUN echo "source /opt/openfoam10/etc/bashrc" >> ~/.bashrc

# Expose Flask API port
EXPOSE 5004

# Entry point
CMD ["python3", "/openfoam/openfoam_wrapper.py"]
```

### Docker Compose (Optional)

**File**: `backend/services/openfoam/docker-compose.yml`

```yaml
version: '3.8'

services:
  openfoam:
    build: .
    container_name: gfdde-openfoam
    ports:
      - "5004:5004"
    volumes:
      - ./cases:/cases
      - ./results:/results
    environment:
      - FOAM_INST_DIR=/opt/openfoam10
    restart: unless-stopped
    mem_limit: 4g
    cpus: 2
```

---

## Component 2: Python OpenFOAM Wrapper

### Flask API for OpenFOAM Operations

**File**: `backend/services/openfoam/openfoam_wrapper.py`

```python
"""
OpenFOAM Wrapper Service
Flask API for running OpenFOAM simulations in Docker
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import json
import shutil
from pathlib import Path

app = Flask(__name__)
CORS(app)

CASES_DIR = Path('/cases')
RESULTS_DIR = Path('/results')
TEMPLATES_DIR = Path('/openfoam/templates')

class OpenFOAMCase:
    """Manages OpenFOAM case directory"""
    
    def __init__(self, case_name):
        self.case_name = case_name
        self.case_dir = CASES_DIR / case_name
        
    def create_from_template(self, template='buoyantSimpleFoam'):
        """Create case from template"""
        template_dir = TEMPLATES_DIR / template
        
        if template_dir.exists():
            shutil.copytree(template_dir, self.case_dir)
            print(f"✅ Created case from template: {template}")
            return True
        else:
            print(f"❌ Template not found: {template}")
            return False
    
    def update_boundary_conditions(self, bc_config):
        """Update boundary conditions"""
        # Update 0/T, 0/p, 0/U files
        for field, bc in bc_config.items():
            field_file = self.case_dir / '0' / field
            
            if field_file.exists():
                self._update_field_file(field_file, bc)
    
    def update_physical_properties(self, props):
        """Update transportProperties, turbulenceProperties"""
        transport_file = self.case_dir / 'constant' / 'transportProperties'
        
        # Update values
        if transport_file.exists():
            content = transport_file.read_text()
            
            for key, value in props.items():
                # Simple regex replacement
                content = content.replace(f'{key}.*', f'{key} {value};')
            
            transport_file.write_text(content)
    
    def run_blockmesh(self):
        """Generate mesh with blockMesh"""
        print("[OpenFOAM] Running blockMesh...")
        
        result = subprocess.run(
            ['blockMesh', '-case', str(self.case_dir)],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            print("✅ blockMesh complete")
            cells = self._extract_cell_count(result.stdout)
            return {'success': True, 'cells': cells}
        else:
            print(f"❌ blockMesh failed: {result.stderr}")
            return {'success': False, 'error': result.stderr}
    
    def run_snappyhexmesh(self):
        """Generate mesh with snappyHexMesh"""
        print("[OpenFOAM] Running snappyHexMesh...")
        
        result = subprocess.run(
            ['snappyHexMesh', '-overwrite', '-case', str(self.case_dir)],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            print("✅ snappyHexMesh complete")
            cells = self._extract_cell_count(result.stdout)
            return {'success': True, 'cells': cells}
        else:
            return {'success': False, 'error': result.stderr}
    
    def check_mesh(self):
        """Check mesh quality"""
        result = subprocess.run(
            ['checkMesh', '-case', str(self.case_dir)],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        quality = self._parse_mesh_quality(result.stdout)
        return quality
    
    def run_solver(self, solver='buoyantSimpleFoam', parallel=False, cores=2):
        """Run OpenFOAM solver"""
        print(f"[OpenFOAM] Running {solver}...")
        
        if parallel:
            # Decompose domain
            subprocess.run(['decomposePar', '-case', str(self.case_dir)])
            
            # Run parallel
            result = subprocess.run(
                ['mpirun', '-np', str(cores), solver, '-parallel', '-case', str(self.case_dir)],
                capture_output=True,
                text=True,
                timeout=600
            )
            
            # Reconstruct
            subprocess.run(['reconstructPar', '-case', str(self.case_dir)])
        else:
            # Serial run
            result = subprocess.run(
                [solver, '-case', str(self.case_dir)],
                capture_output=True,
                text=True,
                timeout=600
            )
        
        if result.returncode == 0:
            print(f"✅ {solver} complete")
            
            converged = self._check_convergence(result.stdout)
            iterations = self._extract_iterations(result.stdout)
            residuals = self._extract_residuals(result.stdout)
            
            return {
                'success': True,
                'converged': converged,
                'iterations': iterations,
                'residuals': residuals
            }
        else:
            print(f"❌ {solver} failed")
            return {'success': False, 'error': result.stderr}
    
    def export_vtk(self):
        """Export results to VTK for ParaView"""
        print("[OpenFOAM] Exporting to VTK...")
        
        result = subprocess.run(
            ['foamToVTK', '-latestTime', '-case', str(self.case_dir)],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            vtk_dir = self.case_dir / 'VTK'
            return {'success': True, 'path': str(vtk_dir)}
        else:
            return {'success': False, 'error': result.stderr}
    
    def extract_field_stats(self, field='T', time='latestTime'):
        """Extract field statistics"""
        # Use OpenFOAM postProcess utility
        result = subprocess.run(
            ['postProcess', '-func', f'fieldMinMax({field})', f'-time', time, '-case', str(self.case_dir)],
            capture_output=True,
            text=True
        )
        
        stats = self._parse_field_stats(result.stdout, field)
        return stats
    
    # Helper methods
    
    def _extract_cell_count(self, output):
        """Extract cell count from blockMesh output"""
        import re
        match = re.search(r'cells:\s*(\d+)', output)
        return int(match.group(1)) if match else 0
    
    def _parse_mesh_quality(self, output):
        """Parse mesh quality metrics"""
        import re
        
        quality = {}
        
        # Non-orthogonality
        match = re.search(r'Max non-orthogonality = ([\d.]+)', output)
        if match:
            quality['non_orthogonality'] = float(match.group(1))
        
        # Skewness
        match = re.search(r'Max skewness = ([\d.]+)', output)
        if match:
            quality['skewness'] = float(match.group(1))
        
        # Aspect ratio
        match = re.search(r'Max aspect ratio = ([\d.]+)', output)
        if match:
            quality['aspect_ratio'] = float(match.group(1))
        
        return quality
    
    def _check_convergence(self, output):
        """Check if solution converged"""
        # Look for "SIMPLE solution converged" or low residuals
        if 'solution converged' in output.lower():
            return True
        
        # Check final residuals
        import re
        residuals = re.findall(r'Final residual = ([\d.e-]+)', output)
        
        if residuals:
            # All residuals < 1e-4
            return all(float(r) < 1e-4 for r in residuals[-5:])
        
        return False
    
    def _extract_iterations(self, output):
        """Extract number of iterations"""
        import re
        times = re.findall(r'Time = (\d+)', output)
        return len(times) if times else 0
    
    def _extract_residuals(self, output):
        """Extract final residuals"""
        import re
        
        residuals = {}
        fields = ['p', 'U', 'T', 'k', 'epsilon']
        
        for field in fields:
            pattern = f'{field}.*Final residual = ([\\d.e-]+)'
            matches = re.findall(pattern, output)
            if matches:
                residuals[field] = float(matches[-1])
        
        return residuals
    
    def _parse_field_stats(self, output, field):
        """Parse field statistics from postProcess output"""
        import re
        
        stats = {}
        
        # Min
        match = re.search(f'{field}.*min = ([\\d.e-]+)', output)
        if match:
            stats['min'] = float(match.group(1))
        
        # Max
        match = re.search(f'{field}.*max = ([\\d.e-]+)', output)
        if match:
            stats['max'] = float(match.group(1))
        
        return stats


# ============================================================
# Flask API Endpoints
# ============================================================

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'service': 'OpenFOAM Wrapper',
        'version': 'v10'
    })

@app.route('/case/create', methods=['POST'])
def create_case():
    """Create new OpenFOAM case"""
    data = request.json
    
    case_name = data.get('case_name', 'test_case')
    template = data.get('template', 'buoyantSimpleFoam')
    
    case = OpenFOAMCase(case_name)
    
    if case.create_from_template(template):
        return jsonify({
            'success': True,
            'case_name': case_name,
            'case_dir': str(case.case_dir)
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Template not found'
        }), 404

@app.route('/mesh/blockmesh', methods=['POST'])
def run_blockmesh():
    """Run blockMesh"""
    data = request.json
    case_name = data.get('case_name')
    
    case = OpenFOAMCase(case_name)
    result = case.run_blockmesh()
    
    return jsonify(result)

@app.route('/mesh/snappy', methods=['POST'])
def run_snappy():
    """Run snappyHexMesh"""
    data = request.json
    case_name = data.get('case_name')
    
    case = OpenFOAMCase(case_name)
    result = case.run_snappyhexmesh()
    
    return jsonify(result)

@app.route('/mesh/check', methods=['POST'])
def check_mesh():
    """Check mesh quality"""
    data = request.json
    case_name = data.get('case_name')
    
    case = OpenFOAMCase(case_name)
    quality = case.check_mesh()
    
    return jsonify({
        'success': True,
        'quality': quality
    })

@app.route('/solve', methods=['POST'])
def run_solve():
    """Run solver"""
    data = request.json
    
    case_name = data.get('case_name')
    solver = data.get('solver', 'buoyantSimpleFoam')
    parallel = data.get('parallel', False)
    cores = data.get('cores', 2)
    
    case = OpenFOAMCase(case_name)
    result = case.run_solver(solver, parallel, cores)
    
    return jsonify(result)

@app.route('/results/extract', methods=['POST'])
def extract_results():
    """Extract simulation results"""
    data = request.json
    case_name = data.get('case_name')
    
    case = OpenFOAMCase(case_name)
    
    # Export VTK
    vtk_result = case.export_vtk()
    
    # Extract field stats
    temp_stats = case.extract_field_stats('T')
    
    return jsonify({
        'success': True,
        'vtk': vtk_result,
        'temperature': temp_stats
    })

@app.route('/cases/list', methods=['GET'])
def list_cases():
    """List all cases"""
    cases = [d.name for d in CASES_DIR.iterdir() if d.is_dir()]
    
    return jsonify({
        'success': True,
        'cases': cases,
        'count': len(cases)
    })


if __name__ == '__main__':
    # Ensure directories exist
    CASES_DIR.mkdir(exist_ok=True)
    RESULTS_DIR.mkdir(exist_ok=True)
    
    print("🚀 OpenFOAM Wrapper Service starting...")
    print(f"   Cases directory: {CASES_DIR}")
    print(f"   Results directory: {RESULTS_DIR}")
    
    app.run(host='0.0.0.0', port=5004, debug=False)
```

---

## Component 3: Node.js Docker Runner

**File**: `backend/services/openfoam/DockerRunner.js`

```javascript
const { spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs').promises;

class DockerRunner {
    constructor() {
        this.containerName = 'gfdde-openfoam';
        this.serviceUrl = 'http://localhost:5004';
        this.isRunning = null;
    }

    /**
     * Check if Docker is available
     */
    async checkDocker() {
        try {
            const { exec } = require('child_process');
            const util = require('util');
            const execPromise = util.promisify(exec);
            
            await execPromise('docker --version');
            console.log('[Docker] Docker is available');
            return true;
        } catch (error) {
            console.error('[Docker] Docker not found:', error.message);
            return false;
        }
    }

    /**
     * Check if OpenFOAM container is running
     */
    async checkContainer() {
        try {
            const response = await axios.get(`${this.serviceUrl}/health`, {
                timeout: 2000
            });
            
            this.isRunning = response.data.status === 'healthy';
            return this.isRunning;
        } catch (error) {
            this.isRunning = false;
            return false;
        }
    }

    /**
     * Start OpenFOAM container
     */
    async startContainer() {
        console.log('[Docker] Starting OpenFOAM container...');
        
        const dockerAvailable = await this.checkDocker();
        if (!dockerAvailable) {
            throw new Error('Docker not available. Please install Docker Desktop.');
        }
        
        return new Promise((resolve, reject) => {
            const docker = spawn('docker-compose', ['up', '-d'], {
                cwd: './backend/services/openfoam',
                shell: true
            });
            
            docker.stdout.on('data', (data) => {
                console.log(`[Docker] ${data}`);
            });
            
            docker.stderr.on('data', (data) => {
                console.error(`[Docker] ${data}`);
            });
            
            docker.on('close', async (code) => {
                if (code === 0) {
                    console.log('[Docker] ✅ Container started');
                    
                    // Wait for service to be ready
                    await this.waitForService();
                    
                    resolve();
                } else {
                    reject(new Error(`Docker failed with code ${code}`));
                }
            });
        });
    }

    /**
     * Wait for service to be ready
     */
    async waitForService(maxAttempts = 30) {
        for (let i = 0; i < maxAttempts; i++) {
            const ready = await this.checkContainer();
            
            if (ready) {
                console.log('[Docker] ✅ Service ready');
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        throw new Error('Service failed to start');
    }

    /**
     * Stop container
     */
    async stopContainer() {
        console.log('[Docker] Stopping container...');
        
        return new Promise((resolve, reject) => {
            const docker = spawn('docker-compose', ['down'], {
                cwd: './backend/services/openfoam',
                shell: true
            });
            
            docker.on('close', (code) => {
                if (code === 0) {
                    console.log('[Docker] ✅ Container stopped');
                    resolve();
                } else {
                    reject(new Error(`Failed to stop container`));
                }
            });
        });
    }
}

module.exports = DockerRunner;
```

---

**Phase 5.1 Foundation با Docker solution آماده است. ادامه می‌دهم؟**
