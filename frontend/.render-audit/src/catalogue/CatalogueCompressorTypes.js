"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertDimensionVector = exports.assertFinitePositive = void 0;
const assertFinitePositive = (value, label) => {
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${label} must be a finite, positive number.`);
    }
    return value;
};
exports.assertFinitePositive = assertFinitePositive;
const assertDimensionVector = (value) => {
    value.forEach((component, index) => (0, exports.assertFinitePositive)(component, `dimension[${index}]`));
    return value;
};
exports.assertDimensionVector = assertDimensionVector;
