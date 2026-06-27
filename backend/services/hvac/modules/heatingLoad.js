// Heating load calculation per spec
const { transmission_Q_W } = require('./envelope');

function heatingNet_W({ transmission_W, infiltration_W, internalGains_W }) {
  return transmission_W + infiltration_W - internalGains_W;
}

function withSafety_W(value_W, margin = 0.15) {
  return value_W * (1 + margin);
}

module.exports = { transmission_Q_W, heatingNet_W, withSafety_W };
