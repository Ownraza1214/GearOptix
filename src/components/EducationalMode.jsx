import React from 'react';
import { Collapse, Tag } from 'antd';
import { BookOutlined, ExperimentOutlined, BulbOutlined, SafetyOutlined } from '@ant-design/icons';

const examples = [
    {
        id: 'ex97',
        title: 'Example 9-7: Wood Chipper Drive',
        icon: '🪵',
        description: 'Design a spur gear pair for a wood chipper driven by a 3 HP electric motor at 1750 RPM. Gear ratio 3.78:1.',
        params: {
            gearType: 'spur',
            power: 2.237, // 3 HP in kW
            speed_pinion: 1750,
            gearRatio: 3.78,
            numTeethPinion: 18,
            module: 2,
            faceWidth: 13,
            pressureAngle: 20,
            qualityNumber: 8,
            powerSource: 'uniform',
            drivenMachine: 'heavy_shock',
            reliability: 0.99,
            designLife: 1e7,
            oilTemp: 160,
            materialId: 'SAE_4140_OQT1000',
            enclosureType: 'commercial'
        },
        tags: ['Spur', 'AGMA 2001', 'Chapter 9'],
        source: 'Mott, Section 9-9'
    },
    {
        id: 'ex104',
        title: 'Example 10-4: Helical Gear Reducer',
        icon: '🔩',
        description: 'Design a helical gear pair for a speed reducer. 5 kW motor at 1800 RPM, ratio 4:1, helix angle 25°.',
        params: {
            gearType: 'helical',
            power: 5,
            speed_pinion: 1800,
            gearRatio: 4.0,
            numTeethPinion: 20,
            module: 2.5,
            faceWidth: 30,
            pressureAngle: 20,
            helixAngle: 25,
            qualityNumber: 8,
            powerSource: 'uniform',
            drivenMachine: 'moderate_shock',
            reliability: 0.99,
            designLife: 1e8,
            oilTemp: 160,
            materialId: 'SAE_4340_OQT1000',
            enclosureType: 'commercial'
        },
        tags: ['Helical', 'AGMA 2001', 'Chapter 10'],
        source: 'Mott, Section 10-3'
    },
    {
        id: 'bevel_demo',
        title: 'Straight Bevel Gear Drive',
        icon: '📐',
        description: 'Bevel gear pair for 90° shaft angle, 3 kW at 1200 RPM, ratio 3:1.',
        params: {
            gearType: 'bevel',
            power: 3,
            speed_pinion: 1200,
            gearRatio: 3.0,
            numTeethPinion: 20,
            module: 3,
            faceWidth: 20,
            pressureAngle: 20,
            qualityNumber: 7,
            powerSource: 'uniform',
            drivenMachine: 'uniform',
            reliability: 0.99,
            designLife: 1e7,
            oilTemp: 160,
            materialId: 'SAE_4140_OQT1000',
            enclosureType: 'commercial'
        },
        tags: ['Bevel', 'AGMA 2003-C10', 'Chapter 10'],
        source: 'Mott, Section 10-6'
    },
    {
        id: 'worm_demo',
        title: 'Worm Gear Speed Reducer',
        icon: '🐛',
        description: 'Worm gear for high-ratio (30:1) speed reduction, 2 kW at 1750 RPM. Self-locking analysis.',
        params: {
            gearType: 'worm',
            power: 2,
            speed_pinion: 1750,
            gearRatio: 30,
            numTeethPinion: 2,
            module: 4,
            faceWidth: 40,
            pressureAngle: 20,
            qualityNumber: 7,
            powerSource: 'uniform',
            drivenMachine: 'uniform',
            reliability: 0.99,
            designLife: 1e7,
            oilTemp: 180,
            materialId: 'SAE_4140_OQT1000',
            materialGearId: 'SAE_65_BRONZE',
            enclosureType: 'commercial'
        },
        tags: ['Worm', 'AGMA 6034-B92', 'Thermal', 'Chapter 10'],
        source: 'Mott, Section 10-9'
    }
];

const designSteps = [
    { step: 1, title: 'Define Requirements', desc: 'Power, speed, ratio, life, load type (Section 9-9 Step 1-3)' },
    { step: 2, title: 'Select Material', desc: 'Choose from Appendix tables based on strength, hardness, cost' },
    { step: 3, title: 'Initial Geometry', desc: 'Min teeth (avoid interference), module (ISO 54), face width' },
    { step: 4, title: 'Compute Forces', desc: 'W_t = 2T/d, W_r = W_t·tan(φ), W_n = W_t/cos(φ)' },
    { step: 5, title: 'AGMA Factors', desc: 'K_o (load), K_v (dynamic), K_s (size), K_m (distribution), K_B (rim)' },
    { step: 6, title: 'Geometry Factors', desc: 'J (bending, Fig 9-10), I (pitting, Fig 9-17)' },
    { step: 7, title: 'Bending Stress', desc: 'σ_t = (W_t·P_d·K_o·K_v·K_s·K_m·K_B) / (F·J) — Eq 9-16' },
    { step: 8, title: 'Contact Stress', desc: 'σ_c = C_p·√(W_t·K_o·K_v·K_s·K_m / (F·d·I)) — Eq 9-23' },
    { step: 9, title: 'Life Factors', desc: 'Y_N (bending), Z_N (pitting) from Figs 9-21/9-22' },
    { step: 10, title: 'Safety Factors', desc: 'SF_bending = σ_at·Y_N / (σ_t·K_T·K_R); SF_contact = [σ_ac·Z_N / (σ_c·K_T·K_R)]²' },
    { step: 11, title: 'Iterate', desc: 'If SF < required, increase module or face width and repeat' },
    { step: 12, title: 'Assembly Design', desc: 'Shaft sizing, bearing selection, key design, seal specification' },
];

const standards = [
    { code: 'AGMA 2001-D04', scope: 'Spur & Helical Gears', desc: 'Fundamental rating factors for involute spur/helical gears' },
    { code: 'AGMA 2003-C10', scope: 'Bevel Gears', desc: 'Rating pitting resistance and bending strength of bevel gears' },
    { code: 'AGMA 6034-B92', scope: 'Worm Gears', desc: 'Practice for enclosed cylindrical wormgearing' },
    { code: 'ISO 6336', scope: 'Load Capacity', desc: 'Calculation of load capacity of spur and helical gears' },
    { code: 'ISO 1328', scope: 'Quality', desc: 'Cylindrical gears quality system' },
    { code: 'DIN 3990', scope: 'Calculations', desc: 'Calculation of load capacity of cylindrical gears' },
    { code: 'BS 436', scope: 'Spur/Helical', desc: 'Spur and helical gears calculation methods' },
];

export default function EducationalMode({ onLoadExample }) {
    return (
        <div className="animate-in">
            {/* Pre-loaded Examples */}
            <div className="glass-card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="title-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)' }}>
                            <ExperimentOutlined />
                        </div>
                        Pre-loaded Examples
                    </div>
                    <span className="status-badge info">From Textbook</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    {examples.map(ex => (
                        <div key={ex.id} className="example-card" onClick={() => onLoadExample(ex.params)}>
                            <div className="example-title">
                                <span style={{ fontSize: 20 }}>{ex.icon}</span>
                                {ex.title}
                            </div>
                            <div className="example-desc">{ex.description}</div>
                            <div className="example-tags">
                                {ex.tags.map(t => <span key={t} className="tag">{t}</span>)}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>📚 {ex.source}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Design Procedure */}
            <div className="glass-card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="title-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)' }}>
                            <BookOutlined />
                        </div>
                        22-Step Design Procedure (Section 9-9)
                    </div>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                    {designSteps.map(s => (
                        <div key={s.step} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: 'var(--bg-glass)', borderRadius: 8 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: 'var(--gradient-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0
                            }}>
                                {s.step}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{s.title}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{s.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Standards Reference */}
            <div className="glass-card">
                <div className="card-header">
                    <div className="card-title">
                        <div className="title-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-warning)' }}>
                            <SafetyOutlined />
                        </div>
                        Standards Reference
                    </div>
                </div>

                <table style={{ width: '100%', fontSize: 13 }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-glass)' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>Standard</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>Scope</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standards.map((s, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--accent-primary)' }}>{s.code}</td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{s.scope}</td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{s.desc}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
