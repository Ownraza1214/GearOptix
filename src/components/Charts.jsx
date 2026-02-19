import React from 'react';
import Plot from 'react-plotly.js';

const darkLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(10,14,26,0.8)',
    font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 12 },
    margin: { l: 60, r: 30, t: 40, b: 50 },
    xaxis: { gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.1)' },
    yaxis: { gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.1)' },
    legend: { font: { size: 11 }, bgcolor: 'rgba(0,0,0,0)' },
    hoverlabel: { bgcolor: '#1a2035', bordercolor: '#3b82f6', font: { color: '#f1f5f9', size: 12 } },
};

const safe = (v, fallback = 0) => (v !== undefined && v !== null && !Number.isNaN(v) ? v : fallback);

export default function Charts({ results }) {
    if (!results) {
        return (
            <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                <h3 style={{ color: 'var(--text-secondary)' }}>No Chart Data</h3>
                <p>Run analysis first to generate charts.</p>
            </div>
        );
    }

    const { stresses = {}, factors = {}, safetyFactors = {} } = results;
    const gearType = results.gearType || 'spur';

    // 1. Stress Comparison Bar Chart
    const appliedLabels = [];
    const appliedValues = [];
    const allowableValues = [];

    if (stresses.s_t_pinion !== undefined) { appliedLabels.push('Bending (P)'); appliedValues.push(safe(stresses.s_t_pinion)); allowableValues.push(safe(stresses.s_at_pinion)); }
    if (stresses.s_t_gear !== undefined) { appliedLabels.push('Bending (G)'); appliedValues.push(safe(stresses.s_t_gear)); allowableValues.push(safe(stresses.s_at_gear)); }
    if (stresses.s_c !== undefined) { appliedLabels.push('Contact'); appliedValues.push(safe(stresses.s_c)); allowableValues.push(safe(stresses.s_ac_pinion || stresses.s_ac_gear, 0)); }

    const stressChart = {
        data: [
            {
                x: appliedLabels, y: appliedValues,
                name: 'Applied Stress', type: 'bar',
                marker: { color: '#3b82f6', line: { width: 0 } },
            },
            {
                x: appliedLabels, y: allowableValues,
                name: 'Allowable Stress', type: 'bar',
                marker: { color: 'rgba(16,185,129,0.5)', line: { color: '#10b981', width: 2 } },
            }
        ],
        layout: {
            ...darkLayout,
            title: { text: 'Stress vs Allowable (MPa)', font: { size: 14, color: '#f1f5f9' } },
            barmode: 'group',
            yaxis: { ...darkLayout.yaxis, title: 'Stress (MPa)' },
        }
    };

    // 2. S-N Fatigue Curve
    const s_at = safe(stresses.s_at_pinion || stresses.s_at_gear, 200);
    const snData = [];
    for (let i = 3; i <= 10; i += 0.1) {
        const N = Math.pow(10, i);
        snData.push({ N, stress: Math.max(s_at * 0.3, s_at * Math.pow(1e7 / N, 0.1)) });
    }
    const snChart = {
        data: [
            {
                x: snData.map(d => d.N), y: snData.map(d => d.stress),
                name: 'S-N Curve', type: 'scatter', mode: 'lines',
                line: { color: '#8b5cf6', width: 3 },
            },
            {
                x: [safe(results.inputs?.designLife, 1e7)],
                y: [safe(stresses.s_t_pinion || stresses.s_t_gear, 100)],
                name: 'Operating Point', type: 'scatter', mode: 'markers',
                marker: { color: '#ef4444', size: 14, symbol: 'star', line: { color: 'white', width: 2 } },
            },
            {
                x: [1e3, 1e10], y: [s_at, s_at],
                name: 'Allowable (σ_at)', type: 'scatter', mode: 'lines',
                line: { color: '#10b981', width: 2, dash: 'dash' },
            }
        ],
        layout: {
            ...darkLayout,
            title: { text: 'S-N Fatigue Diagram', font: { size: 14, color: '#f1f5f9' } },
            xaxis: { ...darkLayout.xaxis, type: 'log', title: 'Cycles (N)', range: [3, 10] },
            yaxis: { ...darkLayout.yaxis, title: 'Stress (MPa)' },
        }
    };

    // 3. AGMA Factors Radar
    const radarNames = [];
    const radarValues = [];
    if (factors.K_o !== undefined) { radarNames.push('K_o'); radarValues.push(factors.K_o); }
    if (factors.K_v !== undefined) { radarNames.push('K_v'); radarValues.push(factors.K_v); }
    if (factors.K_s !== undefined) { radarNames.push('K_s'); radarValues.push(factors.K_s); }
    if (factors.K_m !== undefined) { radarNames.push('K_m'); radarValues.push(factors.K_m); }
    if (factors.K_B !== undefined) { radarNames.push('K_B'); radarValues.push(factors.K_B); }
    if (factors.K_R !== undefined) { radarNames.push('K_R'); radarValues.push(factors.K_R); }
    if (factors.K_T !== undefined) { radarNames.push('K_T'); radarValues.push(factors.K_T); }
    if (factors.mu !== undefined) { radarNames.push('μ (×10)'); radarValues.push(factors.mu * 10); }

    const radarChart = {
        data: [{
            type: 'scatterpolar',
            r: radarValues, theta: radarNames,
            fill: 'toself', fillcolor: 'rgba(59, 130, 246, 0.15)',
            line: { color: '#3b82f6', width: 2 },
            marker: { size: 6 }, name: 'AGMA Factors'
        }],
        layout: {
            ...darkLayout,
            title: { text: 'AGMA Factor Distribution', font: { size: 14, color: '#f1f5f9' } },
            polar: {
                bgcolor: 'rgba(10,14,26,0.8)',
                radialaxis: { gridcolor: 'rgba(255,255,255,0.08)', linecolor: 'rgba(255,255,255,0.1)' },
                angularaxis: { gridcolor: 'rgba(255,255,255,0.08)', linecolor: 'rgba(255,255,255,0.1)' }
            },
            showlegend: false,
        }
    };

    // 4. Safety Factor Comparison
    const sfLabels = [];
    const sfValues = [];
    const sfColors = [];

    if (safetyFactors.bending_pinion !== undefined) { sfLabels.push('Bending\n(Pinion)'); sfValues.push(safetyFactors.bending_pinion); }
    if (safetyFactors.bending_gear !== undefined) { sfLabels.push('Bending\n(Gear)'); sfValues.push(safetyFactors.bending_gear); }
    if (safetyFactors.contact_pinion !== undefined) { sfLabels.push('Contact\n(Pinion)'); sfValues.push(safetyFactors.contact_pinion); }
    if (safetyFactors.contact_gear !== undefined) { sfLabels.push('Contact\n(Gear)'); sfValues.push(safetyFactors.contact_gear); }
    if (safetyFactors.wear_gear !== undefined) { sfLabels.push('Wear\n(Gear)'); sfValues.push(safetyFactors.wear_gear); }

    sfValues.forEach(v => sfColors.push(safe(v) >= 1 ? '#10b981' : '#ef4444'));

    const sfChart = {
        data: [{
            type: 'bar',
            x: sfLabels, y: sfValues,
            marker: { color: sfColors, line: { width: 0 } },
            text: sfValues.map(v => safe(v).toFixed(2)),
            textposition: 'outside',
            textfont: { color: '#f1f5f9', size: 13, family: 'JetBrains Mono' },
        }],
        layout: {
            ...darkLayout,
            title: { text: 'Safety Factors', font: { size: 14, color: '#f1f5f9' } },
            yaxis: { ...darkLayout.yaxis, title: 'Safety Factor' },
            shapes: [{
                type: 'line', x0: -0.5, x1: sfLabels.length - 0.5, y0: 1, y1: 1,
                line: { color: '#ef4444', width: 2, dash: 'dash' }
            }],
            annotations: [{
                x: sfLabels.length - 0.5, y: 1, text: 'SF = 1.0', showarrow: false,
                font: { color: '#ef4444', size: 11 }, xanchor: 'left'
            }],
            showlegend: false,
        }
    };

    return (
        <div className="animate-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="chart-container">
                <Plot data={stressChart.data} layout={stressChart.layout}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%', height: 350 }}
                    useResizeHandler
                />
            </div>
            <div className="chart-container">
                <Plot data={sfChart.data} layout={sfChart.layout}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%', height: 350 }}
                    useResizeHandler
                />
            </div>
            <div className="chart-container">
                <Plot data={snChart.data} layout={snChart.layout}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%', height: 350 }}
                    useResizeHandler
                />
            </div>
            <div className="chart-container">
                <Plot data={radarChart.data} layout={radarChart.layout}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%', height: 350 }}
                    useResizeHandler
                />
            </div>
        </div>
    );
}
