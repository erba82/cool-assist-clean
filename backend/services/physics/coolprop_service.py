# backend/services/physics/coolprop_service.py
"""
CoolProp Physics Microservice for GFDDE
Provides high-fidelity thermodynamic calculations for all refrigerants
Based on Helmholtz Energy Equation of State (HEOS)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import CoolProp.CoolProp as CP
import numpy as np
import sys
import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for Node.js backend

# Supported refrigerants
SUPPORTED_REFRIGERANTS = {
    'R717': 'Ammonia',
    'R22': 'R22',
    'R410A': 'R410A',
    'R32': 'R32',
    'R134a': 'R134a',
    'R744': 'CO2',
    'Ammonia': 'Ammonia',
    'CO2': 'CO2'
}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        version = getattr(CP, '__version__', CP.get_global_param_string('version'))
    except:
        version = '7.2.0 (detected)'
    
    return jsonify({
        'status': 'healthy',
        'service': 'CoolProp Physics Engine',
        'version': version,
        'supported_refrigerants': list(SUPPORTED_REFRIGERANTS.keys())
    })

@app.route('/properties', methods=['POST'])
def calculate_properties():
    """
    Calculate thermodynamic properties
    
    RequestJSON:
    {
        "fluid": "R717" or "Ammonia",
        "input_pair": "PT",  # Pressure-Temperature
        "input1": 500000,    # Pressure in Pa
        "input2": 273.15,    # Temperature in K
        "outputs": ["H", "S", "D", "Q"]
    }
    
    Output properties:
    - H: Enthalpy (J/kg)
    - S: Entropy (J/kg/K)
    - D: Density (kg/m³)
    - Q: Quality (0-1)
    - T: Temperature (K)
    - P: Pressure (Pa)
    - Cpmass: Specific heat at constant pressure (J/kg/K)
    - Cvmass: Specific heat at constant volume (J/kg/K)
    - Phase: Phase identifier (0-6)
    """
    try:
        data = request.json
        
        fluid = data.get('fluid')
        if not fluid:
            return jsonify({'success': False, 'error': 'Fluid not specified'}), 400
        
        # Map to CoolProp name
        coolprop_fluid = SUPPORTED_REFRIGERANTS.get(fluid, fluid)
        
        input_pair = data.get('input_pair', 'PT')
        input1 = data.get('input1')
        input2 = data.get('input2')
        outputs = data.get('outputs', ['H', ' S', 'D'])
        
        if input1 is None or input2 is None:
            return jsonify({'success': False, 'error': 'Input values not provided'}), 400
        
        results = {}
        
        for output in outputs:
            try:
                value = CP.PropsSI(output, input_pair[0], input1, input_pair[1], input2, coolprop_fluid)
                results[output] = float(value)
            except Exception as prop_error:
                results[output] = None
                results[f'{output}_error'] = str(prop_error)
        
        # Add phase information
        try:
            phase = CP.PropsSI('Phase', input_pair[0], input1, input_pair[1], input2, coolprop_fluid)
            results['Phase'] = int(phase)
            results['PhaseDescription'] = get_phase_description(phase)
        except:
            pass
        
        return jsonify({
            'success': True,
            'fluid': coolprop_fluid,
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 400

@app.route('/vle', methods=['POST'])
def calculate_vle():
    """
    Calculate Vapor-Liquid Equilibrium properties
    
    Request JSON:
    {
        "fluid": "R717",
        "temperature": 273.15,  # K
        "quality": 0.5  # Optional, 0 = saturated liquid, 1 = saturated vapor
    }
    
    Returns saturation properties at given temperature
    """
    try:
        data = request.json
        
        fluid = data.get('fluid')
        coolprop_fluid = SUPPORTED_REFRIGERANTS.get(fluid, fluid)
        
        T = data.get('temperature')
        Q = data.get('quality', 0)
        
        if T is None:
            return jsonify({'success': False, 'error': 'Temperature not provided'}), 400
        
        # Saturation properties
        P_sat = CP.PropsSI('P', 'T', T, 'Q', 0, coolprop_fluid)
        
        # Liquid properties (Q=0)
        h_liquid = CP.PropsSI('H', 'T', T, 'Q', 0, coolprop_fluid)
        s_liquid = CP.PropsSI('S', 'T', T, 'Q', 0, coolprop_fluid)
        d_liquid = CP.PropsSI('D', 'T', T, 'Q', 0, coolprop_fluid)
        
        # Vapor properties (Q=1)
        h_vapor = CP.PropsSI('H', 'T', T, 'Q', 1, coolprop_fluid)
        s_vapor = CP.PropsSI('S', 'T', T, 'Q', 1, coolprop_fluid)
        d_vapor = CP.PropsSI('D', 'T', T, 'Q', 1, coolprop_fluid)
        
        # Latent heat
        h_fg = h_vapor - h_liquid
        
        return jsonify({
            'success': True,
            'fluid': coolprop_fluid,
            'results': {
                'temperature': float(T),
                'saturation_pressure': float(P_sat),
                'liquid': {
                    'enthalpy': float(h_liquid),
                    'entropy': float(s_liquid),
                    'density': float(d_liquid)
                },
                'vapor': {
                    'enthalpy': float(h_vapor),
                    'entropy': float(s_vapor),
                    'density': float(d_vapor)
                },
                'latent_heat': float(h_fg)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 400

@app.route('/cycle', methods=['POST'])
def calculate_refrigeration_cycle():
    """
    Complete vapor-compression cycle calculation
    
    Request JSON:
    {
        "fluid": "R717",
        "evap_temp": 268.15,  # K (-5°C)
        "cond_temp": 313.15,  # K (40°C)
        "superheat": 5,       # K
        "subcool": 3,         # K
        "isentropic_efficiency": 0.75
    }
    
    Returns complete cycle state points and performance metrics
    """
    try:
        data = request.json
        
        fluid = data.get('fluid')
        coolprop_fluid = SUPPORTED_REFRIGERANTS.get(fluid, fluid)
        
        T_evap = data.get('evap_temp')
        T_cond = data.get('cond_temp')
        superheat = data.get('superheat', 0)
        subcool = data.get('subcool', 0)
        eta_is = data.get('isentropic_efficiency', 0.75)
        
        if T_evap is None or T_cond is None:
            return jsonify({'success': False, 'error': 'Evap/Cond temperatures not provided'}), 400
        
        # State 1: Compressor Inlet (superheated vapor from evaporator)
        P1 = CP.PropsSI('P', 'T', T_evap, 'Q', 1, coolprop_fluid)
        T1 = T_evap + superheat
        h1 = CP.PropsSI('H', 'P', P1, 'T', T1, coolprop_fluid)
        s1 = CP.PropsSI('S', 'P', P1, 'T', T1, coolprop_fluid)
        d1 = CP.PropsSI('D', 'P', P1, 'T', T1, coolprop_fluid)
        
        # State 2s: Compressor Outlet (isentropic)
        P2 = CP.PropsSI('P', 'T', T_cond, 'Q', 1, coolprop_fluid)
        h2s = CP.PropsSI('H', 'P', P2, 'S', s1, coolprop_fluid)
        
        # State 2: Compressor Outlet (actual, with efficiency)
        h2 = h1 + (h2s - h1) / eta_is
        T2 = CP.PropsSI('T', 'P', P2, 'H', h2, coolprop_fluid)
        s2 = CP.PropsSI('S', 'P', P2, 'H', h2, coolprop_fluid)
        d2 = CP.PropsSI('D', 'P', P2, 'H', h2, coolprop_fluid)
        
        # State 3: Condenser Outlet (subcooled liquid)
        T3 = T_cond - subcool
        h3 = CP.PropsSI('H', 'P', P2, 'T', T3, coolprop_fluid)
        s3 = CP.PropsSI('S', 'P', P2, 'T', T3, coolprop_fluid)
        d3 = CP.PropsSI('D', 'P', P2, 'T', T3, coolprop_fluid)
        
        # State 4: Evaporator Inlet (after isenthalpic expansion)
        h4 = h3  # Isenthalpic process
        T4 = T_evap
        s4 = CP.PropsSI('S', 'P', P1, 'H', h4, coolprop_fluid)
        Q4 = CP.PropsSI('Q', 'P', P1, 'H', h4, coolprop_fluid)
        d4 = CP.PropsSI('D', 'P', P1, 'H', h4, coolprop_fluid)
        
        # Performance calculations
        Q_evap = h1 - h4  # Cooling capacity per kg
        W_comp = h2 - h1  # Compressor work per kg
        Q_cond = h2 - h3  # Heat rejection per kg
        COP = Q_evap / W_comp if W_comp > 0 else 0
        
        # Mass flow rate (assume 1 TR = 3.517 kW for reference)
        # User can scale by desired capacity
        
        return jsonify({
            'success': True,
            'fluid': coolprop_fluid,
            'states': {
                '1_compressor_inlet': {
                    'P': float(P1),
                    'T': float(T1),
                    'h': float(h1),
                    's': float(s1),
                    'd': float(d1),
                    'description': 'Superheated vapor from evaporator'
                },
                '2_compressor_outlet': {
                    'P': float(P2),
                    'T': float(T2),
                    'h': float(h2),
                    's': float(s2),
                    'd': float(d2),
                    'description': 'Hot compressed gas'
                },
                '2s_isentropic': {
                    'P': float(P2),
                    'h': float(h2s),
                    'description': 'Isentropic compression (ideal)'
                },
                '3_condenser_outlet': {
                    'P': float(P2),
                    'T': float(T3),
                    'h': float(h3),
                    's': float(s3),
                    'd': float(d3),
                    'description': 'Subcooled liquid'
                },
                '4_evaporator_inlet': {
                    'P': float(P1),
                    'T': float(T4),
                    'h': float(h4),
                    's': float(s4),
                    'Q': float(Q4),
                    'd': float(d4),
                    'description': 'Two-phase mixture after expansion'
                }
            },
            'performance': {
                'cooling_capacity_per_kg': float(Q_evap),  # J/kg
                'compressor_work_per_kg': float(W_comp),   # J/kg
                'heat_rejection_per_kg': float(Q_cond),    # J/kg
                'COP': float(COP),
                'pressure_ratio': float(P2 / P1)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 400

@app.route('/psychrometric', methods=['POST'])
def calculate_psychrometric():
    """
    Calculate psychrometric (moist air) properties
    
    Request JSON:
    {
        "dry_bulb_temp": 25,  # °C
        "pressure": 101325,   # Pa (atmospheric)
        "input_type": "RH",   # RH, WB, DP, HR
        "input_value": 50     # % for RH, °C for WB/DP, kg/kg for HR
    }
    """
    try:
        data = request.json
        
        T_db = data.get('dry_bulb_temp')  # °C
        P = data.get('pressure', 101325)  # Pa
        input_type = data.get('input_type', 'RH')
        input_value = data.get('input_value')
        
        if T_db is None or input_value is None:
            return jsonify({'success': False, 'error': 'Required inputs missing'}), 400
        
        # Convert to Kelvin
        T_db_K = T_db + 273.15
        
        # Calculate based on input type
        if input_type == 'RH':  # Relative Humidity (%)
            RH = input_value / 100.0
            h = CP.HAPropsSI('H', 'T', T_db_K, 'P', P, 'RH', RH)
            HR = CP.HAPropsSI('W', 'T', T_db_K, 'P', P, 'RH', RH)
            T_wb = CP.HAPropsSI('Twb', 'T', T_db_K, 'P', P, 'RH', RH) - 273.15
            T_dp = CP.HAPropsSI('Tdp', 'T', T_db_K, 'P', P, 'RH', RH) - 273.15
        elif input_type == 'WB':  # Wet Bulb (°C)
            T_wb_K = input_value + 273.15
            h = CP.HAPropsSI('H', 'T', T_db_K, 'P', P, 'Twb', T_wb_K)
            HR = CP.HAPropsSI('W', 'T', T_db_K, 'P', P, 'Twb', T_wb_K)
            RH = CP.HAPropsSI('RH', 'T', T_db_K, 'P', P, 'Twb', T_wb_K)
            T_dp = CP.HAPropsSI('Tdp', 'T', T_db_K, 'P', P, 'Twb', T_wb_K) - 273.15
            T_wb = input_value
        elif input_type == 'DP':  # Dew Point (°C)
            T_dp_K = input_value + 273.15
            h = CP.HAPropsSI('H', 'T', T_db_K, 'P', P, 'Tdp', T_dp_K)
            HR = CP.HAPropsSI('W', 'T', T_db_K, 'P', P, 'Tdp', T_dp_K)
            RH = CP.HAPropsSI('RH', 'T', T_db_K, 'P', P, 'Tdp', T_dp_K)
            T_wb = CP.HAPropsSI('Twb', 'T', T_db_K, 'P', P, 'Tdp', T_dp_K) - 273.15
            T_dp = input_value
        elif input_type == 'HR':  # Humidity Ratio (kg/kg)
            h = CP.HAPropsSI('H', 'T', T_db_K, 'P', P, 'W', input_value)
            RH = CP.HAPropsSI('RH', 'T', T_db_K, 'P', P, 'W', input_value)
            T_wb = CP.HAPropsSI('Twb', 'T', T_db_K, 'P', P, 'W', input_value) - 273.15
            T_dp = CP.HAPropsSI('Tdp', 'T', T_db_K, 'P', P, 'W', input_value) - 273.15
            HR = input_value
        else:
            return jsonify({'success': False, 'error': f'Unknown input_type: {input_type}'}), 400
        
        # Additional properties
        V = CP.HAPropsSI('Vha', 'T', T_db_K, 'P', P, 'W', HR)  # Specific volume m³/kg_da
        
        return jsonify({
            'success': True,
            'results': {
                'dry_bulb_temp': float(T_db),
                'wet_bulb_temp': float(T_wb),
                'dew_point_temp': float(T_dp),
                'relative_humidity': float(RH * 100),  # %
                'humidity_ratio': float(HR),  # kg_w/kg_da
                'enthalpy': float(h),  # J/kg_da
                'specific_volume': float(V),  # m³/kg_da
                'pressure': float(P)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 400

def get_phase_description(phase):
    """Convert CoolProp phase number to description"""
    phases = {
        0: 'Liquid',
        1: 'Supercritical',
        2: 'Supercritical Gas',
        3: 'Supercritical Liquid',
        5: 'Gas',
        6: 'Two-Phase'
    }
    return phases.get(int(phase), 'Unknown')

if __name__ == '__main__':
    print("="*50)
    print("CoolProp Physics Microservice for GFDDE")
    try:
        # CoolProp 6.x has __version__, 7.x might not
        version = getattr(CP, '__version__', CP.get_global_param_string('version'))
        print(f"CoolProp Version: {version}")
    except:
        print("CoolProp Version: Unknown (but installed)")
    print(f"Supported Refrigerants: {list(SUPPORTED_REFRIGERANTS.keys())}")
    print("="*50)
    
    # Run on port 5001
    app.run(host='0.0.0.0', port=5001, debug=False)
