import React, { useState } from 'react';
import { Form, InputNumber, Select, Button, Tooltip, Divider, Tabs, Radio, Slider } from 'antd';
import {
    ThunderboltOutlined, SettingOutlined, ExperimentOutlined,
    SafetyOutlined, InfoCircleOutlined, ToolOutlined
} from '@ant-design/icons';
import { materials, MATERIAL_CATEGORIES, getMaterialsByCategory } from '../data/materials';
import { GEAR_TYPES, POWER_SOURCES, DRIVEN_MACHINES, AGMA_QUALITY_NUMBERS, STANDARD_MODULES } from '../data/standardSizes';

const { Option } = Select;

export default function InputForm({ designParams, onParamsChange, onCalculate, unitSystem }) {
    const [selectedCategory, setSelectedCategory] = useState(MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED);

    const update = (key, value) => {
        onParamsChange({ ...designParams, [key]: value });
    };

    const categoryMaterials = getMaterialsByCategory(selectedCategory);

    return (
        <div className="animate-in">
            <Tabs defaultActiveKey="basic" type="card" items={[
                {
                    key: 'basic',
                    label: '⚡ Basic Parameters',
                    children: (
                        <>
                            {/* Gear Type */}
                            <div className="form-section">
                                <div className="section-title">
                                    <SettingOutlined className="section-icon" />
                                    Gear Type
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                                    {GEAR_TYPES.map(type => (
                                        <div
                                            key={type.id}
                                            className={`material-card ${designParams.gearType === type.id ? 'selected' : ''}`}
                                            onClick={() => update('gearType', type.id)}
                                        >
                                            <span style={{ fontSize: 24 }}>{type.icon}</span>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 13 }}>{type.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{type.standard}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Divider style={{ margin: '16px 0' }} />

                            {/* Operating Conditions */}
                            <div className="form-section">
                                <div className="section-title">
                                    <ThunderboltOutlined className="section-icon" />
                                    Operating Conditions
                                </div>
                                <div className="form-grid">
                                    <Form.Item label={<Tooltip title="Input shaft power">Power ({unitSystem === 'SI' ? 'kW' : 'HP'})</Tooltip>}>
                                        <InputNumber
                                            min={0.01} max={10000} step={0.1}
                                            value={designParams.power}
                                            onChange={v => update('power', v)}
                                            style={{ width: '100%' }}
                                            placeholder="e.g. 3"
                                        />
                                    </Form.Item>
                                    <Form.Item label={<Tooltip title="Pinion shaft speed">Speed Pinion (RPM)</Tooltip>}>
                                        <InputNumber
                                            min={1} max={100000} step={10}
                                            value={designParams.speed_pinion}
                                            onChange={v => update('speed_pinion', v)}
                                            style={{ width: '100%' }}
                                            placeholder="e.g. 1750"
                                        />
                                    </Form.Item>
                                    <Form.Item label={<Tooltip title="N_gear / N_pinion">Gear Ratio</Tooltip>}>
                                        <InputNumber
                                            min={1} max={100} step={0.01}
                                            value={designParams.gearRatio}
                                            onChange={v => update('gearRatio', v)}
                                            style={{ width: '100%' }}
                                            placeholder="e.g. 3.78"
                                        />
                                    </Form.Item>
                                    <Form.Item label={<Tooltip title="Desired service life in cycles (10^7 default)">Design Life (cycles)</Tooltip>}>
                                        <Select
                                            value={designParams.designLife}
                                            onChange={v => update('designLife', v)}
                                            style={{ width: '100%' }}
                                        >
                                            <Option value={1e5}>10⁵ (Short)</Option>
                                            <Option value={1e6}>10⁶ (Medium)</Option>
                                            <Option value={1e7}>10⁷ (Standard)</Option>
                                            <Option value={1e8}>10⁸ (Long)</Option>
                                            <Option value={1e9}>10⁹ (Very Long)</Option>
                                            <Option value={1e10}>10¹⁰ (Infinite)</Option>
                                        </Select>
                                    </Form.Item>
                                </div>
                            </div>

                            <Divider style={{ margin: '16px 0' }} />

                            {/* Gear Geometry */}
                            <div className="form-section">
                                <div className="section-title">
                                    <ToolOutlined className="section-icon" />
                                    Gear Geometry
                                </div>
                                <div className="form-grid">
                                    <Form.Item label={<Tooltip title="Minimum 17 for 20° PA to avoid interference">Pinion Teeth (N_p)</Tooltip>}>
                                        <InputNumber
                                            min={12} max={300} step={1}
                                            value={designParams.numTeethPinion}
                                            onChange={v => update('numTeethPinion', v)}
                                            style={{ width: '100%' }}
                                            placeholder="e.g. 20"
                                        />
                                    </Form.Item>
                                    <Form.Item label={<Tooltip title="ISO 54 standard module (mm)">Module (mm)</Tooltip>}>
                                        <Select
                                            value={designParams.module}
                                            onChange={v => update('module', v)}
                                            style={{ width: '100%' }}
                                            showSearch
                                        >
                                            {STANDARD_MODULES.filter(m => m >= 0.5 && m <= 20).map(m => (
                                                <Option key={m} value={m}>{m} mm (P_d ≈ {(25.4 / m).toFixed(1)})</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item label={<Tooltip title="Gear face width (8-16 × module recommended)">Face Width (mm)</Tooltip>}>
                                        <InputNumber
                                            min={1} max={500} step={1}
                                            value={designParams.faceWidth}
                                            onChange={v => update('faceWidth', v)}
                                            style={{ width: '100%' }}
                                            placeholder="e.g. 25"
                                        />
                                    </Form.Item>
                                    <Form.Item label="Pressure Angle">
                                        <Select
                                            value={designParams.pressureAngle}
                                            onChange={v => update('pressureAngle', v)}
                                            style={{ width: '100%' }}
                                        >
                                            <Option value={14.5}>14.5° (Legacy)</Option>
                                            <Option value={20}>20° (Standard)</Option>
                                            <Option value={25}>25° (Strong)</Option>
                                        </Select>
                                    </Form.Item>
                                    {(designParams.gearType === 'helical') && (
                                        <Form.Item label={<Tooltip title="Helix angle for helical gears">Helix Angle (°)</Tooltip>}>
                                            <InputNumber
                                                min={10} max={45} step={1}
                                                value={designParams.helixAngle || 25}
                                                onChange={v => update('helixAngle', v)}
                                                style={{ width: '100%' }}
                                            />
                                        </Form.Item>
                                    )}
                                </div>
                            </div>
                        </>
                    )
                },
                {
                    key: 'material',
                    label: '🔬 Materials',
                    children: (
                        <div className="form-section">
                            <div className="section-title">
                                <ExperimentOutlined className="section-icon" />
                                Material Selection
                            </div>
                            <Form.Item label="Material Category">
                                <Select
                                    value={selectedCategory}
                                    onChange={setSelectedCategory}
                                    style={{ width: '100%' }}
                                >
                                    {Object.values(MATERIAL_CATEGORIES).map(cat => (
                                        <Option key={cat} value={cat}>{cat}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, maxHeight: 350, overflowY: 'auto' }}>
                                {categoryMaterials.map(mat => (
                                    <div
                                        key={mat.id}
                                        className={`material-card ${designParams.materialId === mat.id ? 'selected' : ''}`}
                                        onClick={() => update('materialId', mat.id)}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--gradient-cool)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                                            🔩
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mat.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                                σ_ut={mat.s_ut} MPa · HB={mat.HB} · σ_at={mat.s_at} MPa
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 16 }}>
                                <Form.Item label="Same material for both gears?">
                                    <Radio.Group
                                        value={designParams.sameMaterial !== false}
                                        onChange={e => update('sameMaterial', e.target.value)}
                                    >
                                        <Radio value={true}>Yes (Same material)</Radio>
                                        <Radio value={false}>No (Different materials)</Radio>
                                    </Radio.Group>
                                </Form.Item>
                            </div>
                        </div>
                    )
                },
                {
                    key: 'agma',
                    label: '📐 AGMA Factors',
                    children: (
                        <div className="form-section">
                            <div className="section-title">
                                <SafetyOutlined className="section-icon" />
                                AGMA/ISO Parameters
                            </div>
                            <div className="form-grid">
                                <Form.Item label={<Tooltip title="AGMA Quality Number (Table 9-4)">Quality Number (Qv)</Tooltip>}>
                                    <Select
                                        value={designParams.qualityNumber}
                                        onChange={v => update('qualityNumber', v)}
                                        style={{ width: '100%' }}
                                    >
                                        {AGMA_QUALITY_NUMBERS.map(q => (
                                            <Option key={q.value} value={q.value}>{q.label} — {q.description}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label={<Tooltip title="Table 9-1: K_o">Power Source</Tooltip>}>
                                    <Select
                                        value={designParams.powerSource}
                                        onChange={v => update('powerSource', v)}
                                        style={{ width: '100%' }}
                                    >
                                        {POWER_SOURCES.map(p => (
                                            <Option key={p.value} value={p.value}>{p.label}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label={<Tooltip title="Table 9-1: K_o">Driven Machine</Tooltip>}>
                                    <Select
                                        value={designParams.drivenMachine}
                                        onChange={v => update('drivenMachine', v)}
                                        style={{ width: '100%' }}
                                    >
                                        {DRIVEN_MACHINES.map(d => (
                                            <Option key={d.value} value={d.value}>{d.label}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label={<Tooltip title="Table 9-12">Reliability</Tooltip>}>
                                    <Select
                                        value={designParams.reliability}
                                        onChange={v => update('reliability', v)}
                                        style={{ width: '100%' }}
                                    >
                                        <Option value={0.90}>90% (K_R = 0.85)</Option>
                                        <Option value={0.99}>99% (K_R = 1.00)</Option>
                                        <Option value={0.999}>99.9% (K_R = 1.25)</Option>
                                        <Option value={0.9999}>99.99% (K_R = 1.50)</Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item label="Oil Temperature (°F)">
                                    <InputNumber
                                        min={70} max={500} step={10}
                                        value={designParams.oilTemp}
                                        onChange={v => update('oilTemp', v)}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                                <Form.Item label="Enclosure Type">
                                    <Select
                                        value={designParams.enclosureType}
                                        onChange={v => update('enclosureType', v)}
                                        style={{ width: '100%' }}
                                    >
                                        <Option value="open">Open Gearing</Option>
                                        <Option value="commercial">Commercial Enclosed</Option>
                                        <Option value="precision">Precision Enclosed</Option>
                                        <Option value="extra_precision">Extra Precision</Option>
                                    </Select>
                                </Form.Item>
                            </div>
                        </div>
                    )
                }
            ]} />

            <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Button type="primary" size="large" onClick={onCalculate}
                    style={{ minWidth: 220, height: 48, fontSize: 16, borderRadius: 12 }}>
                    🔍 Analyze Design
                </Button>
            </div>
        </div>
    );
}
