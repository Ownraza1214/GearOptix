import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Tag, Tabs } from 'antd';
import { analyzeMultibodyDynamics } from '../calculations/multibodyDynamics';

const dl = {
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(10,14,26,0.8)',
    font: { family: 'Inter', color: '#94a3b8', size: 11 },
    margin: { l: 55, r: 25, t: 38, b: 45 },
    xaxis: { gridcolor: 'rgba(255,255,255,0.05)' }, yaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
    hoverlabel: { bgcolor: '#1a2035', bordercolor: '#3b82f6', font: { color: '#f1f5f9' } },
};

export default function DrivetrainBuilder({ results, designParams }) {
    const mbd = useMemo(() => {
        return analyzeMultibodyDynamics({
            stages: [{ N_p: designParams?.numTeethPinion || 18, N_g: Math.round((designParams?.numTeethPinion || 18) * (designParams?.gearRatio || 3.78)), module: designParams?.module || 2, faceWidth: designParams?.faceWidth || 13, type: designParams?.gearType || 'spur' }],
            speed_input: designParams?.speed_pinion || 1750,
            torque_input: ((designParams?.power || 2.237) * 1000 * 60) / (2 * Math.PI * (designParams?.speed_pinion || 1750)),
            power_input: designParams?.power || 2.237,
        });
    }, [results, designParams]);

    const { stages, overall, shafts, bearings, criticalSpeeds, dynamicResponse } = mbd;

    return (
        <div className="animate-in content-area">
            {/* Overall Summary */}
            <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card blue">
                    <div className="stat-label">Overall Ratio</div>
                    <div className="stat-value">{overall.ratio.toFixed(3)}</div>
                    <div className="stat-unit">{stages.length} stage{stages.length > 1 ? 's' : ''}</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-label">Overall Efficiency</div>
                    <div className="stat-value">{(overall.efficiency * 100).toFixed(1)}%</div>
                </div>
                <div className="stat-card orange">
                    <div className="stat-label">Output Speed</div>
                    <div className="stat-value">{overall.outputSpeed.toFixed(1)} RPM</div>
                </div>
                <div className="stat-card" style={{ borderTop: '3px solid #8b5cf6' }}>
                    <div className="stat-label">Output Torque</div>
                    <div className="stat-value">{overall.outputTorque.toFixed(1)} N·m</div>
                </div>
            </div>

            {/* Drivetrain Schematic */}
            <div className="glass-card" style={{ padding: 20, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
                <div className="card-title" style={{ marginBottom: 16 }}>🔗 Drivetrain Schematic</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '20px 0' }}>
                    {/* Motor */}
                    <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.15)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.3)', textAlign: 'center', minWidth: 80 }}>
                        <div style={{ fontSize: 24 }}>⚡</div>
                        <div style={{ fontSize: 10, color: '#60a5fa', fontWeight: 600 }}>MOTOR</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{overall.inputSpeed} RPM</div>
                    </div>
                    {/* Stages */}
                    {stages.map((stage, i) => (
                        <React.Fragment key={i}>
                            {/* Shaft connector */}
                            <div style={{ width: 40, height: 4, background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', borderRadius: 2 }} />
                            {/* Bearing */}
                            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #f59e0b', background: 'rgba(245,158,11,0.2)' }} />
                            <div style={{ width: 20, height: 4, background: '#8b5cf6', borderRadius: 2 }} />
                            {/* Gear mesh */}
                            <div style={{ padding: '12px 16px', background: 'rgba(139,92,246,0.15)', borderRadius: 8, border: '1px solid rgba(139,92,246,0.3)', textAlign: 'center' }}>
                                <div style={{ fontSize: 20 }}>⚙️</div>
                                <div style={{ fontSize: 10, color: '#8b5cf6', fontWeight: 600 }}>STAGE {stage.stage}</div>
                                <div style={{ fontSize: 10, color: '#94a3b8' }}>{stage.type.toUpperCase()}</div>
                                <div style={{ fontSize: 10, color: '#64748b' }}>{stage.ratio.toFixed(2)}:1</div>
                            </div>
                            <div style={{ width: 20, height: 4, background: '#8b5cf6', borderRadius: 2 }} />
                            {/* Bearing */}
                            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #f59e0b', background: 'rgba(245,158,11,0.2)' }} />
                        </React.Fragment>
                    ))}
                    <div style={{ width: 40, height: 4, background: 'linear-gradient(to right, #8b5cf6, #10b981)', borderRadius: 2 }} />
                    {/* Load */}
                    <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.15)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center', minWidth: 80 }}>
                        <div style={{ fontSize: 24 }}>🏭</div>
                        <div style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>LOAD</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{overall.outputSpeed.toFixed(0)} RPM</div>
                    </div>
                </div>
            </div>

            <Tabs defaultActiveKey="shafts" items={[
                {
                    key: 'shafts', label: '🔩 Shaft Analysis',
                    children: (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {shafts.map((shaft, i) => (
                                <div className="glass-card" key={i} style={{ padding: 16 }}>
                                    <h4 style={{ color: '#60a5fa', marginBottom: 12 }}>Shaft: {shaft.id}</h4>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                                        L = {shaft.length} mm | Ø = {shaft.diameter} mm | Mass = {shaft.mass.toFixed(3)} kg<br />
                                        Deflection = {shaft.deflection_um.toFixed(2)} µm | Slope = {shaft.slopeAtBearing_arcmin.toFixed(3)} arcmin
                                    </div>
                                    <Plot data={[
                                        { x: shaft.bendingDiagram.map(d => d.position), y: shaft.bendingDiagram.map(d => d.value), name: 'Bending Moment', type: 'scatter', mode: 'lines', fill: 'tozeroy', line: { color: '#3b82f6', width: 2 }, fillcolor: 'rgba(59,130,246,0.15)' },
                                    ]}
                                        layout={{ ...dl, height: 200, margin: { ...dl.margin, t: 10 }, xaxis: { ...dl.xaxis, title: 'Position (mm)' }, yaxis: { ...dl.yaxis, title: 'M (N·m)' } }}
                                        config={{ displayModeBar: false, responsive: true }}
                                        style={{ width: '100%', height: 200 }} useResizeHandler />
                                </div>
                            ))}
                        </div>
                    ),
                },
                {
                    key: 'bearings', label: '🔴 Bearings',
                    children: (
                        <div className="glass-card">
                            <table style={{ width: '100%', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-glass)' }}>
                                        {['Bearing', 'Type', 'Radial (N)', 'Equiv (N)', 'L10 (hrs)', 'Status'].map(h => (
                                            <th key={h} style={{ padding: 8, textAlign: h === 'Status' ? 'center' : 'right', color: '#60a5fa' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {bearings.map((b, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                            <td style={{ padding: 8, color: 'var(--text-secondary)' }}>{b.id}</td>
                                            <td style={{ padding: 8, textAlign: 'right', color: 'var(--text-muted)' }}>{b.type}</td>
                                            <td style={{ padding: 8, textAlign: 'right', fontFamily: 'JetBrains Mono' }}>{b.radialLoad.toFixed(0)}</td>
                                            <td style={{ padding: 8, textAlign: 'right', fontFamily: 'JetBrains Mono' }}>{b.equivalentLoad.toFixed(0)}</td>
                                            <td style={{ padding: 8, textAlign: 'right', fontFamily: 'JetBrains Mono', color: 'var(--accent-primary)' }}>{Math.round(b.L10_hours).toLocaleString()}</td>
                                            <td style={{ padding: 8, textAlign: 'center' }}>
                                                <Tag color={b.adequate ? 'green' : 'red'}>{b.adequate ? 'OK' : 'UNDERSIZED'}</Tag>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ),
                },
                {
                    key: 'critspeed', label: '⚡ Critical Speeds',
                    children: (
                        <div className="glass-card">
                            <table style={{ width: '100%', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-glass)' }}>
                                        {['Shaft', 'Mode', 'Frequency (Hz)', 'Critical RPM', 'Op. Ratio', 'Safe'].map(h => (
                                            <th key={h} style={{ padding: 8, textAlign: 'right', color: '#60a5fa' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {criticalSpeeds.map((cs, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                            <td style={{ padding: 8, color: 'var(--text-secondary)', textAlign: 'right' }}>{cs.shaft}</td>
                                            <td style={{ padding: 8, fontFamily: 'JetBrains Mono', textAlign: 'right' }}>{cs.mode}</td>
                                            <td style={{ padding: 8, fontFamily: 'JetBrains Mono', textAlign: 'right', color: 'var(--accent-primary)' }}>{cs.frequency.toFixed(1)}</td>
                                            <td style={{ padding: 8, fontFamily: 'JetBrains Mono', textAlign: 'right' }}>{Math.round(cs.criticalRPM).toLocaleString()}</td>
                                            <td style={{ padding: 8, fontFamily: 'JetBrains Mono', textAlign: 'right', color: cs.safe ? '#10b981' : '#ef4444' }}>{cs.operatingRatio.toFixed(2)}</td>
                                            <td style={{ padding: 8, textAlign: 'right' }}><Tag color={cs.safe ? 'green' : 'red'}>{cs.safe ? 'OK' : 'NEAR'}</Tag></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ),
                },
                {
                    key: 'dynamics', label: '📈 Dynamic Response',
                    children: (
                        <div className="glass-card">
                            <Plot data={[
                                { x: dynamicResponse.map(d => d.time * 1000), y: dynamicResponse.map(d => d.omega1), name: 'Input Shaft (RPM)', type: 'scatter', mode: 'lines', line: { color: '#3b82f6', width: 1.5 } },
                                { x: dynamicResponse.map(d => d.time * 1000), y: dynamicResponse.map(d => d.omega2), name: 'Output Shaft (RPM)', type: 'scatter', mode: 'lines', line: { color: '#10b981', width: 1.5 } },
                            ]}
                                layout={{
                                    ...dl, title: { text: 'Transient Torsional Response (RK4)', font: { size: 13, color: '#f1f5f9' } },
                                    xaxis: { ...dl.xaxis, title: 'Time (ms)' }, yaxis: { ...dl.yaxis, title: 'Speed (RPM)' },
                                    legend: { font: { size: 11 }, bgcolor: 'rgba(0,0,0,0)' }
                                }}
                                config={{ displayModeBar: false, responsive: true }}
                                style={{ width: '100%', height: 400 }} useResizeHandler />
                        </div>
                    ),
                },
            ]} />
        </div>
    );
}
