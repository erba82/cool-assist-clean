"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFiniteEquipmentVector3 = exports.assertEquipmentFiniteNonNegative = exports.assertEquipmentFinitePositive = void 0;
const assertEquipmentFinitePositive = (value, label) => {
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${label} must be a finite, positive number.`);
    }
    return value;
};
exports.assertEquipmentFinitePositive = assertEquipmentFinitePositive;
const assertEquipmentFiniteNonNegative = (value, label) => {
    if (!Number.isFinite(value) || value < 0) {
        throw new Error(`${label} must be a finite, non-negative number.`);
    }
    return value;
};
exports.assertEquipmentFiniteNonNegative = assertEquipmentFiniteNonNegative;
const isFiniteEquipmentVector3 = (value) => Array.isArray(value) && value.length === 3 && value.every((n) => typeof n === 'number' && Number.isFinite(n));
exports.isFiniteEquipmentVector3 = isFiniteEquipmentVector3;
