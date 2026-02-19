import React, { useState, useMemo, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
import { Tag, Tabs, Progress, Badge, Button } from 'antd';
import { runDigitalTwin } from '../calculations/digitalTwin';

const dl = {
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(10,14,26,0.8)',
    font: { family: 'Inter', color: '#94a3b8', size: 11 },
    margin: { l: 55, r: 25, t: 38, b: 45 },
    xaxis: { gridcolor: 'rgba(255,255,255,0.05)' }, yaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
    hoverlabel: { bgcolor: '#1a2035', bordercolor: '#3b82f6', font: { color: '#f1f5f9' } },
};

function AnimatedGauge({ label, value, unit, max, color, icon }) {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{label}</div>
            <Progress type="dashboard" percent={pct} size={100} strokeColor={color}
                format={() => <span style={{ color, fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 700 }}>{typeof value === 'number' ? value.toFixed(1) : value}</span>} />
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{unit}</div>
        </div>
    );
}

export default function DigitalTwinDashboard({ results, designParams }) {
    const [simHours, setSimHours] = useState(8760);
    const [running, setRunning] = useState(false);
    const [liveIdx, setLiveIdx] = useState(0);
    const intervalRef = useRef(null);

    const twin = useMemo(() => {
        return runDigitalTwin({
            power: designParams?.power || 2.237,
            speed_pinion: designParams?.speed_pinion || 1750,
            gearRatio: designParams?.gearRatio || 3.78,
            efficiency: results?.performance?.efficiency || 0.97,
            safetyFactorBending: results?.safetyFactors?.min_bending || 2.0,
            designLife: 1e7,
            operatingHours: simHours,
        });
    }, [results, designParams, simHours]);

    // Live animation
    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                setLiveIdx(prev => {
                    if (prev >= twin.sensorData.length - 1) { setRunning(false); return prev; }
                    return prev + 1;
                });
            }, 50);
        }
        return () => clearInterval(intervalRef.current);
    }, [running, twin.sensorData.length]);

    const live = twin.sensorData[liveIdx] || twin.currentStatus;
    const health = twin.healthHistory[liveIdx] || { health: twin.currentStatus.healthScore, damage: twin.currentStatus.cumulativeDamage };

    const healthColor = health.health > 70 ? '#10b981' : health.health > 40 ? '#f59e0b' : '#ef4444';

    return (
        <div className="animate-in content-area">
            {/* Live Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Button type="primary" onClick={() => { setRunning(!running); if (!running) setLiveIdx(0); }}
                    style={{ background: running ? '#ef4444' : '#3b82f6', border: 'none' }}>
                    {running ? '⏹ Stop Simulation' : '▶ Run Live Twin'}
                </Button>
                <Tag color="blue">Hour: {live.hour || Math.round(liveIdx * simHours / twin.sensorData.length)}</Tag>
                <Tag color={healthColor}>Health: {health.health.toFixed(0)}%</Tag>
                <Badge status={health.health > 70 ? 'success' : health.health > 40 ? 'warning' : 'error'} text={<span style={{ color: '#94a3b8', fontSize: 12 }}>
                    {health.health > 70 ? 'Normal' : health.health > 40 ? 'Degraded' : 'Critical'}
                </span>} />
            </div>

            {/* Live Gauges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
                <AnimatedGauge label="Speed" value={live.speed || 0} unit="RPM" max={3000} color="#3b82f6" icon="🔄" />
                <AnimatedGauge label="Torque" value={live.torque || 0} unit="N·m" max={100} color="#8b5cf6" icon="⚡" />
                <AnimatedGauge label="Temperature" value={live.temperature || 25} unit="°C" max={120} color="#f59e0b" icon="🌡" />
                <AnimatedGauge label="Vibration" value={live.vibration || 0} unit="mm/s" max={10} color="#ef4444" icon="📳" />
                <AnimatedGauge label="Oil Condition" value={live.oilCondition || 100} unit="%" max={100} color="#10b981" icon="💧" />
            </div>

            {/* Health & RUL */}
            <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card" style={{ borderTop: `3px solid ${healthColor}` }}>
                    <div className="stat-label">Health Score</div>
                    <div className="stat-value" style={{ fontSize: 32, color: healthColor }}>{health.health.toFixed(0)}%</div>
                    <div className="stat-unit">Damage: {(health.damage * 100).toFixed(1)}%</div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-label">Remaining Life (RUL)</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{twin.rul.hours > 1e6 ? '∞' : Math.round(twin.rul.hours).toLocaleString()} hrs</div>
                    <div className="stat-unit">Confidence: {(twin.rul.confidence * 100).toFixed(0)}%</div>
                </div>
                <div className="stat-card orange">
                    <div className="stat-label">Tooth Wear</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{twin.wear.depth_um.toFixed(2)} µm</div>
                    <div className="stat-unit">Volume: {twin.wear.volume_mm3.toFixed(4)} mm³</div>
                </div>
            </div>

            <Tabs defaultActiveKey="health" items={[
                {
                    key: 'health', label: '💚 Health Timeline',
                    children: (
                        <div className="glass-card">
                            <Plot data={[
                                { x: twin.healthHistory.map(d => d.hour), y: twin.healthHistory.map(d => d.health), name: 'Health %', type: 'scatter', mode: 'lines', line: { color: '#10b981', width: 2.5 } },
                                { x: twin.healthHistory.map(d => d.hour), y: twin.healthHistory.map(d => d.damage * 100), name: 'Damage %', type: 'scatter', mode: 'lines', line: { color: '#ef4444', width: 2, dash: 'dash' }, yaxis: 'y2' },
                            ]}
                                layout={{
                                    ...dl, title: { text: 'Health & Damage Over Time', font: { size: 13, color: '#f1f5f9' } },
                                    xaxis: { ...dl.xaxis, title: 'Operating Hours' },
                                    yaxis: { ...dl.yaxis, title: 'Health (%)', range: [0, 105] },
                                    yaxis2: { title: 'Damage (%)', overlaying: 'y', side: 'right', range: [0, 105], gridcolor: 'rgba(0,0,0,0)' },
                                    legend: { x: 0.5, y: 1.1, orientation: 'h', font: { size: 11 } }
                                }}
                                config={{ displayModeBar: false, responsive: true }}
                                style={{ width: '100%', height: 380 }} useResizeHandler />
                        </div>
                    ),
                },
                {
                    key: 'sensors', label: '📡 Sensor Data',
                    children: (
                        <div className="glass-card">
                            <Plot data={[
                                { x: twin.sensorData.map(d => d.hour), y: twin.sensorData.map(d => d.vibration), name: 'Vibration (mm/s)', type: 'scatter', mode: 'lines', line: { color: '#ef4444', width: 1.5 } },
                                { x: twin.sensorData.map(d => d.hour), y: twin.sensorData.map(d => d.temperature), name: 'Temperature (°C)', type: 'scatter', mode: 'lines', line: { color: '#f59e0b', width: 1.5 }, yaxis: 'y2' },
                            ]}
                                layout={{
                                    ...dl, title: { text: 'Sensor Trends', font: { size: 13, color: '#f1f5f9' } },
                                    xaxis: { ...dl.xaxis, title: 'Hours' },
                                    yaxis: { ...dl.yaxis, title: 'Vibration (mm/s)' },
                                    yaxis2: { title: 'Temperature (°C)', overlaying: 'y', side: 'right', gridcolor: 'rgba(0,0,0,0)' },
                                    legend: { x: 0.5, y: 1.1, orientation: 'h', font: { size: 11 } }
                                }}
                                config={{ displayModeBar: false, responsive: true }}
                                style={{ width: '100%', height: 380 }} useResizeHandler />
                        </div>
                    ),
                },
                {
                    key: 'anomalies', label: `🚨 Anomalies (${twin.anomalies.length})`,
                    children: (
                        <div className="glass-card" style={{ maxHeight: 400, overflowY: 'auto' }}>
                            {twin.anomalies.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 40, color: '#10b981' }}>✅ No anomalies detected</div>
                            ) : (
                                <table style={{ width: '100%', fontSize: 12 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border-glass)' }}>
                                            <th style={{ padding: 6, textAlign: 'left', color: '#60a5fa' }}>Hour</th>
                                            <th style={{ padding: 6, textAlign: 'left', color: '#60a5fa' }}>Type</th>
                                            <th style={{ padding: 6, textAlign: 'center', color: '#60a5fa' }}>Severity</th>
                                            <th style={{ padding: 6, textAlign: 'right', color: '#60a5fa' }}>Vib</th>
                                            <th style={{ padding: 6, textAlign: 'right', color: '#60a5fa' }}>Temp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {twin.anomalies.slice(0, 30).map((a, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)', opacity: 0.9 }}>
                                                <td style={{ padding: 6, fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)' }}>{a.hour}</td>
                                                <td style={{ padding: 6, color: 'var(--text-secondary)' }}>{a.type}</td>
                                                <td style={{ padding: 6, textAlign: 'center' }}>
                                                    <Tag color={a.severity === 'CRITICAL' ? 'red' : a.severity === 'WARNING' ? 'orange' : 'blue'}>{a.severity}</Tag>
                                                </td>
                                                <td style={{ padding: 6, textAlign: 'right', fontFamily: 'JetBrains Mono' }}>{a.vibration}</td>
                                                <td style={{ padding: 6, textAlign: 'right', fontFamily: 'JetBrains Mono' }}>{a.temperature}°</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ),
                },
                {
                    key: 'maintenance', label: '🔧 Maintenance',
                    children: (
                        <div className="glass-card">
                            <table style={{ width: '100%', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-glass)' }}>
                                        <th style={{ padding: 8, textAlign: 'right', color: '#60a5fa' }}>Interval (hrs)</th>
                                        <th style={{ padding: 8, textAlign: 'left', color: '#60a5fa' }}>Task</th>
                                        <th style={{ padding: 8, textAlign: 'center', color: '#60a5fa' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {twin.maintenanceSchedule.map((m, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                            <td style={{ padding: 8, fontFamily: 'JetBrains Mono', textAlign: 'right', color: 'var(--accent-primary)' }}>{m.interval.toLocaleString()}</td>
                                            <td style={{ padding: 8, color: 'var(--text-secondary)' }}>{m.task}</td>
                                            <td style={{ padding: 8, textAlign: 'center' }}>
                                                <Tag color={m.status === 'Due' ? 'red' : m.status === 'Predictive' ? 'purple' : 'blue'}>{m.status}</Tag>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ),
                },
            ]} />
        </div>
    );
}
