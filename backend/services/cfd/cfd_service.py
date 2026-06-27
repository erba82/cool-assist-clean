"""
CFD Service - Flask API
Provides REST API for CFD simulations
Port: 5003
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
import base64
from io import BytesIO
from datetime import datetime

from heat_solver_2d import HeatSolver2D
from visualizer import CFDVisualizer
from enhanced_solver import EnhancedCFDSolver, Materials, Region, RegionType, TurbulenceModel
from enhanced_visualizer import EnhancedVisualizer

app = Flask(__name__)
CORS(app)

# Global configuration
OUTPUT_DIR = 'cfd_results'
os.makedirs(OUTPUT_DIR, exist_ok=True)

visualizer = CFDVisualizer(output_dir=OUTPUT_DIR)
enhanced_viz = EnhancedVisualizer(output_dir=OUTPUT_DIR)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'CFD Simulation Service',
        'version': '1.0.0',
        'capabilities': [
            '2D heat transfer',
            'steady-state solving',
            'transient solving',
            'visualization'
        ],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/cfd/simulate/2d', methods=['POST'])
def simulate_2d():
    """
    Run 2D CFD simulation
    
    Request body:
    {
        "geometry": {
            "width": 10.0,
            "height": 5.0,
            "mesh_size": 0.1
        },
        "components": [
            {"type": "heat_source", "x": 2.0, "y": 2.5, "power": 5000},
            {"type": "cooler", "x": 8.0, "y": 2.5, "capacity": 5000}
        ],
        "boundary_conditions": {
            "ambient_temp": 25.0,
            "walls": "dirichlet"
        },
        "simulation_config": {
            "mode": "steady",
            "solver_tolerance": 1e-6,
            "max_iterations": 10000
        }
    }
    """
    try:
        data = request.json
        
        # Extract geometry
        geometry = data.get('geometry', {})
        width = geometry.get('width', 10.0)
        height = geometry.get('height', 5.0)
        mesh_size = geometry.get('mesh_size', 0.1)
        
        # Calculate grid
        nx = int(width / mesh_size) + 1
        ny = int(height / mesh_size) + 1
        dx = width / (nx - 1)
        dy = height / (ny - 1)
        
        print(f"\n[CFD] Starting 2D simulation: {nx}x{ny} grid")
        
        # Create solver
        solver = HeatSolver2D(nx, ny, dx, dy, alpha=1e-5)
        
        # Initial temperature
        ambient_temp = data.get('boundary_conditions', {}).get('ambient_temp', 25.0)
        solver.set_initial_temperature(ambient_temp)
        
        # Add components
        components = data.get('components', [])
        for comp in components:
            comp_type = comp.get('type')
            x = comp.get('x', 0)
            y = comp.get('y', 0)
            
            if comp_type == 'heat_source':
                power = comp.get('power', 1000)
                radius = comp.get('radius', 0.5)
                solver.add_heat_source(x, y, power, radius)
                print(f"  + Heat source at ({x}, {y}): {power}W")
                
            elif comp_type == 'cooler':
                capacity = comp.get('capacity', 1000)
                radius = comp.get('radius', 0.5)
                solver.add_cooler(x, y, capacity, radius)
                print(f"  + Cooler at ({x}, {y}): {capacity}W")
        
        # Set boundary conditions
        wall_bc = data.get('boundary_conditions', {}).get('walls', 'dirichlet')
        for side in ['top', 'bottom', 'left', 'right']:
            solver.set_boundary_condition(side, wall_bc, ambient_temp)
        
        # Solve
        config = data.get('simulation_config', {})
        mode = config.get('mode', 'steady')
        
        if mode == 'steady':
            tolerance = config.get('solver_tolerance', 1e-6)
            max_iterations = config.get('max_iterations', 10000)
            
            T, iterations, residual = solver.solve_steady_state(
                max_iterations=max_iterations,
                tolerance=tolerance
            )
            
            solve_info = {
                'mode': 'steady-state',
                'iterations': int(iterations),
                'final_residual': float(residual),
                'converged': residual < tolerance
            }
        else:
            # Transient mode (not implemented in this request, but available)
            return jsonify({
                'success': False,
                'error': 'Transient mode not yet exposed via API'
            }), 400
        
        # Get results
        results = solver.get_results()
        hot_spots = solver.find_hot_spots(threshold_percentile=90)
        
        # Generate visualization
        x = np.linspace(0, width, nx)
        y = np.linspace(0, height, ny)
        X, Y = np.meshgrid(x, y)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        temp_file = visualizer.plot_temperature_contours(
            T, X, Y,
            title=f'CFD Simulation - {timestamp}',
            filename=f'cfd_temp_{timestamp}.png'
        )
        
        # Create summary
        U = np.zeros_like(T)  # No flow in this simple case
        V = np.zeros_like(T)
        solver_info = {
            'nx': nx,
            'ny': ny,
            'dx': dx,
            'method': 'Finite Difference',
            'iterations': iterations,
            'residual': f'{residual:.2e}'
        }
        
        summary_file = visualizer.create_summary_figure(
            T, U, V, X, Y, solver_info,
            filename=f'cfd_summary_{timestamp}.png'
        )
        
        print(f"[CFD] ✅ Simulation complete")
        print(f"  Max temp: {results['max_temperature']:.2f}°C")
        print(f"  Min temp: {results['min_temperature']:.2f}°C")
        print(f"  Hot spots: {len(hot_spots)}")
        
        return jsonify({
            'success': True,
            'results': {
                'temperature_field': T.tolist(),
                'max_temperature': results['max_temperature'],
                'min_temperature': results['min_temperature'],
                'mean_temperature': results['mean_temperature'],
                'hot_spots': hot_spots,
                'grid': results['grid']
            },
            'solver_info': solve_info,
            'visualizations': {
                'temperature_plot': temp_file,
                'summary_plot': summary_file
            },
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'simulation_id': timestamp
            }
        })
        
    except Exception as e:
        print(f"[CFD] ❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/cfd/mesh/generate', methods=['POST'])
def generate_mesh():
    """Generate mesh for given geometry"""
    try:
        data = request.json
        
        width = data.get('width', 10.0)
        height = data.get('height', 5.0)
        cell_size = data.get('cell_size', 0.1)
        
        nx = int(width / cell_size) + 1
        ny = int(height / cell_size) + 1
        
        x = np.linspace(0, width, nx)
        y = np.linspace(0, height, ny)
        X, Y = np.meshgrid(x, y)
        
        return jsonify({
            'success': True,
            'mesh': {
                'nx': nx,
                'ny': ny,
                'total_cells': nx * ny,
                'cell_size_x': width / (nx - 1),
                'cell_size_y': height / (ny - 1),
                'coordinates_x': x.tolist(),
                'coordinates_y': y.tolist()
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/cfd/results/<simulation_id>', methods=['GET'])
def get_results(simulation_id):
    """Retrieve results for a specific simulation"""
    try:
        # Check if files exist
        temp_file = f'cfd_temp_{simulation_id}.png'
        summary_file = f'cfd_summary_{simulation_id}.png'
        
        temp_path = os.path.join(OUTPUT_DIR, temp_file)
        summary_path = os.path.join(OUTPUT_DIR, summary_file)
        
        if not os.path.exists(temp_path):
            return jsonify({
                'success': False,
                'error': f'Simulation {simulation_id} not found'
            }), 404
        
        return jsonify({
            'success': True,
            'simulation_id': simulation_id,
            'visualizations': {
                'temperature_plot': temp_path,
                'summary_plot': summary_path if os.path.exists(summary_path) else None
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/cfd/enhanced/multi-region', methods=['POST'])
def simulate_enhanced():
    """
    Enhanced multi-region CFD simulation
    
    Supports:
    - Multiple material regions (solid + fluid)
    - Conjugate heat transfer
    - Advanced turbulence models
    - Transient simulation
    - VTK export for ParaView
    
    Request body:
    {
        "geometry": {
            "width": 5.0,
            "height": 3.0,
            "nx": 100,
            "ny": 60
        },
        "regions": [
            {
                "name": "heat_exchanger",
                "material": "copper",
                "x_range": [1.0, 2.0],
                "y_range": [1.0, 2.0],
                "heat_source": 50000
            },
            {
                "name": "fluid_domain",
                "material": "air",
                "x_range": [0.0, 5.0],
                "y_range": [0.0, 3.0]
            }
        ],
        "turbulence": "k_epsilon",  # or "laminar", "k_omega_sst"
        "mode": "steady",  # or "transient"
        "boundary_conditions": {
            "left": {"type": "dirichlet", "value": 300},
            "right": {"type": "neumann", "value": 0},
            "top": {"type": "dirichlet", "value": 290},
            "bottom": {"type": "dirichlet", "value": 290}
        }
    }
    """
    try:
        data = request.json
        
        # Geometry
        geom = data.get('geometry', {})
        nx = geom.get('nx', 100)
        ny = geom.get('ny', 60)
        Lx = geom.get('width', 5.0)
        Ly = geom.get('height', 3.0)
        
        print(f"\\n[Enhanced CFD] Starting multi-region simulation: {nx}×{ny}")
        
        # Create solver
        solver = EnhancedCFDSolver(nx, ny, Lx, Ly)
        
        # Turbulence model
        turb_model = data.get('turbulence', 'laminar')
        if turb_model == 'k_epsilon':
            solver.set_turbulence_model(TurbulenceModel.K_EPSILON)
        elif turb_model == 'k_omega_sst':
            solver.set_turbulence_model(TurbulenceModel.K_OMEGA_SST)
        
        # Add regions
        regions_data = data.get('regions', [])
        for reg_data in regions_data:
            name = reg_data.get('name', 'region')
            mat_name = reg_data.get('material', 'air').upper()
            
            # Get material
            material = getattr(Materials, mat_name, Materials.AIR)
            
            region = Region(
                name=name,
                material=material,
                x_range=tuple(reg_data.get('x_range', [0, Lx])),
                y_range=tuple(reg_data.get('y_range', [0, Ly])),
                heat_source=reg_data.get('heat_source', 0.0)
            )
            
            solver.add_region(region)
        
        # Initial conditions
        ambient = data.get('initial_temp', 300.0)
        solver.set_initial_conditions(T0=ambient)
        
        # Boundary conditions
        bc_data = data.get('boundary_conditions', {})
        for boundary, bc in bc_data.items():
            solver.set_boundary_condition(boundary, bc['type'], bc['value'])
        
        # Solve
        mode = data.get('mode', 'steady')
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if mode == 'steady':
            max_iter = data.get('max_iterations', 5000)
            tol = data.get('tolerance', 1e-6)
            
            T, iterations, residual = solver.solve_heat_conduction_steady(
                max_iter=max_iter,
                tol=tol
            )
            
            solve_info = {
                'mode': 'steady-state',
                'iterations': int(iterations),
                'residual': float(residual),
                'converged': residual < tol
            }
            
        elif mode == 'transient':
            dt = data.get('time_step', 0.1)
            num_steps = data.get('num_steps', 100)
            
            T_history = solver.solve_transient(dt, num_steps)
            T = T_history[-1]
            
            solve_info = {
                'mode': 'transient',
                'time_step': dt,
                'num_steps': num_steps,
                'total_time': dt * num_steps
            }
        
        # Get results
        results = solver.get_results_summary()
        
        # Visualization
        X, Y = solver.X, solver.Y
        
        solver_info = {
            'nx': nx,
            'ny': ny,
            'Lx': Lx,
            'Ly': Ly,
            'method': 'Enhanced FDM',
            'turbulence': turb_model,
            'iterations': solve_info.get('iterations', 'N/A'),
            'residual': solve_info.get('residual', 'N/A')
        }
        
        # Temperature field
        temp_file = enhanced_viz.plot_temperature_field(
            X, Y, T, solver_info,
            filename=f'enhanced_temp_{timestamp}.png'
        )
        
        # Multi-region view
        region_file = enhanced_viz.plot_multi_region(
            X, Y, T, solver.material_map, solver.regions,
            filename=f'enhanced_regions_{timestamp}.png'
        )
        
        # Comprehensive report
        report_file = enhanced_viz.create_comprehensive_report(
            X, Y, T, solver.U, solver.V, solver_info,
            filename=f'enhanced_report_{timestamp}.png'
        )
        
        # VTK export
        vtk_file = enhanced_viz.export_vtk(
            X, Y, T, solver.U, solver.V, solver.P,
            filename=f'enhanced_{timestamp}.vtk'
        )
        
        print(f"[Enhanced CFD] ✅ Simulation complete")
        print(f"  Temperature range: {results['temperature']['min']:.2f} - {results['temperature']['max']:.2f} K")
        print(f"  Hot spots: {results['hot_spots_count']}")
        
        return jsonify({
            'success': True,
            'results': results,
            'solver_info': solve_info,
            'visualizations': {
                'temperature': temp_file,
                'regions': region_file,
                'report': report_file,
                'vtk': vtk_file
            },
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'simulation_id': timestamp
            }
        })
        
    except Exception as e:
        print(f"[Enhanced CFD] ❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    print("=" * 70)
    print("CFD Simulation Service")
    print("=" * 70)
    print(f"Starting server on http://localhost:5003")
    print(f"Output directory: {OUTPUT_DIR}")
    print("=" * 70)
    
    app.run(host='0.0.0.0', port=5003, debug=False)
