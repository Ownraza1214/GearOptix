import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Slider, Tabs, Tag } from 'antd';
import { analyzeNVH } from '../calculations/nvhAnalysis';

const darkLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(10,14,26,0.8)',
    font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 11 },
    margin: { l: 55, r: 25, t: 38, b: 45 },
    xaxis: { gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.1)' },
    yaxis: { gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.1)' },
    hoverlabel: { bgcolor: '#1a2035', bordercolor: '#3b82f6', font: { color: '#f1f5f9', size: 12 } },
};

export default function NVHPanel({ results, designParams }) {
    const [tipRelief, setTipRelief] = useState(0);
    const [crowning, setCrowning] = useState(0);
    const [profileShift, setProfileShift] = useState(0);

    const nvh = useMemo(() => {
        const p = {
            N_p: designParams?.numTeethPinion || 18,
            N_g: Math.round((designParams?.numTeethPinion || 18) * (designParams?.gearRatio || 3.78)),
            module: designParams?.module || 2,
            speed_pinion: designParams?.speed_pinion || 1750,
            gearRatio: designParams?.gearRatio || 3.78,
            faceWidth: designParams?.faceWidth || 13,
            qualityNumber: designParams?.qualityNumber || 8,
            tipRelief, crowning, profileShift,
        };
        return analyzeNVH(p);
    }, [designParams, tipRelief, crowning, profileShift]);

    const sevColor = { A: '#10b981', B: '#60a5fa', C: '#f59e0b', D: '#ef4444' };

    return (
        <div className="animate-in content-area">
            {/* Summary Cards */}
            <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card blue">
                    <div className="stat-label">Mesh Frequency</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{nvh.meshFrequency.toFixed(0)} Hz</div>
                </div>
                <div className="stat-card" style={{ borderTop: `3px solid ${sevColor[nvh.vibrationSeverity.severityClass]}` }}>
                    <div className="stat-label">Vibration Severity</div>
                    <div className="stat-value" style={{ fontSize: 22, color: sevColor[nvh.vibrationSeverity.severityClass] }}>
                        {nvh.vibrationSeverity.severity}
                    </div>
                    <div className="stat-unit">ISO 10816 Class {nvh.vibrationSeverity.severityClass} ({nvh.vibrationSeverity.rmsVelocity.toFixed(2)} mm/s)</div>
                </div>
                <div className="stat-card orange">
                    <div className="stat-label">Sound Pressure</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{nvh.soundPressureLevel.toFixed(1)} dB(A)</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-label">Balancing Grade</div>
                    <div className="stat-value" style={{ fontSize: 16 }}>{nvh.balancingGrade}</div>
                </div>
            </div>

            {/* Resonance Warnings */}
            {nvh.resonances.length > 0 && (
                <div className="glass-card" style={{ marginBottom: 16, padding: 12 }}>
                    <div className="card-title" style={{ color: '#f59e0b', marginBottom: 8 }}>⚠️ Resonance Crossings Detected</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {nvh.resonances.map((r, i) => (
                            <Tag key={i} color={r.severity === 'HIGH' ? 'red' : r.severity === 'MEDIUM' ? 'orange' : 'blue'}>
                                Mode {r.mode} × {r.harmonic}x @ {r.criticalSpeed.toFixed(0)} RPM
                            </Tag>
                        ))}
                    </div>
                </div>
            )}

            <Tabs defaultActiveKey="fft" items={[
                {
                    key: 'fft', label: '📊 FFT Spectrum',
                    children: (
                        <div className="glass-card">
                            <Plot
                                data={[{
                                    x: nvh.spectrum.filter((_, i) => i % 4 === 0).map(s => s.frequency),
                                    y: nvh.spectrum.filter((_, i) => i % 4 === 0).map(s => s.amplitude),
                                    type: 'scatter', mode: 'lines', fill: 'tozeroy',
                                    line: { color: '#3b82f6', width: 1.5 },
                                    fillcolor: 'rgba(59,130,246,0.15)',
                                }, {
                                    x: nvh.harmonics.map(h => h.frequency),
                                    y: nvh.harmonics.map(h => h.amplitude),
                                    type: 'scatter', mode: 'markers+text',
                                    marker: { color: '#ef4444', size: 8 },
                                    text: nvh.harmonics.map(h => `${h.order}x`),
                                    textposition: 'top center', textfont: { color: '#ef4444', size: 10 },
                                    name: 'Harmonics',
                                }]}
                                layout={{
                                    ...darkLayout, title: { text: 'Vibration Spectrum', font: { size: 13, color: '#f1f5f9' } },
                                    xaxis: { ...darkLayout.xaxis, title: 'Frequency (Hz)' },
                                    yaxis: { ...darkLayout.yaxis, title: 'Amplitude (g)' }, showlegend: false
                                }}
                                config={{ displayModeBar: false, responsive: true }}
                                style={{ width: '100%', height: 420 }} useResizeHandler
                            />
                        </div>
                    ),
                },
                {
                    key: 'campbell', label: '🌊 Campbell Diagram',
                    children: (
                        <div className="glass-card">
                            <Plot
                                data={[
                                    { x: nvh.campbellData.map(d => d.speed), y: nvh.campbellData.map(d => d.meshFreq_1x), type: 'scatter', mode: 'lines', name: '1× Mesh', line: { color: '#3b82f6', width: 2 } },
                                    { x: nvh.campbellData.map(d => d.speed), y: nvh.campbellData.map(d => d.meshFreq_2x), type: 'scatter', mode: 'lines', name: '2× Mesh', line: { color: '#8b5cf6', width: 2 } },
                                    { x: nvh.campbellData.map(d => d.speed), y: nvh.campbellData.map(d => d.meshFreq_3x), type: 'scatter', mode: 'lines', name: '3× Mesh', line: { color: '#ec4899', width: 2 } },
                                    ...nvh.modes.map(m => ({
                                        x: nvh.speedRange, y: nvh.speedRange.map(() => m.frequency),
                                        type: 'scatter', mode: 'lines', name: `Mode ${m.mode}`,
                                        line: { color: '#f59e0b', width: 1, dash: 'dash' },
                                    })),
                                    {
                                        x: nvh.resonances.map(r => r.criticalSpeed), y: nvh.resonances.map(r => r.frequency),
                                        type: 'scatter', mode: 'markers', name: 'Resonance',
                                        marker: { color: '#ef4444', size: 12, symbol: 'x' }
                                    },
                                ]}
                                layout={{
                                    ...darkLayout, title: { text: 'Campbell Diagram', font: { size: 13, color: '#f1f5f9' } },
                                    xaxis: { ...darkLayout.xaxis, title: 'Speed (RPM)' },
                                    yaxis: { ...darkLayout.yaxis, title: 'Frequency (Hz)' }, legend: { font: { size: 10 }, bgcolor: 'rgba(0,0,0,0)' }
                                }}
                                config={{ displayModeBar: false, responsive: true }}
                                style={{ width: '100%', height: 420 }} useResizeHandler
                            />
                        </div>
                    ),
                },
                {
                    key: 'modes', label: '🔬 Modal Analysis',
                    children: (
                        <div className="glass-card">
                            <table style={{ width: '100%', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-glass)' }}>
                                        <th style={{ padding: 8, textAlign: 'left', color: '#60a5fa' }}>Mode</th>
                                        <th style={{ padding: 8, textAlign: 'left', color: '#60a5fa' }}>Type</th>
                                        <th style={{ padding: 8, textAlign: 'right', color: '#60a5fa' }}>Frequency (Hz)</th>
                                        <th style={{ padding: 8, textAlign: 'right', color: '#60a5fa' }}>Damping</th>
                                        <th style={{ padding: 8, textAlign: 'left', color: '#60a5fa' }}>Shape</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {nvh.modes.map((m, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                            <td style={{ padding: 8, fontWeight: 700, color: '#8b5cf6' }}>{m.mode}</td>
                                            <td style={{ padding: 8, color: 'var(--text-secondary)' }}>{m.type}</td>
                                            <td style={{ padding: 8, textAlign: 'right', fontFamily: 'JetBrains Mono', color: 'var(--accent-primary)' }}>{m.frequency.toFixed(1)}</td>
                                            <td style={{ padding: 8, textAlign: 'right', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>{(m.damping * 100).toFixed(1)}%</td>
                                            <td style={{ padding: 8, color: 'var(--text-secondary)' }}>{m.shape}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ),
                },
                {
                    key: 'micro', label: '⚙️ Microgeometry',
                    children: (
                        <div className="glass-card" style={{ padding: 20 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <div>
                                    <h4 style={{ color: '#60a5fa', marginBottom: 16 }}>🎛 Modify Microgeometry</h4>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 4 }}>Tip Relief (µm): {tipRelief}</label>
                                        <Slider min={0} max={30} value={tipRelief} onChange={setTipRelief} trackStyle={{ background: '#3b82f6' }} />
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 4 }}>Crowning (µm): {crowning}</label>
                                        <Slider min={0} max={20} value={crowning} onChange={setCrowning} trackStyle={{ background: '#8b5cf6' }} />
                                    </div>
                                    <div>
                                        <label style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 4 }}>Profile Shift (x): {profileShift.toFixed(2)}</label>
                                        <Slider min={-0.5} max={0.5} step={0.05} value={profileShift} onChange={setProfileShift} trackStyle={{ background: '#10b981' }} />
                                    </div>
                                </div>
                                <div>
                                    <h4 style={{ color: '#10b981', marginBottom: 16 }}>📈 Results</h4>
                                    <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                        <div className="stat-card blue">
                                            <div className="stat-label">Trans. Error</div>
                                            <div className="stat-value" style={{ fontSize: 18 }}>{nvh.microgeometry.current.te.toFixed(1)} µm</div>
                                        </div>
                                        <div className="stat-card green">
                                            <div className="stat-label">Optimal TE</div>
                                            <div className="stat-value" style={{ fontSize: 18 }}>{nvh.microgeometry.optimal.te.toFixed(1)} µm</div>
                                        </div>
                                        <div className="stat-card orange">
                                            <div className="stat-label">Current SPL</div>
                                            <div className="stat-value" style={{ fontSize: 18 }}>{nvh.microgeometry.current.spl.toFixed(1)} dB</div>
                                        </div>
                                        <div className="stat-card green">
                                            <div className="stat-label">Optimal SPL</div>
                                            <div className="stat-value" style={{ fontSize: 18 }}>{nvh.microgeometry.optimal.spl.toFixed(1)} dB</div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 12, padding: 10, background: 'rgba(16,185,129,0.1)', borderRadius: 8, fontSize: 12, color: '#10b981' }}>
                                        💡 Optimal: Tip Relief {nvh.microgeometry.optimal.tipRelief.toFixed(0)} µm, Crowning {nvh.microgeometry.optimal.crowning.toFixed(0)} µm
                                    </div>
                                </div>
                            </div>
                        </div>
                    ),
                },
            ]} />
        </div>
    );
}
