// Simple deterministic parameter extractor (fallback when AI not available)
function deterministicExtractParameters(prompt) {
    // Import the ProductProperties object from module exports
    const ProductPropertiesModule = require('../data/ProductProperties');
    const ProductProperties = ProductPropertiesModule.ProductProperties;

    const specs = {
        projectInfo: {
            name: 'Industrial Refrigeration Project',
            location: 'UAE',
            type: 'slaughterhouse'
        },
        rooms: []
    };

    // Parse rooms from prompt
    const roomPatterns = [
        { name: 'Chill Room', temp: -5, product: 'beef', keywords: ['chill', 'کش', 'نگهداری'] },
        { name: 'Precool Room', temp: -5, product: 'beef', keywords: ['precool', 'پیش', 'سرد'] },
        { name: 'Storage', temp: -18, product: 'beef', keywords: ['storage', 'انبار', 'نگه'] },
        { name: 'Tunnel', temp: -40, product: 'beef', keywords: ['tunnel', 'تونل', 'انجماد'] },
        { name: 'Blast Freezer', temp: -35, product: 'beef', keywords: ['blast', 'سریع'] }
    ];

    roomPatterns.forEach(pattern => {
        const hasKeyword = pattern.keywords.some(kw => prompt.toLowerCase().includes(kw));
        if (hasKeyword) {
            const productProps = ProductProperties[pattern.product] || ProductProperties['beef'];

            specs.rooms.push({
                name: pattern.name,
                count: 1,
                temp: pattern.temp,
                length: 10,
                width: 8,
                height: 4,
                product: pattern.product,
                targetRH: 85,
                ambientTemp: 40,
                ambientRH: 60,
                freezingPoint: productProps.freezingPoint,
                specificHeatAbove: productProps.specificHeatAbove,
                specificHeatBelow: productProps.specificHeatBelow,
                latentHeat: productProps.latentHeat,
                density: productProps.density,
                respiration: productProps.respiration
            });
        }
    });

    // If no rooms detected, add defaults
    if (specs.rooms.length === 0) {
        const beefProps = ProductProperties['beef'];
        specs.rooms.push({
            name: 'Storage',
            count: 1,
            temp: -18,
            length: 10,
            width: 8,
            height: 4,
            product: 'beef',
            targetRH: 85,
            ambientTemp: 40,
            ambientRH: 60,
            freezingPoint: beefProps.freezingPoint,
            specificHeatAbove: beefProps.specificHeatAbove,
            specificHeatBelow: beefProps.specificHeatBelow,
            latentHeat: beefProps.latentHeat,
            density: beefProps.density,
            respiration: beefProps.respiration
        });
    }

    return specs;
}

module.exports = { deterministicExtractParameters };
