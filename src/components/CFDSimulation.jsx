import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Tag, Tabs } from 'antd';
import { analyzeCFDThermal } from '../calculations/cfdThermal';

const dl = {
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(10,14,26,0.8)',
    font: { family: 'Inter', color: '#94a3b8', size: 11 },
    margin: { l: 55, r: 25, t: 38, b: 45 },
    xaxis: { gridcolor: 'rgba(255,255,255,0.05)' }, yaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
    hoverlabel: { bgcolor: '#1a2035', bordercolor: '#3b82f6', font: { color: '#f1f5f9' } },
};

export default function CFDSimulation({ results, designParams }) {
    const cfd = useMemo(() => {
        const geom = results?.geometry || {};
        return analyzeCFDThermal({
            power: designParams?.power || 2.237,
            speed_pinion: designParams?.speed_pinion || 1750,
            gearRatio: designParams?.gearRatio || 3.78,
            efficiency: results?.performance?.efficiency || 0.97,
            module: designParams?.module || 2,
            faceWidth: designParams?.faceWidth || 13,
            N_p: geom.N_p || designParams?.numTeethPinion || 18,
            N_g: geom.N_g || 68,
        });
    }, [results, designParams]);

    const { losses, thermal, ehl, cooling, lubricant, churningMap } = cfd;
    const regimeColor = { 'Full Film (EHL)': '#10b981', 'Mixed Film': '#f59e0b', 'Boundary': '#ef4444', 'Dry Contact (DANGER)': '#dc2626' };

    return (
        <div className="animate-in content-area">
            {/* Top Cards */}
            <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card orange">
                    <div className="stat-label">Total Power Loss</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{losses.total.toFixed(1)} W</div>
                </div>
                <div className="stat-card" style={{ borderTop: '3px solid #ef4444' }}>
                    <div className="stat-label">Oil Temperature (SS)</div>
                    <div className="stat-value" style={{ fontSize: 22, color: thermal.steadyState.T_oil > lubricant.maxTemp ? '#ef4444' : '#10b981' }}>
                        {thermal.steadyState.T_oil.toFixed(1)} °C
                    </div>
                    <div className="stat-unit">Max: {lubricant.maxTemp} °C</div>
                </div>
                <div className="stat-card" style={{ borderTop: `3px solid ${regimeColor[ehl.lubRegime] || '#60a5fa'}` }}>
                    <div className="stat-label">Lubrication Regime</div>
                    <div className="stat-value" style={{ fontSize: 16, color: regimeColor[ehl.lubRegime] }}>{ehl.lubRegime}</div>
                    <div className="stat-unit">Λ = {ehl.lambdaRatio.toFixed(2)} | h_min = {ehl.h_min_um.toFixed(2)} µm</div>
                </div>
                <div className="stat-card" style={{ borderTop: `3px solid ${cooling.adequate ? '#10b981' : '#ef4444'}` }}>
                    <div className="stat-label">Cooling</div>
                    <div className="stat-value" style={{ fontSize: 16 }}>{cooling.adequate ? '✅ Adequate' : '❌ Insufficient'}</div>
                    <div className="stat-unit">Rec: {cooling.recommended}</div>
                </div>
            </div>

            <Tabs defaultActiveKey="losses" items={[
                {
                    key: 'losses', label: '🔥 Power Losses',
                    children: (
                        <div className="glass-card">
                            <Plot data={[{
                                values: [losses.mesh, losses.churning, losses.windage, losses.bearing, losses.seal],
                                labels: ['Mesh Friction', 'Oil Churning', 'Windage', 'Bearings', 'Seals'],
                                type: 'pie', hole: 0.55,
                                marker: { colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#64748b'] },
                                textfont: { color: '#f1f5f9', size: 12 },
                                hoverinfo: 'label+value+percent',
                            }]}
                                layout={{ ...dl, title: { text: 'Power Loss Distribution (W)', font: { size: 13, color: '#f1f5f9' } }, showlegend: true, legend: { font: { size: 11 } } }}
                                config={{ displayModeBar: false, responsive: true }}
                                style={{ width: '100%', height: 400 }} useResizeHandler />
                        </div>
                    ),
                },
                {
                    key: 'thermal', label: '🌡 Thermal',
                    children: (
                        <div className="glass-card">
                            <Plot data={[
                                { x: thermal.transient.map(d => d.time), y: thermal.transient.map(d => d.T_oil), name: 'Oil Sump', type: 'scatter', mode: 'lines', line: { color: '#ef4444', width: 2.5 } },
                                { x: thermal.transient.map(d => d.time), y: thermal.transient.map(d => d.T_mesh), name: 'Gear Mesh', type: 'scatter', mode: 'lines', line: { color: '#f59e0b', width: 2 } },
                                { x: thermal.transient.map(d => d.time), y: thermal.transient.map(d => d.T_housing), name: 'Housing', type: 'scatter', mode: 'lines', line: { color: '#60a5fa', width: 2 } },
                                { x: [0, thermal.transient[thermal.transient.length - 1]?.time], y: [lubricant.maxTemp, lubricant.maxTemp], name: 'Max Limit', type: 'scatter', mode: 'lines', line: { color: '#dc2626', dash: 'dash', width: 1.5 } },
                            ]}
                                layout={{
                                    ...dl, title: { text: 'Temperature Rise Over Time', font: { size: 13, color: '#f1f5f9' } },
                                    xaxis: { ...dl.xaxis, title: 'Time (min)' }, yaxis: { ...dl.yaxis, title: 'Temperature (°C)' }
                                }}
                                config={{ displayModeBar: false, responsive: true }}
                                style={{ width: '100%', height: 400 }} useResizeHandler />
                        </div>
                    ),
                },
                {
                    key: 'film', label: '💧 Film Thickness',
                    children: (
                        <div className="glass-card" style={{ padding: 20 }}>
                            <h4 style={{ color: '#60a5fa', marginBottom: 16 }}>EHL (Dowson-Higginson) Analysis</h4>
                            <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                <div className="stat-card blue">
                                    <div className="stat-label">Min Film Thickness</div>
                                    <div className="stat-value" style={{ fontSize: 20 }}>{ehl.h_min_um.toFixed(3)} µm</div>
                                </div>
                                <div className="stat-card" style={{ borderTop: `3px solid ${regimeColor[ehl.lubRegime]}` }}>
                                    <div className="stat-label">Lambda Ratio (Λ)</div>
                                    <div className="stat-value" style={{ fontSize: 20, color: regimeColor[ehl.lubRegime] }}>{ehl.lambdaRatio.toFixed(2)}</div>
                                    <div className="stat-unit">{ehl.lubRegime}</div>
                                </div>
                                <div className="stat-card green">
                                    <div className="stat-label">Entrainment Velocity</div>
                                    <div className="stat-value" style={{ fontSize: 20 }}>{ehl.entrainmentVelocity.toFixed(2)} m/s</div>
                                </div>
                            </div>
                            <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'rgba(59,130,246,0.08)', fontSize: 13, color: '#94a3b8' }}>
                                <strong style={{ color: '#60a5fa' }}>Lubricant:</strong> {lubricant.name} ISO VG {lubricant.isoVG}<br />
                                <strong style={{ color: '#60a5fa' }}>Viscosity:</strong> {lubricant.viscosity40} cSt @ 40°C | {lubricant.viscosity100.toFixed(1)} cSt @ 100°C | VI: {lubricant.viscosityIndex}
                            </div>
                            {/* Lambda scale gauge */}
                            <div style={{ marginTop: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                                    <span>Boundary</span><span>Mixed</span><span>Full Film</span>
                                </div>
                                <div style={{ height: 16, borderRadius: 8, background: 'linear-gradient(to right, #ef4444 0%, #f59e0b 33%, #10b981 66%, #10b981 100%)', position: 'relative' }}>
                                    <div style={{
                                        position: 'absolute', left: `${Math.min(100, (ehl.lambdaRatio / 4) * 100)}%`,
                                        top: -4, width: 24, height: 24, borderRadius: '50%', background: '#fff', border: '3px solid #1a2035',
                                        transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 8, fontWeight: 700, color: '#1a2035',
                                    }}>{ehl.lambdaRatio.toFixed(1)}</div>
                                </div>
                            </div>
                        </div>
                    ),
                },
                {
                    key: 'churning', label: '🌀 Churning',
                    children: (
                        <div className="glass-card">
                            <Plot data={[{
                                x: churningMap.map(d => d.speed), y: churningMap.map(d => d.loss),
                                type: 'scatter', mode: 'lines', fill: 'tozeroy',
                                line: { color: '#8b5cf6', width: 2.5 }, fillcolor: 'rgba(139,92,246,0.15)',
                            }]}
                                layout={{
                                    ...dl, title: { text: 'Oil Churning Loss vs Speed', font: { size: 13, color: '#f1f5f9' } },
                                    xaxis: { ...dl.xaxis, title: 'Speed (RPM)' }, yaxis: { ...dl.yaxis, title: 'Churning Loss (W)' }
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
