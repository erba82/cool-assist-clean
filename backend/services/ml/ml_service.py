"""
ML Component Sizing Service - Flask API
Production-grade ML service for equipment sizing
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load models at startup
MODEL_DIR = 'models'
models = {}
scaler = None
encoders = None
metadata = None

def load_models():
    """Load all trained models"""
    global models, scaler, encoders, metadata
    
    print("Loading ML models...")
    
    try:
        models['capacity'] = joblib.load(os.path.join(MODEL_DIR, 'capacity_predictor_v1.pkl'))
        models['equipment'] = joblib.load(os.path.join(MODEL_DIR, 'equipment_classifier_v1.pkl'))
        models['power'] = joblib.load(os.path.join(MODEL_DIR, 'power_predictor_v1.pkl'))
        scaler = joblib.load(os.path.join(MODEL_DIR, 'scaler_v1.pkl'))
        encoders = joblib.load(os.path.join(MODEL_DIR, 'encoders_v1.pkl'))
        
        import json
        with open(os.path.join(MODEL_DIR, 'metadata_v1.json'), 'r') as f:
            metadata = json.load(f)
        
        print("✅ Models loaded successfully")
        print(f"   Capacity Predictor: R²={metadata['capacity_predictor']['test_r2']:.3f}")
        print(f"   Equipment Classifier: Acc={metadata['equipment_classifier']['test_accuracy']:.3f}")
        print(f"   Power Predictor: R²={metadata['power_predictor']['test_r2']:.3f}")
        
        return True
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        return False

# Load models on startup
if not load_models():
    print("Warning: Models not loaded. Service will not be fully functional.")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ML Component Sizing',
        'version': '1.0.0',
        'models_loaded': len(models) > 0,
        'models': list(models.keys()),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict/compressor', methods=['POST'])
def predict_compressor():
    """
    Predict compressor sizing
    
    Request:
    {
        "cooling_capacity": 150,
        "evap_temp": -10,
        "cond_temp": 40,
        "refrigerant": "R717",
        "application": "cold_storage",
        "cop": 3.22,
        "pressure_ratio": 5.35
    }
    """
    try:
        data = request.json
        
        # Extract features
        features = extract_features(data)
        
        # Predict capacity
        capacity_pred = models['capacity'].predict(features)[0]
        
        # Predict equipment type
        equipment_type = models['equipment'].predict(features)[0]
        equipment_proba = models['equipment'].predict_proba(features)[0]
        confidence = float(np.max(equipment_proba))
        
        # Predict power
        power_pred = models['power'].predict(features)[0]
        
        # Get recommended equipment
        recommendations = get_equipment_recommendations(
            capacity_pred,
            power_pred,
            equipment_type,
            data.get('refrigerant', 'R717')
        )
        
        return jsonify({
            'success': True,
            'predicted_capacity': float(capacity_pred),
            'predicted_power': float(power_pred),
            'equipment_type': equipment_type,
            'confidence': confidence,
            'recommendations': recommendations,
            'metadata': {
                'model_version': 'v1',
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/predict/system', methods=['POST'])
def predict_system():
    """
    Predict complete system sizing
    
    Request: Same as /predict/compressor
    
    Response: Compressor + Condenser + Evaporators
    """
    try:
        data = request.json
        
        # Predict compressor
        comp_result = predict_compressor().get_json()
        
        if not comp_result['success']:
            return jsonify(comp_result), 400
        
        # Calculate heat rejection
        cooling_capacity = data.get('cooling_capacity', 150)
        comp_power = comp_result['predicted_power']
        heat_rejection = cooling_capacity + comp_power
        
        # Estimate condenser
        condenser_capacity = heat_rejection * 1.15  # 15% safety
        
        # Estimate evaporators
        evap_count = 2 if cooling_capacity < 200 else 3
        evap_capacity_each = cooling_capacity / evap_count
        
        return jsonify({
            'success': True,
            'compressor': comp_result,
            'condenser': {
                'required_capacity': float(condenser_capacity),
                'heat_rejection': float(heat_rejection)
            },
            'evaporators': {
                'count': evap_count,
                'capacity_each': float(evap_capacity_each)
            },
            'metadata': {
                'model_version': 'v1',
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

def extract_features(data):
    """Extract and prepare features from request data"""
    # Calculate derived features if not provided
    if 'cop' not in data or 'pressure_ratio' not in data:
        # Simplified estimation if thermodynamic data not provided
        data['cop'] = 3.2
        data['pressure_ratio'] = 5.0
    
    if 'safety_factor' not in data:
        data['safety_factor'] = 1.15
    
    if 'mass_flow' not in data:
        # Estimate mass flow
        cooling_capacity = data.get('cooling_capacity', 100)
        cop = data.get('cop', 3.2)
        # Rough estimate: mass_flow ~ capacity / (cop * 100)
        data['mass_flow'] = cooling_capacity / (cop * 100)
    
    if 'displacement_required' not in data:
        # Estimate displacement
        data['displacement_required'] = data['mass_flow'] * 150  # Rough estimate
    
    if 'heat_rejection' not in data:
        cooling_capacity = data.get('cooling_capacity', 100)
        data['heat_rejection'] = cooling_capacity * 1.3  # Estimate
    
    # Encode categorical features
    refrigerant_encoded = encoders['refrigerant'].transform([data.get('refrigerant', 'R717')])[0]
    application_encoded = encoders['application'].transform([data.get('application', 'cold_storage')])[0]
    
    # Build feature vector
    feature_vector = [
        data.get('cooling_capacity', 100),
        data.get('evap_temp', -10),
        data.get('cond_temp', 40),
        data.get('cop', 3.2),
        data.get('pressure_ratio', 5.0),
        data.get('safety_factor', 1.15),
        data.get('mass_flow', 1.0),
        data.get('displacement_required', 150),
        data.get('heat_rejection', 130),
        refrigerant_encoded,
        application_encoded
    ]
    
    # Scale features
    feature_vector = np.array(feature_vector).reshape(1, -1)
    feature_vector_scaled = scaler.transform(feature_vector)
    
    return feature_vector_scaled

def get_equipment_recommendations(capacity, power, comp_type, refrigerant):
    """Get equipment recommendations from catalog"""
    # Simplified catalog (in production, query full database)
    catalog = {
        'screw': [
            {'model': 'BITZER-4NES-20Y', 'capacity': 50, 'power': 15.5},
            {'model': 'BITZER-6FE-35Y', 'capacity': 100, 'power': 29},
            {'model': 'BITZER-N320VLD', 'capacity': 150, 'power': 42},
            {'model': 'BITZER-S6H-25.2', 'capacity': 200, 'power': 55},
            {'model': 'BITZER-CSH8561-90', 'capacity': 300, 'power': 82},
        ],
        'reciprocating': [
            {'model': 'BITZER-4CC-9.2Y', 'capacity': 25, 'power': 8},
            {'model': 'BITZER-4DC-10.2Y', 'capacity': 40, 'power': 12},
        ]
    }
    
    candidates = catalog.get(comp_type, catalog['screw'])
    
    # Find best matches
    recommendations = []
    for comp in candidates:
        match_score = 1.0 - abs(comp['capacity'] - capacity) / capacity
        match_score = max(0, min(1, match_score))
        
        recommendations.append({
            'model': comp['model'],
            'capacity': comp['capacity'],
            'power': comp['power'],
            'match_score': float(match_score)
        })
    
    # Sort by match score
    recommendations.sort(key=lambda x: x['match_score'], reverse=True)
    
    return recommendations[:3]  # Top 3

if __name__ == '__main__':
    print("="*70)
    print("ML Component Sizing Service")
    print("="*70)
    print(f"Starting server on http://localhost:5002")
    print(f"Models: {list(models.keys())}")
    print("="*70)
    
    app.run(host='0.0.0.0', port=5002, debug=False)
