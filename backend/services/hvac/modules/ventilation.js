// Ventilation sizing per ASHRAE 62.1 simplified

function freshAir_L_s({ Vp_L_s_per_person, persons, Vz_L_s_per_m2, area_m2 }) {
  return Vp_L_s_per_person * persons + Vz_L_s_per_m2 * area_m2;
}

function supplyReturnExhaust({ freshAir_m3_h, supplyRatio = 1.0, returnRatio = 0.75, exhaustRatio = 0.25 }) {
  const SA = freshAir_m3_h * (1 / exhaustRatio); // assuming OA = EA
  const RA = SA * returnRatio;
  const EA = SA * exhaustRatio;
  return { SA_m3_h: SA, RA_m3_h: RA, EA_m3_h: EA };
}

module.exports = { freshAir_L_s, supplyReturnExhaust };
