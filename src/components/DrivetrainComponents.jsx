import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Tabs, Tag, Select } from 'antd';
import { analyzeMotor, analyzeClutch, analyzeBrake } from '../calculations/clutchBrakeMotor';

const dl = {
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(10,14,26,0.8)',
    font: { family: 'Inter', color: '#94a3b8', size: 11 },
    margin: { l: 55, r: 25, t: 38, b: 45 },
    xaxis: { gridcolor: 'rgba(255,255,255,0.05)' }, yaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
    hoverlabel: { bgcolor: '#1a2035', bordercolor: '#3b82f6', font: { color: '#f1f5f9' } },
};

export default function DrivetrainComponents({ results, designParams }) {
    const torque = useMemo(() => ((designParams?.power || 2.237) * 1000 * 60) / (2 * Math.PI * (designParams?.speed_pinion || 1750)), [designParams]);

    const motor = useMemo(() => analyzeMotor({
        requiredPower: designParams?.power || 2.237,
        requiredSpeed: designParams?.speed_pinion || 1750,
        requiredTorque: torque,
    }), [designParams, torque]);

    const clutch = useMemo(() => analyzeClutch({ torqueCapacity: torque * 1.5, inputSpeed: designParams?.speed_pinion || 1750 }), [designParams, torque]);
    const brake = useMemo(() => analyzeBrake({ brakingTorque: torque * 1.2, inputSpeed: designParams?.speed_pinion || 500 }), [designParams, torque]);

    return (
        <div className="animate-in content-area">
            <Tabs defaultActiveKey="motor" items={[
                {
                    key: 'motor', label: '⚡ Motor Selection',
                    children: (
                        <div>
                            <div className="stat-grid" style={{ marginBottom: 20 }}>
                                <div className="stat-card blue">
                                    <div className="stat-label">Selected Motor</div>
                                    <div className="stat-value" style={{ fontSize: 22 }}>{motor.selected.power} kW</div>
                                    <div className="stat-unit">{motor.selected.type.replace('_', ' ')}</div>
                                </div>
                                <div className="stat-card green">
                                    <div className="stat-label">Rated Speed</div>
                                    <div className="stat-value" style={{ fontSize: 22 }}>{motor.selected.ratedSpeed.toFixed(0)} RPM</div>
                                    <div className="stat-unit">Slip: {(motor.selected.slip * 100).toFixed(1)}%</div>
                                </div>
                                <div className="stat-card orange">
                                    <div className="stat-label">Rated Torque</div>
                                    <div className="stat-value" style={{ fontSize: 22 }}>{motor.selected.ratedTorque.toFixed(1)} N·m</div>
                                </div>
                                <div className="stat-card" style={{ borderTop: `3px solid ${motor.operatingPoint.withinCapability ? '#10b981' : '#ef4444'}` }}>
                                    <div className="stat-label">Load {motor.operatingPoint.loadPercent.toFixed(0)}%</div>
                                    <div className="stat-value" style={{ fontSize: 22 }}>{motor.operatingPoint.withinCapability ? '✅' : '❌'}</div>
                                    <div className="stat-unit">T_bd/T_rated = {motor.startingPerformance.breakdownToRated.toFixed(1)}</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="glass-card">
                                    <Plot data={[
                                        { x: motor.torqueSpeedCurve.map(d => d.speed), y: motor.torqueSpeedCurve.map(d => d.torque), name: 'Motor T-S Curve', type: 'scatter', mode: 'lines', line: { color: '#3b82f6', width: 2.5 } },
                                        { x: [motor.operatingPoint.speed], y: [motor.operatingPoint.torque], name: 'Operating Point', type: 'scatter', mode: 'markers', marker: { color: '#ef4444', size: 12, symbol: 'star' } },
                                    ]}
                                        layout={{
                                            ...dl, title: { text: 'Torque-Speed Curve', font: { size: 13, color: '#f1f5f9' } },
                                            xaxis: { ...dl.xaxis, title: 'Speed (RPM)' }, yaxis: { ...dl.yaxis, title: 'Torque (N·m)' }
                                        }}
                                        config={{ displayModeBar: false, responsive: true }}
                                        style={{ width: '100%', height: 350 }} useResizeHandler />
                                </div>
                                <div className="glass-card">
                                    <Plot data={[{
                                        x: motor.efficiencyMap.map(d => d.loadPercent), y: motor.efficiencyMap.map(d => d.efficiency * 100),
                                        type: 'scatter', mode: 'lines', fill: 'tozeroy',
                                        line: { color: '#10b981', width: 2.5 }, fillcolor: 'rgba(16,185,129,0.15)',
                                    }]}
                                        layout={{
                                            ...dl, title: { text: 'Motor Efficiency Map', font: { size: 13, color: '#f1f5f9' } },
                                            xaxis: { ...dl.xaxis, title: 'Load (%)' }, yaxis: { ...dl.yaxis, title: 'Efficiency (%)', range: [50, 100] }
                                        }}
                                        config={{ displayModeBar: false, responsive: true }}
                                        style={{ width: '100%', height: 350 }} useResizeHandler />
                                </div>
                            </div>
                        </div>
                    ),
                },
                {
                    key: 'clutch', label: '🔘 Clutch Design',
                    children: (
                        <div>
                            <div className="stat-grid" style={{ marginBottom: 20 }}>
                                <div className="stat-card" style={{ borderTop: `3px solid ${clutch.capacity.adequate ? '#10b981' : '#ef4444'}` }}>
                                    <div className="stat-label">Torque Capacity</div>
                                    <div className="stat-value" style={{ fontSize: 22 }}>{clutch.capacity.torque.toFixed(1)} N·m</div>
                                    <div className="stat-unit">SF = {clutch.capacity.safetyFactor.toFixed(2)}</div>
                                </div>
                                <div className="stat-card blue">
                                    <div className="stat-label">Engagement Time</div>
                                    <div className="stat-value" style={{ fontSize: 22 }}>{clutch.engagement.time.toFixed(0)} ms</div>
                                </div>
                                <div className="stat-card orange">
                                    <div className="stat-label">Energy Absorbed</div>
                                    <div className="stat-value" style={{ fontSize: 22 }}>{clutch.engagement.energy.toFixed(1)} J</div>
                                </div>
                                <div className="stat-card" style={{ borderTop: '3px solid #ef4444' }}>
                                    <div className="stat-label">Temp Rise</div>
                                    <div className="stat-value" style={{ fontSize: 22 }}>{clutch.engagement.tempRise.toFixed(1)} °C</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="glass-card">
                                    <Plot data={[
                                        { x: clutch.engagementProfile.map(d => d.time), y: clutch.engagementProfile.map(d => d.speedInput), name: 'Input Speed', type: 'scatter', mode: 'lines', line: { color: '#3b82f6', width: 2 } },
                                        { x: clutch.engagementProfile.map(d => d.time), y: clutch.engagementProfile.map(d => d.speedOutput), name: 'Output Speed', type: 'scatter', mode: 'lines', line: { color: '#10b981', width: 2 } },
                                    ]}
                                        layout={{
                                            ...dl, title: { text: 'Clutch Engagement Dynamics', font: { size: 13, color: '#f1f5f9' } },
                                            xaxis: { ...dl.xaxis, title: 'Time (ms)' }, yaxis: { ...dl.yaxis, title: 'Speed (RPM)' }
                                        }}
                                        config={{ displayModeBar: false, responsive: true }}
                                        style={{ width: '100%', height: 350 }} useResizeHandler />
                                </div>
                                <div className="glass-card" style={{ padding: 16 }}>
                                    <h4 style={{ color: '#60a5fa', marginBottom: 12 }}>Design Details</h4>
                                    <table style={{ width: '100%', fontSize: 12 }}>
                                        <tbody>
                                            {[
                                                ['Type', clutch.design.type.replace('_', ' ')],
                                                ['Surfaces', clutch.design.numSurfaces],
                                                ['Outer Radius', `${clutch.design.outerRadius.toFixed(0)} mm`],
                                                ['Inner Radius', `${clutch.design.innerRadius.toFixed(0)} mm`],
                                                ['Friction Radius', `${clutch.design.frictionRadius.toFixed(1)} mm`],
                                                ['µ', clutch.design.frictionCoeff],
                                                ['Act. Force', `${clutch.actuation.force.toFixed(0)} N`],
                                                ['Pressure', `${clutch.actuation.pressure.toFixed(2)} MPa`],
                                                ['PV Value', `${(clutch.wear.pvValue / 1e6).toFixed(2)} MPa·m/s`],
                                                ['Wear OK', clutch.wear.adequate ? '✅' : '❌'],
                                            ].map(([label, val], i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                    <td style={{ padding: 6, color: 'var(--text-secondary)' }}>{label}</td>
                                                    <td style={{ padding: 6, fontFamily: 'JetBrains Mono', textAlign: 'right', color: 'var(--accent-primary)' }}>{val}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ),
                },
                {
                    key: 'brake', label: '🛑 Brake Design',
                    children: (
                        <div>
                            <div className="stat-grid" style={{ marginBottom: 20 }}>
                                <div className="stat-card blue">
                                    <div className="stat-label">Braking Torque</div>
                                    <div className="stat-value" style={{ fontSize: 22 }}>{brake.performance.brakingTorque.toFixed(1)} N·m</div>
                                </div>
                                <div className="stat-card green">
                                    <div className="stat-label">Stopping Time</div>
                                    <div className="stat-value" style={{ fontSize: 22 }}>{brake.performance.stoppingTime.toFixed(0)} ms</div>
                                </div>
                                <div className="stat-card orange">
                                    <div className="stat-label">Energy Absorbed</div>
                                    <div className="stat-value" style={{ fontSize: 22 }}>{brake.performance.energyAbsorbed.toFixed(0)} J</div>
                                </div>
                                <div className="stat-card" style={{ borderTop: `3px solid ${brake.thermal.thermalFade ? '#ef4444' : '#10b981'}` }}>
                                    <div className="stat-label">Thermal Fade</div>
                                    <div className="stat-value" style={{ fontSize: 22 }}>{brake.thermal.thermalFade ? '⚠️ YES' : '✅ No'}</div>
                                    <div className="stat-unit">ΔT = {brake.thermal.tempRise.toFixed(1)} °C</div>
                                </div>
                            </div>
                            <div className="glass-card">
                                <Plot data={[
                                    { x: brake.brakingCurve.map(d => d.time), y: brake.brakingCurve.map(d => d.speed), name: 'Speed (RPM)', type: 'scatter', mode: 'lines', line: { color: '#3b82f6', width: 2.5 } },
                                    { x: brake.brakingCurve.map(d => d.time), y: brake.brakingCurve.map(d => d.temperature), name: 'Temperature (°C)', type: 'scatter', mode: 'lines', line: { color: '#ef4444', width: 2 }, yaxis: 'y2' },
                                ]}
                                    layout={{
                                        ...dl, title: { text: 'Braking Curve', font: { size: 13, color: '#f1f5f9' } },
                                        xaxis: { ...dl.xaxis, title: 'Time (ms)' }, yaxis: { ...dl.yaxis, title: 'Speed (RPM)' },
                                        yaxis2: { title: 'Temp (°C)', overlaying: 'y', side: 'right', gridcolor: 'rgba(0,0,0,0)' }, legend: { font: { size: 11 }, bgcolor: 'rgba(0,0,0,0)' }
                                    }}
                                    config={{ displayModeBar: false, responsive: true }}
                                    style={{ width: '100%', height: 400 }} useResizeHandler />
                            </div>
                        </div>
                    ),
                },
            ]} />
        </div>
    );
}
