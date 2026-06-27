/**
 * Rendering API Routes
 * Endpoints for SVG and DXF export
 */

const express = require('express');
const router = express.Router();
const SVGGenerator = require('../services/rendering/SVGGenerator');
const DXFExporter = require('../services/rendering/DXFExporter');

const svgGenerator = new SVGGenerator();
const dxfExporter = new DXFExporter();

/**
 * POST /api/rendering/export/svg
 * Generate SVG from P&ID data
 */
router.post('/export/svg', async (req, res) => {
    try {
        console.log('[RenderingAPI] Generating SVG...');

        const pidData = req.body;
        const svg = svgGenerator.generate(pidData);

        // Set response headers for file download
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Content-Disposition', `attachment; filename="pid_diagram_${Date.now()}.svg"`);

        res.send(svg);

        console.log('[RenderingAPI] ✅ SVG generated and sent');

    } catch (error) {
        console.error('[RenderingAPI] ❌ SVG generation failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/rendering/export/dxf
 * Generate DXF from P&ID data
 */
router.post('/export/dxf', async (req, res) => {
    try {
        console.log('[RenderingAPI] Generating DXF...');

        const pidData = req.body;
        const dxf = dxfExporter.export(pidData);

        // Set response headers for file download
        res.setHeader('Content-Type', 'application/dxf');
        res.setHeader('Content-Disposition', `attachment; filename="pid_diagram_${Date.now()}.dxf"`);

        res.send(dxf);

        console.log('[RenderingAPI] ✅ DXF generated and sent');

    } catch (error) {
        console.error('[RenderingAPI] ❌ DXF generation failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/rendering/preview
 * Generate SVG preview (inline)
 */
router.post('/preview', async (req, res) => {
    try {
        const pidData = req.body;
        const svg = svgGenerator.generate(pidData);

        res.json({
            success: true,
            svg: svg,
            metadata: {
                width: svgGenerator.width,
                height: svgGenerator.height
            }
        });

    } catch (error) {
        console.error('[RenderingAPI] Preview generation failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/rendering/symbols
 * Get list of available symbols
 */
router.get('/symbols', (req, res) => {
    try {
        const SVGSymbolLibrary = require('../services/rendering/SVGSymbolLibrary');
        const library = new SVGSymbolLibrary();

        const symbols = library.getAllSymbolIds().map(id => {
            const symbol = library.getSymbol(id);
            return {
                id: symbol.id,
                name: symbol.name,
                category: symbol.category,
                standard: symbol.standard,
                width: symbol.width,
                height: symbol.height
            };
        });

        res.json({
            success: true,
            symbols,
            count: symbols.length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
