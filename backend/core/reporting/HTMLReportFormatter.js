/**
 * HTMLReportFormatter - Convert Report to Professional HTML
 * 
 * Generates beautiful HTML reports with:
 * - Professional styling (CSS)
 * - Tables and charts
 * - Print-ready layout
 * - Can be converted to PDF via puppeteer
 * 
 * @author GFDDE AI Engine
 * @version 2.0.0
 */

class HTMLReportFormatter {
    constructor() {
        this.styles = this._getStyles();
    }

    /**
     * Format report as HTML
     * @param {Object} report - Report data from ReportGenerator
     * @returns {string} HTML string
     */
    format(report) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.metadata.projectName} - Design Report</title>
    <style>${this.styles}</style>
</head>
<body>
    ${this._generateCoverPage(report.metadata)}
    ${this._generateTableOfContents()}
    ${this._generateSummary(report.summary)}
    ${this._generateCalculations(report.calculations)}
    ${this._generateBOM(report.equipment)}
    ${report.energy ? this._generateEnergyReport(report.energy) : ''}
    ${this._generateStandards(report.standards)}
    ${this._generateFooter()}
</body>
</html>`;
    }

    _generateCoverPage(metadata) {
        return `
    <div class="page cover-page">
        <div class="cover-content">
            <h1 class="project-title">${metadata.projectName}</h1>
            <h2 class="subtitle">Refrigeration System Design Report</h2>
            
            <div class="project-info">
                <table class="info-table">
                    <tr><td class="label">Project No:</td><td>${metadata.projectNumber}</td></tr>
                    <tr><td class="label">Client:</td><td>${metadata.client}</td></tr>
                    <tr><td class="label">Location:</td><td>${metadata.location}</td></tr>
                    <tr><td class="label">Date:</td><td>${metadata.date}</td></tr>
                    <tr><td class="label">Refrigerant:</td><td>${metadata.refrigerant}</td></tr>
                </table>
            </div>
            
            <div class="standards">
                <p><strong>Applicable Standards:</strong></p>
                <ul>
                    ${metadata.standards.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
            
            <div class="branding">
                <p class="company">Cool-Assist GFDDE v${metadata.version}</p>
                <p class="tagline">Professional Refrigeration Design Engine</p>
            </div>
        </div>
    </div>`;
    }

    _generateTableOfContents() {
        return `
    <div class="page">
        <h1>Table of Contents</h1>
        <ol class="toc">
            <li><a href="#summary">Executive Summary</a></li>
            <li><a href="#calculations">Detailed Calculations</a></li>
            <li><a href="#bom">Bill of Materials</a></li>
            <li><a href="#energy">Energy Analysis</a></li>
            <li><a href="#standards">Standards Compliance</a></li>
        </ol>
    </div>`;
    }

    _generateSummary(summary) {
        return `
    <div class="page" id="summary">
        <h1>1. Executive Summary</h1>
        
        <div class="summary-box">
            <h3>Total Cooling Load</h3>
            <p class="big-number">${summary.totalLoad.value.toFixed(0)} kW</p>
            <p class="sub-number">(${summary.totalLoad.valueTR.toFixed(0)} TR)</p>
        </div>
        
        <h3>System Overview</h3>
        <table class="data-table">
            <tr>
                <th>Parameter</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Number of Rooms</td>
                <td>${summary.roomCount}</td>
            </tr>
            <tr>
                <td>Temperature Levels</td>
                <td>${summary.temperatureLevels.join(', ')}</td>
            </tr>
            <tr>
                <td>Refrigerant</td>
                <td>${summary.refrigerant.code} (GWP: ${summary.refrigerant.gwp}, ${summary.refrigerant.safetyClass})</td>
            </tr>
            <tr>
                <td>Evaporators</td>
                <td>${summary.equipment.evaporators}</td>
            </tr>
            <tr>
                <td>Compressors</td>
                <td>${summary.equipment.compressors}</td>
            </tr>
            <tr>
                <td>Condensers</td>
                <td>${summary.equipment.condensers}</td>
            </tr>
            <tr>
                <td>Pressure Vessels</td>
                <td>${summary.equipment.vessels}</td>
            </tr>
        </table>
        
        <h3>Cost Estimate</h3>
        <p><strong>Total Project Cost:</strong> $${summary.estimatedCost.toLocaleString()}</p>
        <p><strong>Estimated Duration:</strong> ${summary.projectDuration}</p>
    </div>`;
    }

    _generateCalculations(sections) {
        return `
    <div class="page" id="calculations">
        <h1>2. Detailed Calculations</h1>
        ${sections.map(section => this._formatCalculationSection(section)).join('\n')}
    </div>`;
    }

    _formatCalculationSection(section) {
        return `
        <h2>${section.title}</h2>
        ${section.subsections ? section.subsections.map(sub => `
            <h3>${sub.title}</h3>
            ${sub.temperature ? `<p><strong>Temperature:</strong> ${sub.temperature}</p>` : ''}
            ${sub.calculations ? this._formatCalculationDetails(sub.calculations) : ''}
            ${sub.items ? this._formatEquipmentList(sub.items) : ''}
        `).join('') : ''}`;
    }

    _formatCalculationDetails(calc) {
        return `
        <div class="calc-section">
            <h4>Transmission Load</h4>
            <p class="formula">${calc.transmission.formula}</p>
            <p><strong>Result:</strong> ${calc.transmission.result} ${calc.transmission.unit}</p>
            
            <h4>Product Load</h4>
            <p class="formula">${calc.product.formula}</p>
            <p><strong>Result:</strong> ${calc.product.result} ${calc.product.unit}</p>
            
            <h4>Infiltration Load</h4>
            <p><strong>Result:</strong> ${calc.infiltration.result} ${calc.infiltration.unit}</p>
            
            <h4>Internal Gains</h4>
            <p><strong>Result:</strong> ${calc.internal.result} ${calc.internal.unit}</p>
            
            <div class="total-box">
                <p><strong>Subtotal:</strong> ${calc.total.subtotal.toFixed(2)} kW</p>
                <p><strong>Safety Factor:</strong> ${calc.total.safetyFactor}</p>
                <p class="total"><strong>TOTAL LOAD:</strong> ${calc.total.total.toFixed(2)} kW</p>
            </div>
        </div>`;
    }

    _formatEquipmentList(items) {
        return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Tag</th>
                    <th>Model</th>
                    <th>Capacity</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${item.tag}</td>
                        <td>${item.model}</td>
                        <td>${item.capacity} kW</td>
                        <td>${JSON.stringify(item.selection_criteria)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    }

    _generateBOM(bom) {
        return `
    <div class="page" id="bom">
        <h1>3. Bill of Materials</h1>
        <p><strong>Currency:</strong> ${bom.currency}</p>
        
        <table class="bom-table">
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Tag</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Unit Price</th>
                    <th>Total Price</th>
                    <th>Lead Time</th>
                </tr>
            </thead>
            <tbody>
                ${bom.items.map(item => `
                    <tr>
                        <td>${item.category}</td>
                        <td>${item.tag}</td>
                        <td>${item.description}</td>
                        <td>${item.quantity}</td>
                        <td>${item.unit}</td>
                        <td>$${item.unitPrice.toLocaleString()}</td>
                        <td><strong>$${item.totalPrice.toLocaleString()}</strong></td>
                        <td>${item.leadTime}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="6"><strong>Subtotal</strong></td>
                    <td><strong>$${bom.subtotal.toLocaleString()}</strong></td>
                    <td></td>
                </tr>
                <tr>
                    <td colspan="6"><strong>Contingency (${(bom.contingency * 100).toFixed(0)}%)</strong></td>
                    <td><strong>$${bom.contingencyAmount.toLocaleString()}</strong></td>
                    <td></td>
                </tr>
                <tr class="total-row">
                    <td colspan="6"><strong>TOTAL PROJECT COST</strong></td>
                    <td><strong>$${bom.total.toLocaleString()}</strong></td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    </div>`;
    }

    _generateEnergyReport(energy) {
        return `
    <div class="page" id="energy">
        <h1>4. Energy Analysis</h1>
        
        <h3>Annual Consumption</h3>
        <p class="big-number">${energy.consumption.annual.toLocaleString()} ${energy.consumption.unit}</p>
        <p<strong>Annual Cost:</strong> $${energy.consumption.cost.toLocaleString()}</p>
        
        <h3>Optimization Opportunities</h3>
        <div class="savings-box">
            <p><strong>Potential Savings:</strong> ${energy.optimization.potential_savings_percent}%</p>
            <p><strong>Annual Savings:</strong> $${energy.optimization.annual_savings.toLocaleString()}</p>
            <p><strong>Payback Period:</strong> ${energy.optimization.payback_period} years</p>
        </div>
        
        <h3>Recommendations</h3>
        <ul>
            ${energy.optimization.recommendations.map(r => `
                <li><strong>${r.title}</strong> (${r.priority}): ${r.description} - ${r.savings}% savings</li>
            `).join('')}
        </ul>
    </div>`;
    }

    _generateStandards(standards) {
        return `
    <div class="page" id="standards">
        <h1>5. Standards Compliance</h1>
        
        <h3>Primary Standard Framework</h3>
        <p>${standards.primary_standard}</p>
        
        <h3>Design Standards</h3>
        <ul>
            ${standards.design_standards.map(s => `<li>${s}</li>`).join('')}
        </ul>
        
        <h3>Safety Standards</h3>
        <ul>
            ${standards.safety_standards.map(s => `<li>${s}</li>`).join('')}
        </ul>
        
        <h3>Required Certifications</h3>
        <ul>
            ${standards.certifications_required.map(c => `<li>${c}</li>`).join('')}
        </ul>
    </div>`;
    }

    _generateFooter() {
        return `
    <div class="footer">
        <p>Generated by Cool-Assist GFDDE v2.0 | © ${new Date().getFullYear()}</p>
    </div>`;
    }

    _getStyles() {
        return `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background: #fff;
}

.page {
    width: 210mm;
    min-height: 297mm;
    padding: 25mm;
    margin: 0 auto 20px;
    background: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

/* Cover Page */
.cover-page {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.cover-content {
    max-width: 80%;
}

.project-title {
    font-size: 48px;
    font-weight: 700;
    color: #0066cc;
    margin-bottom: 20px;
}

.subtitle {
    font-size: 24px;
    color: #666;
    margin-bottom: 40px;
}

.project-info {
    margin: 40px 0;
}

.info-table {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    text-align: left;
}

.info-table td {
    padding: 10px;
    border-bottom: 1px solid #eee;
}

.info-table .label {
    font-weight: 600;
    width: 40%;
}

.standards {
    margin: 40px 0;
    text-align: left;
    max-width: 500px;
    margin: 40px auto;
}

.branding {
    margin-top: 60px;
}

.company {
    font-size: 20px;
    font-weight: 600;
    color: #0066cc;
}

.tagline {
    color: #999;
    font-style: italic;
}

/* Typography */
h1 {
    font-size: 32px;
    color: #0066cc;
    margin-bottom: 20px;
    border-bottom: 3px solid #0066cc;
    padding-bottom: 10px;
}

h2 {
    font-size: 24px;
    color: #333;
    margin: 30px 0 15px;
}

h3 {
    font-size: 18px;
    color: #555;
    margin: 20px 0 10px;
}

/* Tables */
.data-table, .bom-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
}

.data-table th,
.data-table td,
.bom-table th,
.bom-table td {
    padding: 12px;
    text-align: left;
    border: 1px solid #ddd;
}

.data-table th,
.bom-table th {
    background: #0066cc;
    color: white;
    font-weight: 600;
}

.data-table tr:nth-child(even),
.bom-table tbody tr:nth-child(even) {
    background: #f9f9f9;
}

.bom-table tfoot td {
    border-top: 2px solid #333;
    font-weight: 600;
}

.total-row td {
    background: #e6f2ff;
    font-size: 16px;
}

/* Special Boxes */
.summary-box {
    background: linear-gradient(135deg, #0066cc, #0099ff);
    color: white;
    padding: 30px;
    border-radius: 10px;
    text-align: center;
    margin: 20px 0;
}

.big-number {
    font-size: 48px;
    font-weight: 700;
    margin: 10px 0;
}

.sub-number {
    font-size: 24px;
    opacity: 0.9;
}

.total-box {
    background: #f0f8ff;
    border: 2px solid #0066cc;
    padding: 20px;
    margin: 20px 0;
    border-radius: 5px;
}

.total-box .total {
    font-size: 18px;
    color: #0066cc;
    margin-top: 10px;
}

.savings-box {
    background: #e8f5e9;
    border-left: 5px solid #4caf50;
    padding: 20px;
    margin: 20px 0;
}

.formula {
    font-family: 'Courier New', monospace;
    background: #f5f5f5;
    padding: 10px;
    border-left: 4px solid #0066cc;
    margin: 10px 0;
    font-style: italic;
}

/* Table of Contents */
.toc {
    list-style: none;
    padding-left: 0;
}

.toc li {
    padding: 15px 0;
    border-bottom: 1px solid #eee;
}

.toc a {
    color: #0066cc;
    text-decoration: none;
    font-size: 18px;
}

.toc a:hover {
    text-decoration: underline;
}

/* Footer */
.footer {
    text-align: center;
    padding: 20px;
    color: #999;
    font-size: 14px;
}

/* Print Styles */
@media print {
    .page {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
    }
    
    .cover-page {
        page-break-after: always;
    }
}
        `;
    }
}

module.exports = HTMLReportFormatter;
