const express = require('express');
const router = express.Router();
const enhancedCalculator = require('../services/EnhancedAmmoniaCalculator');
const AmmoniaDesignWizardService = require('../services/AmmoniaDesignWizardService');

// Calculate comprehensive design
router.post('/calculate-comprehensive', async (req, res) => {
    try {
        const projectData = req.body;

        if (!projectData || !projectData.rooms) {
            return res.status(400).json({ error: 'Invalid project data. Rooms are required.' });
        }

        const result = await enhancedCalculator.calculateProject(projectData);

        res.json(result);
    } catch (error) {
        console.error('Calculation Error:', error);
        res.status(500).json({ error: 'Failed to perform calculations', details: error.message });
    }
});

// Main Design Wizard Endpoint (Integrated GFDDE)
router.post('/design-wizard', async (req, res) => {
    try {
        const { userPrompt } = req.body;
        console.log("🧠 Engineering Request Received:", userPrompt ? userPrompt.substring(0, 50) : "No prompt");

        if (!userPrompt) {
            return res.status(400).json({ error: 'User prompt is required' });
        }

        // 1. Analyze & Calculate
        const result = await AmmoniaDesignWizardService.processRequest(userPrompt);

        res.json({ success: true, data: result });
    } catch (error) {
        console.error("❌ Design Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// GFDDE: Generate Design Variants
const DesignGenerator = require('../services/generative/DesignGenerator');
const mockKG = { rawGraph: { nodes: [], edges: [] } }; // Placeholder for KG

router.post('/generate-designs', async (req, res) => {
    try {
        const requirements = req.body;
        // Generate 4 variants
        const variants = await DesignGenerator.generateVariants(requirements, mockKG, 4);
        res.json({ variants });
    } catch (error) {
        console.error('Design Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate designs' });
    }
});

// GFDDE: Validate Compliance
const ASHRAEValidator = require('../services/standards/ASHRAEValidator');

router.post('/validate-compliance', (req, res) => {
    try {
        const { design, siteInfo } = req.body;
        const result15 = ASHRAEValidator.validateStandard15(design, siteInfo);
        const result34 = ASHRAEValidator.validateStandard34(design.refrigerant || 'R717');

        res.json({
            standard15: result15,
            standard34: result34
        });
    } catch (error) {
        console.error('Compliance Validation Error:', error);
        res.status(500).json({ error: 'Failed to validate compliance' });
    }
});

// GFDDE: Render SVG
const SVGRenderer = require('../services/rendering/SVGRenderer');

router.post('/render-svg', (req, res) => {
    try {
        const { design } = req.body;
        const svg = SVGRenderer.renderDesign(design);
        res.json({ svg });
    } catch (error) {
        console.error('SVG Rendering Error:', error);
        res.status(500).json({ error: 'Failed to render SVG' });
    }
});

// GFDDE: Export DXF
const DXFExportService = require('../services/rendering/DXFExportService');

router.post('/export-dxf', (req, res) => {
    try {
        const { design } = req.body;
        const dxf = DXFExportService.generateDXF(design);
        res.json({ dxf });
    } catch (error) {
        console.error('DXF Export Error:', error);
        res.status(500).json({ error: 'Failed to export DXF' });
    }
});

module.exports = router;