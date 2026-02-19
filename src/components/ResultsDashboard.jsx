import React from 'react';
import { Tabs } from 'antd';
import {
    CheckCircleOutlined, CloseCircleOutlined,
    ThunderboltOutlined
} from '@ant-design/icons';

const fmt = (v, decimals = 2) => {
    if (v === undefined || v === null || Number.isNaN(v)) return '—';
    return typeof v === 'number' ? v.toFixed(decimals) : String(v);
};

export default function ResultsDashboard({ results, unitSystem }) {
    if (!results) {
        return (
            <div className="animate-in" style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
                <h3 style={{ color: 'var(--text-secondary)' }}>No Analysis Results Yet</h3>
                <p>Configure your gear design and click "Analyze Design" to see results.</p>
            </div>
        );
    }

    const { geometry = {}, forces = {}, factors = {}, stresses = {}, safetyFactors = {}, performance = {}, trace = [] } = results;
    const gearType = results.gearType || 'spur';

    const sf = (v) => {
        const n = Number(v);
        return Number.isNaN(n) ? 0 : n;
    };
    const sfColor = (v) => { const n = sf(v); return n >= 2.0 ? 'var(--accent-success)' : n >= 1.0 ? 'var(--accent-warning)' : 'var(--accent-danger)'; };
    const sfBg = (v) => { const n = sf(v); return n >= 2.0 ? 'var(--gradient-success)' : n >= 1.0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--gradient-danger)'; };

    // Build safety gauge list dynamically (worm only has gear-side)
    const gauges = [];
    if (safetyFactors.bending_pinion !== undefined) gauges.push({ label: 'Bending — Pinion', value: safetyFactors.bending_pinion });
    if (safetyFactors.bending_gear !== undefined) gauges.push({ label: 'Bending — Gear', value: safetyFactors.bending_gear });
    if (safetyFactors.contact_pinion !== undefined) gauges.push({ label: 'Contact — Pinion', value: safetyFactors.contact_pinion });
    if (safetyFactors.contact_gear !== undefined) gauges.push({ label: 'Contact — Gear', value: safetyFactors.contact_gear });
    if (safetyFactors.wear_gear !== undefined) gauges.push({ label: 'Wear — Gear', value: safetyFactors.wear_gear });

    // Build geometry rows dynamically
    const geoRows = [];
    if (geometry.N_p !== undefined) geoRows.push(['Pinion Teeth (N_p)', geometry.N_p]);
    if (geometry.N_w !== undefined) geoRows.push(['Worm Threads (N_w)', geometry.N_w]);
    if (geometry.N_g !== undefined) geoRows.push(['Gear Teeth (N_g)', geometry.N_g]);
    if (geometry.m !== undefined) geoRows.push(['Module (m)', `${geometry.m} mm`]);
    if (geometry.m_t !== undefined) geoRows.push(['Transverse Module', `${geometry.m_t} mm`]);
    if (geometry.m_n !== undefined) geoRows.push(['Normal Module', `${fmt(geometry.m_n, 3)} mm`]);
    if (geometry.mod !== undefined && !geometry.m) geoRows.push(['Module', `${geometry.mod} mm`]);
    if (geometry.P_d !== undefined) geoRows.push(['Diametral Pitch (P_d)', `${fmt(geometry.P_d)} 1/in`]);
    if (geometry.d_p !== undefined) geoRows.push(['Pinion Pitch Dia', `${fmt(geometry.d_p)} mm`]);
    if (geometry.d_w !== undefined) geoRows.push(['Worm Pitch Dia', `${fmt(geometry.d_w)} mm`]);
    if (geometry.d_g !== undefined) geoRows.push(['Gear Pitch Dia', `${fmt(geometry.d_g)} mm`]);
    if (geometry.C !== undefined) geoRows.push(['Center Distance', `${fmt(geometry.C)} mm`]);
    if (geometry.F !== undefined) geoRows.push(['Face Width', `${fmt(geometry.F, 1)} mm`]);
    if (geometry.addendum !== undefined) geoRows.push(['Addendum', `${fmt(geometry.addendum, 3)} mm`]);
    if (geometry.dedendum !== undefined) geoRows.push(['Dedendum', `${fmt(geometry.dedendum, 3)} mm`]);
    if (geometry.outsideDiamPinion !== undefined) geoRows.push(['Outside Dia (Pinion)', `${fmt(geometry.outsideDiamPinion)} mm`]);
    if (geometry.outsideDiamGear !== undefined) geoRows.push(['Outside Dia (Gear)', `${fmt(geometry.outsideDiamGear)} mm`]);
    if (geometry.helixAngle !== undefined) geoRows.push(['Helix Angle', `${geometry.helixAngle}°`]);
    if (geometry.lambda_deg !== undefined) geoRows.push(['Lead Angle (λ)', `${fmt(geometry.lambda_deg)}°`]);
    if (geometry.gamma_p_deg !== undefined) geoRows.push(['Pitch Cone (Pinion)', `${fmt(geometry.gamma_p_deg)}°`]);
    if (geometry.gamma_g_deg !== undefined) geoRows.push(['Pitch Cone (Gear)', `${fmt(geometry.gamma_g_deg)}°`]);
    if (geometry.m_G !== undefined) geoRows.push(['Gear Ratio', fmt(geometry.m_G, 4)]);
    if (geometry.speed_gear !== undefined) geoRows.push(['Gear Speed', `${fmt(geometry.speed_gear, 1)} RPM`]);

    // Build stress rows dynamically
    const stressRows = [];
    if (stresses.s_t_pinion !== undefined) stressRows.push(['Bending Stress (Pinion)', `${fmt(stresses.s_t_pinion, 1)} MPa`, stresses.s_t_pinion_psi ? `${fmt(stresses.s_t_pinion_psi, 0)} psi` : '']);
    if (stresses.s_t_gear !== undefined) stressRows.push(['Bending Stress (Gear)', `${fmt(stresses.s_t_gear, 1)} MPa`, stresses.s_t_gear_psi ? `${fmt(stresses.s_t_gear_psi, 0)} psi` : '']);
    if (stresses.s_c !== undefined) stressRows.push(['Contact Stress', `${fmt(stresses.s_c, 1)} MPa`, stresses.s_c_psi ? `${fmt(stresses.s_c_psi, 0)} psi` : '']);
    if (stresses.s_at_pinion !== undefined) stressRows.push(['Allowable Bending (Pinion)', `${stresses.s_at_pinion} MPa`, '']);
    if (stresses.s_at_gear !== undefined) stressRows.push(['Allowable Bending (Gear)', `${stresses.s_at_gear} MPa`, '']);
    if (stresses.s_ac_pinion !== undefined) stressRows.push(['Allowable Contact (Pinion)', `${stresses.s_ac_pinion} MPa`, '']);
    if (stresses.s_ac_gear !== undefined) stressRows.push(['Allowable Contact (Gear)', `${stresses.s_ac_gear} MPa`, '']);

    // Forces rows
    const forceRows = [];
    if (forces.T_pinion !== undefined) forceRows.push(['Pinion Torque', `${fmt(forces.T_pinion)} N·m`]);
    if (forces.T_worm !== undefined) forceRows.push(['Worm Torque', `${fmt(forces.T_worm)} N·m`]);
    if (forces.T_gear !== undefined) forceRows.push(['Gear Torque', `${fmt(forces.T_gear)} N·m`]);
    if (forces.W_t !== undefined) forceRows.push(['Tangential Force (W_t)', `${fmt(forces.W_t, 1)} N${forces.W_t_lb ? ` (${fmt(forces.W_t_lb, 1)} lb)` : ''}`]);
    if (forces.W_t_worm !== undefined) forceRows.push(['Tangential (Worm)', `${fmt(forces.W_t_worm, 1)} N`]);
    if (forces.W_t_gear !== undefined) forceRows.push(['Tangential (Gear)', `${fmt(forces.W_t_gear, 1)} N`]);
    if (forces.W_r !== undefined) forceRows.push(['Radial Force (W_r)', `${fmt(forces.W_r, 1)} N`]);
    if (forces.W_n !== undefined) forceRows.push(['Normal Force (W_n)', `${fmt(forces.W_n, 1)} N`]);
    if (forces.W_a !== undefined) forceRows.push(['Axial Force (W_a)', `${fmt(forces.W_a, 1)} N`]);
    if (forces.V_pitch !== undefined) forceRows.push(['Pitch Line Velocity', `${fmt(forces.V_pitch, 1)} ft/min`]);
    if (forces.V_ms !== undefined) forceRows.push(['Velocity', `${fmt(forces.V_ms)} m/s`]);
    if (forces.V_s !== undefined) forceRows.push(['Sliding Velocity', `${fmt(forces.V_s)} m/s`]);

    // Factor rows
    const factorRows = [];
    if (factors.K_o !== undefined) factorRows.push(['Overload Factor (K_o)', fmt(factors.K_o, 3)]);
    if (factors.K_v !== undefined) factorRows.push(['Dynamic Factor (K_v)', fmt(factors.K_v, 3)]);
    if (factors.K_s !== undefined) factorRows.push(['Size Factor (K_s)', fmt(factors.K_s, 3)]);
    if (factors.K_m !== undefined) factorRows.push(['Load Distribution (K_m)', fmt(factors.K_m, 3)]);
    if (factors.K_B !== undefined) factorRows.push(['Rim Thickness (K_B)', fmt(factors.K_B, 3)]);
    if (factors.J_pinion !== undefined) factorRows.push(['Geometry J (Pinion)', fmt(factors.J_pinion, 4)]);
    if (factors.J_gear !== undefined) factorRows.push(['Geometry J (Gear)', fmt(factors.J_gear, 4)]);
    if (factors.I !== undefined) factorRows.push(['Pitting I', fmt(factors.I, 4)]);
    if (factors.C_p !== undefined) factorRows.push(['Elastic Coeff (C_p)', `${fmt(factors.C_p, 1)} √MPa`]);
    if (factors.K_R !== undefined) factorRows.push(['Reliability (K_R)', fmt(factors.K_R, 3)]);
    if (factors.K_T !== undefined) factorRows.push(['Temperature (K_T)', fmt(factors.K_T, 3)]);
    if (factors.Y_N_p !== undefined) factorRows.push(['Life Y_N (Pinion)', fmt(factors.Y_N_p, 3)]);
    if (factors.Z_N_p !== undefined) factorRows.push(['Life Z_N (Pinion)', fmt(factors.Z_N_p, 3)]);
    if (factors.mu !== undefined) factorRows.push(['Friction μ', fmt(factors.mu, 4)]);

    const renderTable = (rows, valueColor = 'var(--accent-primary)', hasThirdCol = false) => (
        <div className="glass-card">
            <table style={{ width: '100%', fontSize: 13 }}>
                <tbody>
                    {rows.map(([label, value, extra], i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{label}</td>
                            <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono', fontWeight: 600, color: valueColor, textAlign: 'right' }}>{value}</td>
                            {hasThirdCol && <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{extra || ''}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const gearLabel = gearType === 'worm' ? 'Worm Drive' : gearType.charAt(0).toUpperCase() + gearType.slice(1) + ' Gear';

    return (
        <div className="animate-in">
            {/* Gear Type Badge */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="status-badge info">⚙️ {gearLabel} Analysis</span>
                {performance.selfLocking !== undefined && (
                    <span className={`status-badge ${performance.selfLocking ? 'success' : 'warning'}`}>
                        🔒 {performance.selfLocking ? 'Self-Locking' : 'Back-Drivable'}
                    </span>
                )}
            </div>

            {/* Summary Stats */}
            <div className="stat-grid">
                <div className="stat-card blue">
                    <div className="stat-label">Gear Ratio</div>
                    <div className="stat-value">{fmt(geometry.m_G, 3)}</div>
                    <div className="stat-unit">
                        {geometry.N_p ? `${geometry.N_p}T / ${geometry.N_g}T` : geometry.N_w ? `${geometry.N_w}T / ${geometry.N_g}T` : ''}
                    </div>
                </div>
                <div className="stat-card green">
                    <div className="stat-label">Efficiency</div>
                    <div className="stat-value">{fmt(performance.efficiency * 100, 1)}%</div>
                    <div className="stat-unit">Loss: {fmt(performance.powerLoss, 3)} kW</div>
                </div>
                <div className="stat-card" style={{ borderTop: `3px solid ${sfColor(safetyFactors.min_bending)}` }}>
                    <div className="stat-label">SF Bending (Min)</div>
                    <div className="stat-value" style={{ color: sfColor(safetyFactors.min_bending) }}>
                        {fmt(safetyFactors.min_bending)}
                    </div>
                    <div className="stat-unit">{safetyFactors.bending_pass ? '✅ Pass' : '❌ Fail'}</div>
                </div>
                <div className="stat-card" style={{ borderTop: `3px solid ${sfColor(safetyFactors.min_contact)}` }}>
                    <div className="stat-label">SF Contact (Min)</div>
                    <div className="stat-value" style={{ color: sfColor(safetyFactors.min_contact) }}>
                        {fmt(safetyFactors.min_contact)}
                    </div>
                    <div className="stat-unit">{safetyFactors.contact_pass ? '✅ Pass' : '❌ Fail'}</div>
                </div>
            </div>

            {/* Safety Gauges */}
            <div className="glass-card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="title-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)' }}>
                            <ThunderboltOutlined />
                        </div>
                        Safety Factor Analysis
                    </div>
                    <span className={`status-badge ${safetyFactors.overall_pass ? 'success' : 'danger'}`}>
                        {safetyFactors.overall_pass ? <CheckCircleOutlined /> : <CloseCircleOutlined />} {safetyFactors.overall_pass ? 'PASS' : 'FAIL'}
                    </span>
                </div>
                {gauges.map((g, i) => (
                    <div key={i} className="safety-gauge" style={{ marginBottom: 8 }}>
                        <span className="gauge-label">{g.label}</span>
                        <div className="gauge-bar">
                            <div className="gauge-fill" style={{
                                width: `${Math.min(100, (sf(g.value) / 5) * 100)}%`,
                                background: sfBg(g.value)
                            }} />
                        </div>
                        <span className="gauge-value" style={{ color: sfColor(g.value) }}>
                            {fmt(g.value)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Performance info */}
            {performance.heatGenerated !== undefined && (
                <div className="glass-card" style={{ marginBottom: 20 }}>
                    <div className="card-title" style={{ marginBottom: 12 }}>🔥 Performance & Thermal</div>
                    <div className="stat-grid" style={{ marginBottom: 0 }}>
                        <div className="stat-card green">
                            <div className="stat-label">Power Loss</div>
                            <div className="stat-value" style={{ fontSize: 20 }}>{fmt(performance.powerLoss, 3)} kW</div>
                        </div>
                        <div className="stat-card orange">
                            <div className="stat-label">Heat Generated</div>
                            <div className="stat-value" style={{ fontSize: 20 }}>{fmt(performance.heatGenerated, 1)} W</div>
                        </div>
                        {performance.tempRise !== undefined && (
                            <div className="stat-card" style={{ borderTop: '3px solid var(--accent-danger)' }}>
                                <div className="stat-label">Temp Rise</div>
                                <div className="stat-value" style={{ fontSize: 20, color: 'var(--accent-danger)' }}>{fmt(performance.tempRise, 1)} °C</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Tabs defaultActiveKey="geometry" items={[
                {
                    key: 'geometry',
                    label: '📐 Geometry',
                    children: renderTable(geoRows)
                },
                {
                    key: 'stresses',
                    label: '💪 Stresses',
                    children: renderTable(stressRows, 'var(--accent-warning)', true)
                },
                {
                    key: 'forces',
                    label: '⚡ Forces',
                    children: renderTable(forceRows, 'var(--accent-info)')
                },
                {
                    key: 'factors',
                    label: '📊 AGMA Factors',
                    children: renderTable(factorRows, 'var(--accent-secondary)')
                },
                {
                    key: 'trace',
                    label: '📝 Calc Trace',
                    children: (
                        <div className="calc-trace">
                            {trace && trace.map((t, i) => (
                                <div key={i} className="trace-step">
                                    <span className="label">Step {t.step}: {t.label}</span>
                                    <span className="value">{t.value}</span>
                                    {t.formula && <span className="formula">{t.formula}</span>}
                                </div>
                            ))}
                        </div>
                    )
                }
            ]} />
        </div>
    );
}
