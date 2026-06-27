const express = require('express');
const router = express.Router();
const hvac = require('../../services/hvac');

// Simple in-memory session store
const sessions = new Map();

router.post('/session', (req, res) => {
  const id = Math.random().toString(36).slice(2);
  sessions.set(id, { id, inputs: {}, createdAt: Date.now() });
  res.json({ sessionId: id });
});

router.post('/inputs', (req, res) => {
  const { sessionId, inputs } = req.body || {};
  if (!sessionId || !sessions.has(sessionId)) return res.status(400).json({ error: 'invalid session' });
  const s = sessions.get(sessionId);
  s.inputs = { ...s.inputs, ...inputs };
  res.json({ ok: true, inputs: s.inputs });
});

router.post('/calculate', async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    const s = sessions.get(sessionId);
    if (!s) return res.status(400).json({ error: 'invalid session' });

    const inputs = s.inputs;

    // 1) Climate
    const climate = await hvac.climate.getDesignData(inputs.location || {});

    // 2) Psychrometrics
    const W_out = hvac.psychro.humidityRatio_from_T_RH(climate.summer.db_c, climate.summer.rh);
    const W_in = hvac.psychro.humidityRatio_from_T_RH(inputs.indoor?.temp_C ?? 24, inputs.indoor?.rh ?? 0.5);

    // 3) Envelope transmission
    const dT = (climate.summer.db_c - (inputs.indoor?.temp_C ?? 24));
    const walls_W = hvac.cooling.transmission_Q_W({ U_W_m2K: inputs.envelope?.U_wall ?? 0.24, area_m2: inputs.envelope?.A_wall_m2 ?? 200, deltaT_K: dT });
    const roofTeq = hvac.cooling.roofSolarEquivalent({ T_outdoor_C: climate.summer.db_c, solar_W_m2: climate.solar_w_m2, absorptance: inputs.envelope?.roofAbs ?? 0.6, h_o: 25 });
    const roof_dT = roofTeq - (inputs.indoor?.temp_C ?? 24);
    const roof_W = hvac.cooling.transmission_Q_W({ U_W_m2K: inputs.envelope?.U_roof ?? 0.2, area_m2: inputs.envelope?.A_roof_m2 ?? 150, deltaT_K: roof_dT });
    const floor_W = hvac.cooling.transmission_Q_W({ U_W_m2K: inputs.envelope?.U_floor ?? 0.18, area_m2: inputs.envelope?.A_floor_m2 ?? 150, deltaT_K: dT * 0.8 });

    // 4) Infiltration
    const infil_W = hvac.cooling.infiltration_W({ ACH: inputs.envelope?.ACH ?? 0.5, volume_m3: inputs.envelope?.volume_m3 ?? 1000, deltaT_K: dT });

    // 5) Internal gains
    const people_W = hvac.gains.occupancySensible_W({ count: inputs.occupancy?.count ?? 20, activity: inputs.occupancy?.activity || 'office' });
    const lighting_W = hvac.gains.lighting_W({ area_m2: inputs.area_m2 ?? 500, power_W_m2: inputs.lighting?.W_m2 ?? 2, load_factor: inputs.lighting?.load_factor ?? 0.7, heat_factor: inputs.lighting?.heat_factor ?? 0.9 });
    const equipment_W = hvac.gains.equipment_W({ area_m2: inputs.area_m2 ?? 500, density_W_m2: inputs.equipment?.W_m2 ?? 10, load_factor: inputs.equipment?.load_factor ?? 0.7, conversion: inputs.equipment?.conversion ?? 0.85 });

    const sensible_W = hvac.cooling.sensibleTotal_W({ walls_W, roof_W, floor_W, infil_W, people_W, lighting_W, equipment_W });

    // 6) Latent load (estimate or compute with outdoor air mass flow)
    const V_oa_L_s = (inputs.ventilation?.V_oa_L_s) ?? ((inputs.occupancy?.count ?? 20) * 2.5 + (inputs.area_m2 ?? 500) * 0.3);
    const m_dot = (V_oa_L_s / 1000) * 1.2; // kg/s
    const latent_W = hvac.cooling.latent_W({ m_dot_kg_s: m_dot, W_outdoor: W_out, W_indoor: W_in });

    const designCooling_W = hvac.cooling.totalWithMargin_W({ sensible_W, latent_W, margin: 0.15 });

    // 7) Heating load (winter)
    const dT_w = (inputs.indoor?.winter_C ?? 22) - (climate.winter.db_c);
    const walls_w_W = hvac.heating.transmission_Q_W({ U_W_m2K: inputs.envelope?.U_wall ?? 0.24, area_m2: inputs.envelope?.A_wall_m2 ?? 200, deltaT_K: dT_w });
    const roof_w_W = hvac.heating.transmission_Q_W({ U_W_m2K: inputs.envelope?.U_roof ?? 0.2, area_m2: inputs.envelope?.A_roof_m2 ?? 150, deltaT_K: dT_w });
    const floor_w_W = hvac.heating.transmission_Q_W({ U_W_m2K: inputs.envelope?.U_floor ?? 0.18, area_m2: inputs.envelope?.A_floor_m2 ?? 150, deltaT_K: dT_w * 0.8 });
    const infil_w_W = hvac.cooling.infiltration_W({ ACH: inputs.envelope?.ACH ?? 0.5, volume_m3: inputs.envelope?.volume_m3 ?? 1000, deltaT_K: dT_w });
    const internal_w_W = sensible_W * 0.4; // 40% of summer gains
    const heat_net_W = hvac.heating.heatingNet_W({ transmission_W: walls_w_W + roof_w_W + floor_w_W, infiltration_W: infil_w_W, internalGains_W: internal_w_W });
    const designHeating_W = hvac.heating.withSafety_W(heat_net_W, 0.15);

    // 8) Refrigerants
    const refOptions = hvac.refrigerants.selectRefrigerants({ location: inputs.location || {}, preferEfficiency: true, safetyPreference: inputs.safetyPreference || 'A' });

    // 9) Equipment sizing
    const condenser = hvac.equipment.condenserDesign_W({ Q_evap_W: designCooling_W, COP_nominal: 3.2 });
    const compressor = hvac.equipment.compressorSelection({ Q_evap_W: designCooling_W, refrigerantCode: refOptions[0]?.code || 'R410A' });
    const txv_kg_h = hvac.equipment.txvMassFlow_kg_h({ Q_evap_W: designCooling_W });

    // 10) Ventilation and ducts
    const V_oa = V_oa_L_s;
    const ductsOut = { mainDuctDiameter_m: require('../../services/hvac/modules/ducts').diameter_m({ flow_L_s: V_oa, velocity_m_s: 6.5 }) };

    const result = {
      climate,
      psychrometrics: { W_outdoor: W_out, W_indoor: W_in },
      loads: {
        parts_W: { walls_W, roof_W, floor_W, infil_W, people_W, lighting_W, equipment_W, latent_W },
        sensible_W,
        designCooling_W,
        designHeating_W,
      },
      refrigerants: refOptions,
      equipment: { condenser, compressor, txv_kg_h },
      ventilation: { V_oa_L_s: V_oa },
      ducts: ductsOut,
    };

    const book = hvac.notebook.assembleNotebook({
      project: { name: inputs.projectName, location: inputs.location },
      inputs,
      climate,
      loads: result.loads,
      equipment: result.equipment,
      ventilation: result.ventilation,
      ducts: result.ducts,
      refrigerants: result.refrigerants,
      controls: { basic: hvac.controls.basicPID() },
      scenarios: inputs.scenarios || [],
    });

    s.result = { ...result, notebook: book };

    res.json(s.result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'calculation-failed', message: e.message });
  }
});

router.get('/notebook/:sessionId', (req, res) => {
  const id = req.params.sessionId;
  const s = sessions.get(id);
  if (!s || !s.result) return res.status(404).json({ error: 'not-found' });
  res.json(s.result.notebook);
});

module.exports = router;
