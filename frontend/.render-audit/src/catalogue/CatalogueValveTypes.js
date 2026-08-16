"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFiniteVector3 = exports.assertValveFinitePositive = exports.assertValveFiniteNonNegative = void 0;
const assertValveFiniteNonNegative = (value, label) => {
    if (!Number.isFinite(value) || value < 0) {
        throw new Error(`${label} must be a finite, non-negative number.`);
    }
    return value;
};
exports.assertValveFiniteNonNegative = assertValveFiniteNonNegative;
const assertValveFinitePositive = (value, label) => {
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${label} must be a finite, positive number.`);
    }
    return value;
};
exports.assertValveFinitePositive = assertValveFinitePositive;
const isFiniteVector3 = (value) => value !== null && value.every((component) => Number.isFinite(component));
exports.isFiniteVector3 = isFiniteVector3;
