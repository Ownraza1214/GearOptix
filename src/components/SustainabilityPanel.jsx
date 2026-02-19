import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Tabs, Tag, Progress } from 'antd';
import { analyzeLifecycle } from '../calculations/lifecycle';

const dl = {
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(10,14,26,0.8)',
    font: { family: 'Inter', color: '#94a3b8', size: 11 },
    margin: { l: 55, r: 25, t: 38, b: 45 },
    xaxis: { gridcolor: 'rgba(255,255,255,0.05)' }, yaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
    hoverlabel: { bgcolor: '#1a2035', bordercolor: '#3b82f6', font: { color: '#f1f5f9' } },
};

export default function SustainabilityPanel({ results, designParams }) {
    const lca = useMemo(() => {
        return analyzeLifecycle({
            material: designParams?.material || 'AISI 4140',
            materialWeight: results?.geometry ? (Math.PI * ((results.geometry.d_p || 36) / 2000) ** 2 * ((designParams?.faceWidth || 13) / 1000) * 7850 +
                Math.PI * ((results.geometry.d_g || 136) / 2000) ** 2 * ((designParams?.faceWidth || 13) / 1000) * 7850) : 2.5,
            power: designParams?.power || 2.237,
            efficiency: results?.performance?.efficiency || 0.97,
        });
    }, [results, designParams]);

    const { carbonFootprint, lifecycleCost, recyclability, energyPayback, sustainability } = lca;
    const ratingColor = { 'A+': '#10b981', A: '#22c55e', B: '#60a5fa', C: '#f59e0b', D: '#ef4444', F: '#dc2626' };

    return (
        <div className="animate-in content-area">
            {/* Sustainability Score */}
            <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card" style={{ borderTop: `3px solid ${ratingColor[sustainability.rating]}`, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, fontWeight: 800, color: ratingColor[sustainability.rating] }}>{sustainability.rating}</div>
                    <div className="stat-label">Sustainability Rating</div>
                    <Progress percent={sustainability.score} strokeColor={ratingColor[sustainability.rating]} size="small" />
                </div>
                <div className="stat-card blue">
                    <div className="stat-label">Total CO₂</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{carbonFootprint.total.toFixed(1)} kg</div>
                    <div className="stat-unit">{(carbonFootprint.perHour * 1000).toFixed(2)} g/hr</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-label">Lifecycle Cost</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>${lifecycleCost.total.toFixed(0)}</div>
                    <div className="stat-unit">${lifecycleCost.perHour.toFixed(4)}/hr</div>
                </div>
                <div className="stat-card" style={{ borderTop: `3px solid ${energyPayback.worthwhile ? '#10b981' : '#f59e0b'}` }}>
                    <div className="stat-label">Efficiency Payback</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{energyPayback.paybackYears.toFixed(1)} yr</div>
                    <div className="stat-unit">{energyPayback.worthwhile ? '✅ Worthwhile' : '⚠️ Marginal'}</div>
                </div>
            </div>

            <Tabs defaultActiveKey="carbon" items={[
                {
                    key: 'carbon', label: '🌍 Carbon Footprint',
                    children: (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="glass-card">
                                <Plot data={[{
                                    x: ['Extraction', 'Manufacturing', 'Transport', 'Operation', 'Maintenance', 'Disposal'],
                                    y: [carbonFootprint.extraction, carbonFootprint.manufacturing, carbonFootprint.transport,
                                    carbonFootprint.operation, carbonFootprint.maintenance, carbonFootprint.disposal],
                                    type: 'waterfall',
                                    connector: { line: { color: 'rgba(255,255,255,0.1)' } },
                                    increasing: { marker: { color: '#ef4444' } },
                                    decreasing: { marker: { color: '#10b981' } },
                                    totals: { marker: { color: '#3b82f6' } },
                                }]}
                                    layout={{
                                        ...dl, title: { text: 'CO₂ Waterfall (kg)', font: { size: 13, color: '#f1f5f9' } },
                                        yaxis: { ...dl.yaxis, title: 'kg CO₂' }
                                    }}
                                    config={{ displayModeBar: false, responsive: true }}
                                    style={{ width: '100%', height: 380 }} useResizeHandler />
                            </div>
                            <div className="glass-card">
                                <Plot data={[{
                                    values: [carbonFootprint.extraction, carbonFootprint.manufacturing, carbonFootprint.transport,
                                    carbonFootprint.operation, carbonFootprint.maintenance, Math.abs(carbonFootprint.disposal)],
                                    labels: ['Extraction', 'Manufacturing', 'Transport', 'Operation', 'Maintenance', 'Disposal'],
                                    type: 'pie', hole: 0.55,
                                    marker: { colors: ['#3b82f6', '#8b5cf6', '#64748b', '#ef4444', '#f59e0b', '#10b981'] },
                                    textfont: { color: '#f1f5f9', size: 11 },
                                }]}
                                    layout={{
                                        ...dl, title: { text: `Total: ${carbonFootprint.total.toFixed(1)} kg CO₂`, font: { size: 13, color: '#f1f5f9' } },
                                        showlegend: true, legend: { font: { size: 10 } }
                                    }}
                                    config={{ displayModeBar: false, responsive: true }}
                                    style={{ width: '100%', height: 380 }} useResizeHandler />
                            </div>
                        </div>
                    ),
                },
                {
                    key: 'lifecycle', label: '💰 Lifecycle Cost',
                    children: (
                        <div className="glass-card">
                            <Plot data={[{
                                x: Object.keys(lifecycleCost).filter(k => !['total', 'perHour', 'currency'].includes(k))
                                    .map(k => k.charAt(0).toUpperCase() + k.slice(1)),
                                y: Object.entries(lifecycleCost).filter(([k]) => !['total', 'perHour', 'currency'].includes(k))
                                    .map(([, v]) => v),
                                type: 'bar',
                                marker: {
                                    color: Object.entries(lifecycleCost).filter(([k]) => !['total', 'perHour', 'currency'].includes(k))
                                        .map(([, v]) => v >= 0 ? '#3b82f6' : '#10b981'),
                                },
                            }]}
                                layout={{
                                    ...dl, title: { text: `Total Lifecycle Cost: $${lifecycleCost.total.toFixed(0)}`, font: { size: 13, color: '#f1f5f9' } },
                                    yaxis: { ...dl.yaxis, title: 'Cost ($)' }
                                }}
                                config={{ displayModeBar: false, responsive: true }}
                                style={{ width: '100%', height: 400 }} useResizeHandler />
                        </div>
                    ),
                },
                {
                    key: 'recycle', label: '♻️ Recyclability',
                    children: (
                        <div className="glass-card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                                <Progress type="circle" percent={recyclability.recyclabilityPercent} size={100}
                                    strokeColor={recyclability.recyclabilityPercent > 80 ? '#10b981' : '#f59e0b'}
                                    format={pct => <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{pct}%</span>} />
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Material: {recyclability.material}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                        Scrap Value: ${recyclability.scrapValue.toFixed(2)}<br />
                                        Embodied Energy: {recyclability.embodiedEnergy.toFixed(0)} MJ<br />
                                        Reusability Score: {recyclability.reuseabilityScore}/100
                                    </div>
                                </div>
                            </div>
                            <h4 style={{ color: '#60a5fa', marginBottom: 12 }}>Component Breakdown</h4>
                            <table style={{ width: '100%', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-glass)' }}>
                                        {['Component', 'Weight (kg)', 'Recyclable', 'Method'].map(h => (
                                            <th key={h} style={{ padding: 8, textAlign: 'left', color: '#60a5fa' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {recyclability.components.map((c, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                            <td style={{ padding: 8, color: 'var(--text-secondary)' }}>{c.name}</td>
                                            <td style={{ padding: 8, fontFamily: 'JetBrains Mono' }}>{c.weight.toFixed(3)}</td>
                                            <td style={{ padding: 8 }}><Tag color={c.recyclable ? 'green' : 'red'}>{c.recyclable ? 'Yes' : 'No'}</Tag></td>
                                            <td style={{ padding: 8, color: 'var(--text-muted)' }}>{c.method}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ),
                },
                {
                    key: 'payback', label: '⚡ Energy Payback',
                    children: (
                        <div className="glass-card" style={{ padding: 20 }}>
                            <h4 style={{ color: '#60a5fa', marginBottom: 16 }}>1% Efficiency Improvement Analysis</h4>
                            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
                                <div className="stat-card green">
                                    <div className="stat-label">Efficiency Gain</div>
                                    <div className="stat-value" style={{ fontSize: 20 }}>+{energyPayback.efficiencyGain.toFixed(1)}%</div>
                                </div>
                                <div className="stat-card orange">
                                    <div className="stat-label">Add. Cost</div>
                                    <div className="stat-value" style={{ fontSize: 20 }}>${energyPayback.additionalCost.toFixed(2)}</div>
                                </div>
                                <div className="stat-card blue">
                                    <div className="stat-label">Saved / Hour</div>
                                    <div className="stat-value" style={{ fontSize: 20 }}>${energyPayback.savedPerHour.toFixed(4)}</div>
                                </div>
                                <div className="stat-card" style={{ borderTop: `3px solid ${energyPayback.worthwhile ? '#10b981' : '#ef4444'}` }}>
                                    <div className="stat-label">Payback</div>
                                    <div className="stat-value" style={{ fontSize: 20 }}>{energyPayback.paybackYears.toFixed(1)} yr</div>
                                    <div className="stat-unit">{energyPayback.paybackHours.toFixed(0)} hrs</div>
                                </div>
                            </div>
                            <div style={{ padding: 12, borderRadius: 8, background: energyPayback.worthwhile ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', fontSize: 13 }}>
                                <span style={{ color: energyPayback.worthwhile ? '#10b981' : '#f59e0b' }}>
                                    {energyPayback.worthwhile ? '✅ Investment pays back within 30% of design life — recommended.' : '⚠️ Payback period exceeds 30% of design life — marginal benefit.'}
                                </span>
                            </div>
                        </div>
                    ),
                },
            ]} />
        </div>
    );
}
