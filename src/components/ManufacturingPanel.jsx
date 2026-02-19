import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Tabs, Tag, Progress, Table } from 'antd';
import { analyzeManufacturing } from '../calculations/manufacturing';

const dl = {
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(10,14,26,0.8)',
    font: { family: 'Inter', color: '#94a3b8', size: 11 },
    margin: { l: 55, r: 25, t: 38, b: 45 },
    xaxis: { gridcolor: 'rgba(255,255,255,0.05)' }, yaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
    hoverlabel: { bgcolor: '#1a2035', bordercolor: '#3b82f6', font: { color: '#f1f5f9' } },
};

export default function ManufacturingPanel({ results, designParams }) {
    const mfg = useMemo(() => {
        return analyzeManufacturing({
            gearType: designParams?.gearType || 'spur',
            module: designParams?.module || 2,
            numTeethPinion: designParams?.numTeethPinion || 18,
            numTeethGear: Math.round((designParams?.numTeethPinion || 18) * (designParams?.gearRatio || 3.78)),
            faceWidth: designParams?.faceWidth || 13,
            material: designParams?.material || 'AISI 4140',
            hardness: designParams?.hardness || 300,
            qualityGrade: designParams?.qualityNumber || 8,
        });
    }, [results, designParams]);

    const { recommendedProcess, allProcesses, heatTreatment, shotPeening, tolerances, costs, dfm, blankWeight } = mfg;
    const ratingColor = { A: '#10b981', B: '#60a5fa', C: '#f59e0b', D: '#ef4444' };

    return (
        <div className="animate-in content-area">
            {/* Summary */}
            <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card blue">
                    <div className="stat-label">Recommended Process</div>
                    <div className="stat-value" style={{ fontSize: 18 }}>{recommendedProcess?.name || 'N/A'}</div>
                    <div className="stat-unit">{recommendedProcess?.description?.slice(0, 40)}</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-label">Unit Cost</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>${costs.unitCost.toFixed(2)}</div>
                    <div className="stat-unit">Batch: ${costs.batchCost.toFixed(0)} ({costs.quantity} pcs)</div>
                </div>
                <div className="stat-card orange">
                    <div className="stat-label">Heat Treatment</div>
                    <div className="stat-value" style={{ fontSize: 14 }}>{heatTreatment.type}</div>
                    <div className="stat-unit">{heatTreatment.totalTime} min | Case: {heatTreatment.caseDepth.toFixed(1)} mm</div>
                </div>
                <div className="stat-card" style={{ borderTop: `3px solid ${ratingColor[dfm.rating]}` }}>
                    <div className="stat-label">DFM Score</div>
                    <div className="stat-value" style={{ fontSize: 32, color: ratingColor[dfm.rating] }}>{dfm.rating}</div>
                    <div className="stat-unit">{dfm.overallScore.toFixed(1)} / 10</div>
                </div>
            </div>

            <Tabs defaultActiveKey="process" items={[
                {
                    key: 'process', label: '🏭 Process Selection',
                    children: (
                        <div className="glass-card" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', fontSize: 12, minWidth: 700 }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-glass)' }}>
                                        {['Process', 'Cycle (min)', 'Quality', 'Finish', 'Cost', 'Speed', 'Score'].map(h => (
                                            <th key={h} style={{ padding: 8, textAlign: 'left', color: '#60a5fa' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {allProcesses.map((p, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)', background: i === 0 ? 'rgba(59,130,246,0.08)' : 'transparent' }}>
                                            <td style={{ padding: 8, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? '#60a5fa' : 'var(--text-secondary)' }}>
                                                {p.name} {i === 0 && <Tag color="blue" style={{ marginLeft: 6 }}>REC</Tag>}
                                            </td>
                                            <td style={{ padding: 8, fontFamily: 'JetBrains Mono' }}>{p.cycleTime.toFixed(1)}</td>
                                            <td style={{ padding: 8 }}><Tag color={p.qualityPass ? 'green' : 'red'}>Q{p.quality}</Tag></td>
                                            <td style={{ padding: 8, fontFamily: 'JetBrains Mono' }}>{p.surfaceFinish} µm</td>
                                            <td style={{ padding: 8 }}><Tag color={p.cost === 'low' ? 'green' : p.cost === 'medium' ? 'blue' : 'orange'}>{p.cost}</Tag></td>
                                            <td style={{ padding: 8 }}>{p.speed}</td>
                                            <td style={{ padding: 8 }}><Progress percent={p.score} size="small" strokeColor={p.score > 70 ? '#10b981' : p.score > 50 ? '#f59e0b' : '#ef4444'} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ),
                },
                {
                    key: 'heat', label: '🔥 Heat Treatment',
                    children: (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="glass-card">
                                <Plot data={[{
                                    x: heatTreatment.profile.map(d => d.time),
                                    y: heatTreatment.profile.map(d => d.temperature),
                                    type: 'scatter', mode: 'lines', fill: 'tozeroy',
                                    line: { color: '#ef4444', width: 2 }, fillcolor: 'rgba(239,68,68,0.1)',
                                    text: heatTreatment.profile.map(d => d.stage),
                                }]}
                                    layout={{
                                        ...dl, title: { text: 'Heat Treatment Cycle', font: { size: 13, color: '#f1f5f9' } },
                                        xaxis: { ...dl.xaxis, title: 'Time (min)' }, yaxis: { ...dl.yaxis, title: 'Temperature (°C)' }
                                    }}
                                    config={{ displayModeBar: false, responsive: true }}
                                    style={{ width: '100%', height: 350 }} useResizeHandler />
                            </div>
                            <div className="glass-card">
                                <Plot data={[{
                                    x: heatTreatment.hardnessGradient.map(d => d.depth),
                                    y: heatTreatment.hardnessGradient.map(d => d.hardness),
                                    type: 'scatter', mode: 'lines', fill: 'tozeroy',
                                    line: { color: '#f59e0b', width: 2.5 }, fillcolor: 'rgba(245,158,11,0.1)',
                                }]}
                                    layout={{
                                        ...dl, title: { text: 'Hardness Gradient Through Tooth', font: { size: 13, color: '#f1f5f9' } },
                                        xaxis: { ...dl.xaxis, title: 'Depth (mm)' }, yaxis: { ...dl.yaxis, title: 'Hardness (HRC)' }
                                    }}
                                    config={{ displayModeBar: false, responsive: true }}
                                    style={{ width: '100%', height: 350 }} useResizeHandler />
                            </div>
                        </div>
                    ),
                },
                {
                    key: 'cost', label: '💰 Cost Breakdown',
                    children: (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="glass-card">
                                <Plot data={[{
                                    values: Object.values(costs.breakdown).map(v => Math.abs(v)),
                                    labels: Object.keys(costs.breakdown).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
                                    type: 'pie', hole: 0.55,
                                    marker: { colors: ['#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#64748b'] },
                                    textfont: { color: '#f1f5f9', size: 11 },
                                }]}
                                    layout={{ ...dl, title: { text: `Unit Cost: $${costs.unitCost.toFixed(2)}`, font: { size: 13, color: '#f1f5f9' } }, showlegend: true, legend: { font: { size: 10 } } }}
                                    config={{ displayModeBar: false, responsive: true }}
                                    style={{ width: '100%', height: 350 }} useResizeHandler />
                            </div>
                            <div className="glass-card" style={{ padding: 16 }}>
                                <h4 style={{ color: '#60a5fa', marginBottom: 12 }}>📋 Tolerances (ISO 1328 Q{tolerances.quality})</h4>
                                <table style={{ width: '100%', fontSize: 12 }}>
                                    <tbody>
                                        {[
                                            ['Pitch Error', `${tolerances.pitchError} µm`],
                                            ['Profile Error', `${tolerances.profileError} µm`],
                                            ['Helix Error', `${tolerances.helixError} µm`],
                                            ['Runout', `${tolerances.runout} µm`],
                                            ['Tooth Thickness', `±${tolerances.toothThickness} mm`],
                                        ].map(([label, val], i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                <td style={{ padding: 6, color: 'var(--text-secondary)' }}>{label}</td>
                                                <td style={{ padding: 6, fontFamily: 'JetBrains Mono', textAlign: 'right', color: 'var(--accent-primary)' }}>{val}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ marginTop: 16 }}>
                                    <h4 style={{ color: '#10b981', marginBottom: 8 }}>🎯 Shot Peening</h4>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                        Media: {shotPeening.media} | Intensity: {shotPeening.intensity}<br />
                                        Residual Stress: {shotPeening.residualStress} MPa<br />
                                        Fatigue Improvement: +{shotPeening.fatigueImprovement}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    ),
                },
                {
                    key: 'dfm', label: '📐 DFM Analysis',
                    children: (
                        <div className="glass-card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 32, fontWeight: 800, color: ratingColor[dfm.rating],
                                    border: `4px solid ${ratingColor[dfm.rating]}`, background: `${ratingColor[dfm.rating]}15`
                                }}>
                                    {dfm.rating}
                                </div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>DFM Score: {dfm.overallScore.toFixed(1)} / 10</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{dfm.recommendation}</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                {dfm.scores.map((s, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ flex: '0 0 100px', fontSize: 12, color: 'var(--text-secondary)' }}>{s.category}</div>
                                        <Progress percent={s.score * 10} size="small" strokeColor={s.score >= 7 ? '#10b981' : s.score >= 5 ? '#f59e0b' : '#ef4444'} style={{ flex: 1 }} />
                                        <div style={{ flex: '0 0 80px', fontSize: 11, color: '#64748b', textAlign: 'right' }}>{s.comment}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ),
                },
            ]} />
        </div>
    );
}
