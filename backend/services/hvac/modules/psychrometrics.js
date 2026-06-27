// Psychrometric helpers: humidity ratio, enthalpy, saturation pressure approximations
// Simplified but accurate-enough formulas for design calcs. Units: SI

const P_ATM = 101325; // Pa

function saturationPressure_Pa(T_c) {
  // Tetens equation (approx) for 0..50C
  const T = T_c + 273.15;
  const C1 = -5.6745359e3;
  const C2 = 6.3925247;
  const C3 = -9.677843e-3;
  const C4 = 0.62215701;
  // Use simple Magnus for stability
  const a = 17.625;
  const b = 243.04; // C
  const psat_hPa = 6.1094 * Math.exp((a * T_c) / (T_c + b));
  return psat_hPa * 100;
}

function humidityRatio_from_T_RH(T_c, RH, P = P_ATM) {
  const psat = saturationPressure_Pa(T_c);
  const pv = RH * psat;
  return 0.622 * (pv / (P - pv));
}

function moistAirEnthalpy_kJkg(T_c, W) {
  // h = 1.006*T + W*(2501 + 1.86*T) in kJ/kg dry air
  return 1.006 * T_c + W * (2501 + 1.86 * T_c);
}

module.exports = {
  P_ATM,
  saturationPressure_Pa,
  humidityRatio_from_T_RH,
  moistAirEnthalpy_kJkg,
};
