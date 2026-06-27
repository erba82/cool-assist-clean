"""
OpenFOAM Wrapper Service - Simplified Production Version
Flask API for running OpenFOAM simulations
Optimized for GFDDE integration
"""

from flask import Flask, request, jsonify
from flas

k_cors import CORS
import subprocess
import os
import json
import shutil
import re
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Directories
CASES_DIR = Path('/cases')
RESULTS_DIR = Path('/results')

print("🚀 OpenFOAM Wrapper initializing...")
print(f"   Cases: {CASES_DIR}")
print(f"   Results: {RESULTS_DIR}")

# Ensure directories exist
CASES_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)


class OpenFOAMRunner:
    """Simplified OpenFOAM case runner"""
    
    def __init__(self, case_name):
        self.case_name = case_name
        self.case_dir = CASES_DIR / case_name
        
   def run_command(self, cmd, timeout=300):
        """Run OpenFOAM command"""
        try:
            # Source OpenFOAM environment first
            full_cmd = f"source /opt/openfoam10/etc/bashrc && {cmd}"
            
            result = subprocess.run(
                full_cmd,
                shell=True,
                executable='/bin/bash',
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=str(self.case_dir)
            )
            
            return {
                'success': result.returncode == 0,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'returncode': result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': f'Command timed out after {timeout}s'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def blockmesh(self):
        """Run blockMesh"""
        print(f"[{self.case_name}] Running blockMesh...")
        result = self.run_command('blockMesh', timeout=60)
        
        if result['success']:
            cells = self._extract_cells(result['stdout'])
            print(f"[{self.case_name}] ✅ Mesh: {cells} cells")
            return {'success': True, 'cells': cells}
        else:
            print(f"[{self.case_name}] ❌ blockMesh failed")
            return {'success': False, 'error': result.get('stderr', 'Unknown error')}
    
    def solve(self, solver='buoyantSimpleFoam'):
        """Run solver"""
        print(f"[{self.case_name}] Running {solver}...")
        result = self.run_command(solver, timeout=600)
        
        if result['success']:
            converged = 'converged' in result['stdout'].lower()
            iterations = len(re.findall(r'Time = \d+', result['stdout']))
            
            print(f"[{self.case_name}] ✅ Solved: {iterations} iterations")
            
            return {
                'success': True,
                'converged': converged,
                'iterations': iterations
            }
        else:
            print(f"[{self.case_name}] ❌ Solver failed")
            return {'success': False, 'error': result.get('stderr', 'Unknown error')}
    
    def extract_temperature(self):
        """Extract temperature statistics"""
        # Find latest time directory
        time_dirs = []
        for d in self.case_dir.iterdir():
            if d.is_dir() and d.name.replace('.', '').isdigit():
                time_dirs.append((float(d.name), d))
        
        if not time_dirs:
            return {'success': False, 'error': 'No time directories found'}
        
        latest_time = max(time_dirs, key=lambda x: x[0])[1]
        T_file = latest_time / 'T'
        
        if not T_file.exists():
            return {'success': False, 'error': 'Temperature file not found'}
        
        # Run postProcess to get statistics
        cmd = f'postProcess -func "fieldMinMax(T)" -latestTime'
        result = self.run_command(cmd, timeout=30)
        
        if result['success']:
            stats = self._parse_temp_stats(result['stdout'])
            return {'success': True, 'stats': stats}
        else:
            return {'success': False, 'error': 'Failed to extract stats'}
    
    def _extract_cells(self, output):
        """Extract cell count"""
        match = re.search(r'cells:\s*(\d+)', output)
        return int(match.group(1)) if match else 0
    
    def _parse_temp_stats(self, output):
        """Parse temperature statistics"""
        stats = {}
        
        min_match = re.search(r'min\(T\)\s*=\s*([\d.e+-]+)', output)
        max_match = re.search(r'max\(T\)\s*=\s*([\d.e+-]+)', output)
        
        if min_match:
            stats['min'] = float(min_match.group(1))
        if max_match:
            stats['max'] = float(max_match.group(1))
        
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
        'version': '1.0'
    })

@app.route('/simulate', methods=['POST'])
def simulate():
    """Run complete simulation"""
    try:
        data = request.json
        case_name = data.get('case_name', 'test_case')
        solver = data.get('solver', 'buoyantSimpleFoam')
        
        print(f"\n{'='*60}")
        print(f"🔬 Starting simulation: {case_name}")
        print(f"{'='*60}")
        
        runner = OpenFOAMRunner(case_name)
        
        # Step 1: Mesh
        mesh_result = runner.blockmesh()
        if not mesh_result['success']:
            return jsonify({
                'success': False,
                'stage': 'mesh',
                'error': mesh_result.get('error')
            }), 500
        
        # Step 2: Solve
        solve_result = runner.solve(solver)
        if not solve_result['success']:
            return jsonify({
                'success': False,
                'stage': 'solve',
                'error': solve_result.get('error')
            }), 500
        
        # Step 3: Extract results
        temp_result = runner.extract_temperature()
        
        print(f"✅ Simulation complete!")
        print(f"{'='*60}\n")
        
        return jsonify({
            'success': True,
            'mesh': mesh_result,
            'solve': solve_result,
            'temperature': temp_result.get('stats', {})
        })
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/cases/list', methods=['GET'])
def list_cases():
    """List available cases"""
    try:
        cases = [d.name for d in CASES_DIR.iterdir() if d.is_dir()]
        return jsonify({
            'success': True,
            'cases': cases,
            'count': len(cases)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    print("=" * 60)
    print("🚀 OpenFOAM Wrapper Service")
    print("=" * 60)
    print(f" OpenFOAM: v10")
    print(f" Port: 5004")
    print(f" Cases: {CASES_DIR}")
    print(f" Results: {RESULTS_DIR}")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5004, debug=True)
