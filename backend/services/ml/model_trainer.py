"""
ML Model Trainer for Component Sizing
Trains RandomForest, SVM, and GradientBoosting models
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import mean_absolute_percentage_error, r2_score, classification_report, accuracy_score
import joblib
import os
import json
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns

class ModelTrainer:
    """
    Trains and evaluates ML models for component sizing
    """
    
    def __init__(self, data_path='data/training_data.csv'):
        self.data_path = data_path
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.metadata = {}
        
        # Load data
        print(f"Loading training data from {data_path}...")
        self.df = pd.read_csv(data_path)
        print(f"✅ Loaded {len(self.df)} samples")
        print(f"   Features: {self.df.columns.tolist()}")
        
    def prepare_features(self):
        """Prepare features for training"""
        print("\nPreparing features...")
        
        # Define feature columns
        self.feature_cols = [
            'cooling_capacity', 'evap_temp', 'cond_temp',
            'cop', 'pressure_ratio', 'safety_factor',
            'mass_flow', 'displacement_required', 'heat_rejection'
        ]
        
        # Categorical features
        self.cat_features = ['refrigerant', 'application']
        
        # Label encode categorical features
        for col in self.cat_features:
            le = LabelEncoder()
            self.df[f'{col}_encoded'] = le.fit_transform(self.df[col])
            self.encoders[col] = le
            self.feature_cols.append(f'{col}_encoded')
        
        # Extract features
        self.X = self.df[self.feature_cols].copy()
        
        # Scale features
        self.scaler = StandardScaler()
        self.X_scaled = self.scaler.fit_transform(self.X)
        self.X_scaled = pd.DataFrame(self.X_scaled, columns=self.feature_cols)
        
        print(f"✅ Features prepared: {len(self.feature_cols)} columns")
        print(f"   Numerical: {len(self.feature_cols) - len(self.cat_features)}")
        print(f"   Categorical (encoded): {len(self.cat_features)}")
        
    def train_capacity_predictor(self):
        """Train RandomForest for compressor capacity prediction"""
        print("\n" + "="*70)
        print("Training Model 1: Compressor Capacity Predictor (RandomForest)")
        print("="*70)
        
        # Target variable
        y = self.df['compressor_capacity']
        
        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            self.X_scaled, y, test_size=0.2, random_state=42
        )
        
        # Train RandomForest
        print("Training RandomForestRegressor...")
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred_train = model.predict(X_train)
        y_pred_test = model.predict(X_test)
        
        train_r2 = r2_score(y_train, y_pred_train)
        test_r2 = r2_score(y_test, y_pred_test)
        train_mape = mean_absolute_percentage_error(y_train, y_pred_train) * 100
        test_mape = mean_absolute_percentage_error(y_test, y_pred_test) * 100
        
        print(f"\n📊 Performance:")
        print(f"   Training R²: {train_r2:.4f}")
        print(f"   Test R²: {test_r2:.4f}")
        print(f"   Training MAPE: {train_mape:.2f}%")
        print(f"   Test MAPE: {test_mape:.2f}%")
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_cols,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print(f"\n🔍 Top 5 Important Features:")
        for idx, row in feature_importance.head().iterrows():
            print(f"   {row['feature']}: {row['importance']:.4f}")
        
        # Save model
        self.models['capacity_predictor'] = model
        self.metadata['capacity_predictor'] = {
            'type': 'RandomForestRegressor',
            'train_r2': float(train_r2),
            'test_r2': float(test_r2),
            'train_mape': float(train_mape),
            'test_mape': float(test_mape),
            'n_samples_train': len(X_train),
            'n_samples_test': len(X_test),
            'feature_importance': feature_importance.to_dict('records')
        }
        
        print(f"✅ Model trained successfully")
        return model
    
    def train_equipment_classifier(self):
        """Train SVM for equipment type classification"""
        print("\n" + "="*70)
        print("Training Model 2: Equipment Type Classifier (SVM)")
        print("="*70)
        
        # Target variable
        y = self.df['compressor_type']
        
        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            self.X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train SVM
        print("Training SVC...")
        model = SVC(
            kernel='rbf',
            C=10.0,
            gamma='scale',
            probability=True,
            random_state=42
        )
        
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred_train = model.predict(X_train)
        y_pred_test = model.predict(X_test)
        
        train_acc = accuracy_score(y_train, y_pred_train)
        test_acc = accuracy_score(y_test, y_pred_test)
        
        print(f"\n📊 Performance:")
        print(f"   Training Accuracy: {train_acc:.4f}")
        print(f"   Test Accuracy: {test_acc:.4f}")
        
        print(f"\n📋 Classification Report:")
        print(classification_report(y_test, y_pred_test))
        
        # Save model
        self.models['equipment_classifier'] = model
        self.metadata['equipment_classifier'] = {
            'type': 'SVC',
            'train_accuracy': float(train_acc),
            'test_accuracy': float(test_acc),
            'n_samples_train': len(X_train),
            'n_samples_test': len(X_test),
            'classes': model.classes_.tolist()
        }
        
        print(f"✅ Model trained successfully")
        return model
    
    def train_power_predictor(self):
        """Train GradientBoosting for power consumption prediction"""
        print("\n" + "="*70)
        print("Training Model 3: Power Consumption Predictor (GradientBoosting)")
        print("="*70)
        
        # Target variable
        y = self.df['compressor_power']
        
        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            self.X_scaled, y, test_size=0.2, random_state=42
        )
        
        # Train GradientBoosting
        print("Training GradientBoostingRegressor...")
        model = GradientBoostingRegressor(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=5,
            min_samples_split=5,
            random_state=42
        )
        
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred_train = model.predict(X_train)
        y_pred_test = model.predict(X_test)
        
        train_r2 = r2_score(y_train, y_pred_train)
        test_r2 = r2_score(y_test, y_pred_test)
        train_mape = mean_absolute_percentage_error(y_train, y_pred_train) * 100
        test_mape = mean_absolute_percentage_error(y_test, y_pred_test) * 100
        
        print(f"\n📊 Performance:")
        print(f"   Training R²: {train_r2:.4f}")
        print(f"   Test R²: {test_r2:.4f}")
        print(f"   Training MAPE: {train_mape:.2f}%")
        print(f"   Test MAPE: {test_mape:.2f}%")
        
        # Save model
        self.models['power_predictor'] = model
        self.metadata['power_predictor'] = {
            'type': 'GradientBoostingRegressor',
            'train_r2': float(train_r2),
            'test_r2': float(test_r2),
            'train_mape': float(train_mape),
            'test_mape': float(test_mape),
            'n_samples_train': len(X_train),
            'n_samples_test': len(X_test)
        }
        
        print(f"✅ Model trained successfully")
        return model
    
    def save_models(self, output_dir='models'):
        """Save all trained models"""
        print("\n" + "="*70)
        print("Saving Models")
        print("="*70)
        
        os.makedirs(output_dir, exist_ok=True)
        
        # Save models
        for name, model in self.models.items():
            path = os.path.join(output_dir, f'{name}_v1.pkl')
            joblib.dump(model, path)
            print(f"✅ Saved {name} to {path}")
        
        # Save scaler
        scaler_path = os.path.join(output_dir, 'scaler_v1.pkl')
        joblib.dump(self.scaler, scaler_path)
        print(f"✅ Saved scaler to {scaler_path}")
        
        # Save encoders
        encoders_path = os.path.join(output_dir, 'encoders_v1.pkl')
        joblib.dump(self.encoders, encoders_path)
        print(f"✅ Saved encoders to {encoders_path}")
        
        # Save metadata
        self.metadata['training_date'] = datetime.now().isoformat()
        self.metadata['n_samples'] = len(self.df)
        self.metadata['feature_cols'] = self.feature_cols
        
        metadata_path = os.path.join(output_dir, 'metadata_v1.json')
        with open(metadata_path, 'w') as f:
            json.dump(self.metadata, f, indent=2)
        print(f"✅ Saved metadata to {metadata_path}")
        
    def train_all(self):
        """Train all models"""
        print("\n" + "="*70)
        print("ML Model Training Pipeline")
        print("="*70)
        
        self.prepare_features()
        self.train_capacity_predictor()
        self.train_equipment_classifier()
        self.train_power_predictor()
        self.save_models()
        
        print("\n" + "="*70)
        print("🎉 TRAINING COMPLETE!")
        print("="*70)
        print(f"\n📊 Summary:")
        print(f"   Models trained: {len(self.models)}")
        print(f"   Training samples: {len(self.df)}")
        print(f"   Features used: {len(self.feature_cols)}")
        
        print(f"\n📈 Performance:")
        for name, meta in self.metadata.items():
            if name == 'capacity_predictor':
                print(f"   {name}: R²={meta['test_r2']:.3f}, MAPE={meta['test_mape']:.1f}%")
            elif name == 'equipment_classifier':
                print(f"   {name}: Accuracy={meta['test_accuracy']:.3f}")
            elif name == 'power_predictor':
                print(f"   {name}: R²={meta['test_r2']:.3f}, MAPE={meta['test_mape']:.1f}%")

if __name__ == '__main__':
    import sys
    
    data_file = 'data/training_data.csv'
    if len(sys.argv) > 1:
        data_file = sys.argv[1]
    
    trainer = ModelTrainer(data_file)
    trainer.train_all()
