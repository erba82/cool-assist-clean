// Control strategies: basic structures to include in notebook output

function basicPID() {
  return {
    type: 'PID',
    description: 'Proportional-Integral-Derivative control for stable temperature with minimal overshoot.',
    parameters: { Kp: 'auto-tuned', Ki: 'auto-tuned', Kd: 'auto-tuned' },
  };
}

module.exports = { basicPID };
