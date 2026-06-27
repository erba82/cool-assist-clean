"""
Training Data Generator for ML Component Sizing
Generates synthetic but thermodynamically-valid training data
"""

import numpy as np
import pandas as pd
from CoolProp.CoolProp import PropsSI
import json
from datetime import datetime
import os

class TrainingDataGenerator:
    """
    Generates high-quality training data for ML models
    Uses CoolProp for thermodynamic validation
    """
    
    def __init__(self):
        self.equipment_catalog = self._load_equipment_catalog()
        self.refrigerants = ['R717', 'R22', 'R410A', 'R32', 'R134a', 'R744']
        self.applications = ['cold_storage', 'process_cooling', 'ice_making', 'blast_freezing', 'hvac']
        
    def _load_equipment_catalog(self):
        """Load real equipment specifications"""
        return {
            'compressors': {
                'screw': [
                    {'model': 'BITZER-4NES-20Y', 'displacement': 134, 'capacity_range': [40, 60], 'power_range': [12, 18], 'refrigerants': ['R717']},
                    {'model': 'BITZER-6FE-35Y', 'displacement': 232, 'capacity_range': [80, 120], 'power_range': [25, 35], 'refrigerants': ['R717']},
                    {'model': 'BITZER-N320VLD', 'displacement': 320, 'capacity_range': [120, 180], 'power_range': [35, 50], 'refrigerants': ['R717']},
                    {'model': 'BITZER-S6H-25.2', 'displacement': 418, 'capacity_range': [150, 230], 'power_range': [45, 65], 'refrigerants': ['R717']},
                    {'model': 'BITZER-CSH8561-90', 'displacement': 856, 'capacity_range': [250, 350], 'power_range': [70, 95], 'refrigerants': ['R717']},
                    {'model': 'BITZER-CSH9563-160', 'displacement': 1417, 'capacity_range': [400, 600], 'power_range': [110, 160], 'refrigerants': ['R717']},
                    # R410A compressors
                    {'model': 'COPELAND-ZP31K5E', 'displacement': 31, 'capacity_range': [25, 35], 'power_range': [8, 12], 'refrigerants': ['R410A', 'R32']},
                    {'model': 'COPELAND-ZP61K5E', 'displacement': 61, 'capacity_range': [45, 65], 'power_range': [15, 22], 'refrigerants': ['R410A', 'R32']},
                    {'model': 'COPELAND-ZP91K5E', 'displacement': 91, 'capacity_range': [65, 95], 'power_range': [22, 32], 'refrigerants': ['R410A', 'R32']},
                ],
                'reciprocating': [
                    {'model': 'BITZER-4CC-9.2Y', 'displacement': 48, 'capacity_range': [20, 30], 'power_range': [6, 10], 'refrigerants': ['R717']},
                    {'model': 'BITZER-4DC-10.2Y', 'displacement': 67, 'capacity_range': [30, 45], 'power_range': [10, 14], 'refrigerants': ['R717']},
                    {'model': 'BITZER-4EC-6.2Y', 'displacement': 103, 'capacity_range': [40, 60], 'power_range': [12, 18], 'refrigerants': ['R717']},
                ]
            },
            'condensers': {
                'evaporative': [
                    {'model': 'BAC-VXC-116', 'capacity_range': [80, 130], 'fans': 2, 'refrigerants': ['R717']},
                    {'model': 'BAC-VXC-292', 'capacity_range': [200, 300], 'fans': 3, 'refrigerants': ['R717']},
                    {'model': 'BAC-VXC-438', 'capacity_range': [350, 500], 'fans': 4, 'refrigerants': ['R717']},
                    {'model': 'BAC-VXC-584', 'capacity_range': [480, 650], 'fans': 5, 'refrigerants': ['R717']},
                ],
                'air_cooled': [
                    {'model': 'GUNTNER-GACV-060', 'capacity_range': [50, 80], 'fans': 2, 'refrigerants': ['R717', 'R410A', 'R134a']},
                    {'model': 'GUNTNER-GACV-120', 'capacity_range': [100, 150], 'fans': 4, 'refrigerants': ['R717', 'R410A', 'R134a']},
                    {'model': 'GUNTNER-GACV-180', 'capacity_range': [150, 220], 'fans': 6, 'refrigerants': ['R717', 'R410A', 'R134a']},
                    {'model': 'GUNTNER-GACV-240', 'capacity_range': [200, 300], 'fans': 8, 'refrigerants': ['R717', 'R410A', 'R134a']},
                ]
            },
            'evaporators': {
                'unit_cooler': [
                    {'model': 'OPTIGO-PLUS-20', 'capacity_range': [15, 25], 'fans': 2, 'defrost': 'electric'},
                    {'model': 'OPTIGO-PLUS-40', 'capacity_range': [30, 50], 'fans': 3, 'defrost': 'electric'},
                    {'model': 'OPTIGO-PLUS-60', 'capacity_range': [50, 75], 'fans': 4, 'defrost': 'hot_gas'},
                    {'model': 'OPTIGO-PLUS-100', 'capacity_range': [85, 120], 'fans': 6, 'defrost': 'hot_gas'},
                    {'model': 'OPTIGO-PLUS-150', 'capacity_range': [130, 180], 'fans': 8, 'defrost': 'hot_gas'},
                ]
            }
        }
    
    def calculate_thermodynamics(self, evap_temp, cond_temp, refrigerant='R717', superheat=5, subcool=3):
        """
        Calculate thermodynamic cycle using CoolProp
        Returns cycle data including COP, mass flow, etc.
        """
        try:
            # Convert to Kelvin
            T_evap = evap_temp + 273.15
            T_cond = cond_temp + 273.15
            
            # State points
            # 1: Evaporator exit (saturated + superheat)
            P1 = PropsSI('P', 'T', T_evap, 'Q', 1, refrigerant)
            T1 = T_evap + superheat
            h1 = PropsSI('H', 'T', T1, 'P', P1, refrigerant)
            s1 = PropsSI('S', 'T', T1, 'P', P1, refrigerant)
            rho1 = PropsSI('D', 'T', T1, 'P', P1, refrigerant)
            
            # 2: Compressor exit (isentropic)
            P2 = PropsSI('P', 'T', T_cond, 'Q', 1, refrigerant)
            h2s = PropsSI('H', 'P', P2, 'S', s1, refrigerant)
            
            # Assume isentropic efficiency of 0.75
            eta_is = 0.75
            h2 = h1 + (h2s - h1) / eta_is
            T2 = PropsSI('T', 'P', P2, 'H', h2, refrigerant) - 273.15
            
            # 3: Condenser exit (saturated liquid - subcool)
            T3 = T_cond - subcool
            h3 = PropsSI('H', 'T', T3, 'P', P2, refrigerant)
            
            # 4: Expansion valve exit
            h4 = h3  # Isenthalpic expansion
            
            # Performance calculations
            cooling_capacity_per_kg = (h1 - h4) / 1000  # kJ/kg
            compressor_work_per_kg = (h2 - h1) / 1000  # kJ/kg
            heat_rejection_per_kg = (h2 - h3) / 1000  # kJ/kg
            
            cop = cooling_capacity_per_kg / compressor_work_per_kg if compressor_work_per_kg > 0 else 0
            pressure_ratio = P2 / P1
            
            # Volumetric flow calculation
            # For 1 kg/s mass flow
            volumetric_flow = 1.0 / rho1 * 3600  # m³/h per kg/s
            
            return {
                'cop': cop,
                'pressure_ratio': pressure_ratio,
                'cooling_capacity_per_kg': cooling_capacity_per_kg,
                'compressor_work_per_kg': compressor_work_per_kg,
                'heat_rejection_per_kg': heat_rejection_per_kg,
                'discharge_temp': T2,
                'volumetric_flow': volumetric_flow,
                'evap_pressure': P1 / 1e5,  # bar
                'cond_pressure': P2 / 1e5,  # bar
            }
        except Exception as e:
            print(f"Thermodynamic calculation failed: {e}")
            return None
    
    def select_compressor(self, required_capacity, refrigerant, displacement_estimate, comp_type='screw'):
        """Select best matching compressor from catalog"""
        candidates = self.equipment_catalog['compressors'][comp_type]
        
        # Filter by refrigerant
        suitable = [c for c in candidates if refrigerant in c['refrigerants']]
        
        if not suitable:
            return None
        
        # Find best match by capacity
        best = None
        min_diff = float('inf')
        
        for comp in suitable:
            avg_capacity = np.mean(comp['capacity_range'])
            diff = abs(avg_capacity - required_capacity)
            if diff < min_diff:
                min_diff = diff
                best = comp
        
        return best
    
    def select_condenser(self, heat_rejection, refrigerant, cond_type='evaporative'):
        """Select condenser from catalog"""
        candidates = self.equipment_catalog['condensers'][cond_type]
        
        # Filter by refrigerant
        suitable = [c for c in candidates if refrigerant in c['refrigerants']]
        
        if not suitable:
            # Try alternative type
            alt_type = 'air_cooled' if cond_type == 'evaporative' else 'evaporative'
            candidates = self.equipment_catalog['condensers'][alt_type]
            suitable = [c for c in candidates if refrigerant in c['refrigerants']]
        
        if not suitable:
            return None
        
        # Find best match
        best = None
        min_diff = float('inf')
        
        for cond in suitable:
            avg_capacity = np.mean(cond['capacity_range'])
            diff = abs(avg_capacity - heat_rejection)
            if diff < min_diff:
                min_diff = diff
                best = cond
        
        return best
    
    def generate_sample(self):
        """Generate a single training sample"""
        # Random parameters
        cooling_capacity = np.random.uniform(20, 800)  # kW
        evap_temp = np.random.uniform(-40, 10)  # °C
        cond_temp = np.random.uniform(25, 50)  # °C
        refrigerant = np.random.choice(self.refrigerants)
        application = np.random.choice(self.applications)
        
        # Calculate thermodynamics
        thermo = self.calculate_thermodynamics(evap_temp, cond_temp, refrigerant)
        
        if not thermo:
            return None
        
        # Calculate required compressor capacity (with safety factor)
        safety_factor = np.random.uniform(1.10, 1.20)  # 10-20%
        required_comp_capacity = cooling_capacity * safety_factor
        
        # Calculate mass flow rate
        mass_flow = cooling_capacity / thermo['cooling_capacity_per_kg']  # kg/s
        
        # Calculate required displacement
        displacement_required = mass_flow * thermo['volumetric_flow']  # m³/h
        
        # Select equipment
        comp_type = 'screw' if cooling_capacity > 40 else 'reciprocating'
        compressor = self.select_compressor(required_comp_capacity, refrigerant, displacement_required, comp_type)
        
        if not compressor:
            return None
        
        # Calculate actual power
        actual_power = mass_flow * thermo['compressor_work_per_kg']
        
        # Heat rejection
        heat_rejection = cooling_capacity + actual_power
        heat_rejection_safety = heat_rejection * 1.15  # 15% safety
        
        # Select condenser
        cond_type = 'evaporative' if refrigerant == 'R717' else 'air_cooled'
        condenser = self.select_condenser(heat_rejection_safety, refrigerant, cond_type)
        
        if not condenser:
            return None
        
        # Evaporator selection (simplified)
        evap_count = int(np.random.choice([2, 3, 4]))
        capacity_per_evap = cooling_capacity / evap_count
        
        # Add realistic noise
        noise_factor = np.random.normal(1.0, 0.02)  # ±2% noise
        
        return {
            'features': {
                'cooling_capacity': cooling_capacity * noise_factor,
                'evap_temp': evap_temp,
                'cond_temp': cond_temp,
                'refrigerant': refrigerant,
                'application': application,
                'cop': thermo['cop'],
                'pressure_ratio': thermo['pressure_ratio'],
                'safety_factor': safety_factor,
                'mass_flow': mass_flow,
                'displacement_required': displacement_required,
            'heat_rejection': heat_rejection,
            },
            'labels': {
                'compressor_model': compressor['model'],
                'compressor_type': comp_type,
                'compressor_displacement': compressor['displacement'],
                'compressor_capacity': np.mean(compressor['capacity_range']),
                'compressor_power': np.mean(compressor['power_range']),
                'condenser_model': condenser['model'],
                'condenser_type': cond_type,
                'condenser_capacity': np.mean(condenser['capacity_range']),
                'evaporator_count': evap_count,
                'evaporator_capacity_each': capacity_per_evap,
            }
        }
    
    def generate_dataset(self, num_samples=10000, output_file='training_data.csv'):
        """Generate complete dataset"""
        print(f"Generating {num_samples} training samples...")
        
        samples = []
        failed = 0
        
        for i in range(num_samples + failed):
            if len(samples) >= num_samples:
                break
            
            if (i + 1) % 500 == 0:
                print(f"  Progress: {len(samples)}/{num_samples} ({len(samples)/num_samples*100:.1f}%)")
            
            sample = self.generate_sample()
            if sample:
                samples.append(sample)
            else:
                failed += 1
        
        print(f"\nGenerated {len(samples)} valid samples ({failed} failed)")
        
        # Convert to DataFrame
        df = self._samples_to_dataframe(samples)
        
        # Save to CSV
        output_path = os.path.join(os.path.dirname(__file__), 'data', output_file)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        df.to_csv(output_path, index=False)
        
        print(f"✅ Dataset saved to {output_path}")
        print(f"   Shape: {df.shape}")
        print(f"   Features: {list(df.columns[:12])}")
        
        return df
    
    def _samples_to_dataframe(self, samples):
        """Convert samples list to pandas DataFrame"""
        rows = []
        for sample in samples:
            row = {**sample['features'], **sample['labels']}
            rows.append(row)
        return pd.DataFrame(rows)

if __name__ == '__main__':
    print("=" * 70)
    print("ML Training Data Generator")
    print("=" * 70)
    
    generator = TrainingDataGenerator()
    df = generator.generate_dataset(num_samples=10000)
    
    print("\nDataset Statistics:")
    print(df.describe())
    
    print("\n✅ Training data generation complete!")
