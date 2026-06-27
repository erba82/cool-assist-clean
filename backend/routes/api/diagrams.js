const express = require('express');
const router = express.Router();
const svg = require('../../services/diagram/svgRenderer');

// POST /api/diagrams/render
// body: { calc: {...} } where calc maps calculation+equipment selection to diagram struct
router.post('/render', (req, res) => {
  try {
    const { calc } = req.body || {};
    if (!calc) return res.status(400).json({ error: 'calc payload is required' });
    const out = svg.buildFromCalculation(calc);
    return res.json(out);
  } catch (e) {
    console.error('diagram render error:', e);
    return res.status(500).json({ error: 'render-failed', message: e.message });
  }
});

module.exports = router;
