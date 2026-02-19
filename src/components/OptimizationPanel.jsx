import React, { useState, useCallback } from 'react';
import { Button, Select, InputNumber, Form, Divider, Radio } from 'antd';
import { RocketOutlined, ThunderboltOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import { optimizeGear } from '../optimization/geneticAlgorithm';
import { ParticleSwarm } from '../optimization/particleSwarm';

const { Option } = Select;

export default function OptimizationPanel({ designParams, results }) {
    const [optimConfig, setOptimConfig] = useState({
        algorithm: 'ga',
        objective: 'weight',
        generations: 80,
        populationSize: 40,
        minTeeth: 17,
        maxTeeth: 60,
        moduleRange: [1, 10],
        faceWidthRange: [10, 100]
    });
    const [optimResult, setOptimResult] = useState(null);
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState(0);

    const runOptimization = useCallback(() => {
        setRunning(true);
        setProgress(0);

        const ratio = designParams.gearRatio || 3;

        const onProgress = (gen, total) => {
            setProgress(((gen + 1) / total * 100));
        };

        // Run in a setTimeout to allow UI update
        setTimeout(() => {
            let result;

            if (optimConfig.algorithm === 'ga') {
                result = optimizeGear({
                    ...optimConfig,
                    power: designParams.power,
                    speed: designParams.speed_pinion,
                    ratio,
                    materialDensity: 7850,
                });
            } else {
                // PSO
                const bounds = [
                    [optimConfig.minTeeth, optimConfig.maxTeeth],
                    optimConfig.moduleRange,
                    optimConfig.faceWidthRange
                ];

                const objectiveFn = ([N_p, mod, F]) => {
                    const N_p_r = Math.round(N_p);
                    const d_p = N_p_r * mod;
                    const d_g = N_p_r * ratio * mod;
                    const vol = (Math.PI / 4) * (d_p * d_p + d_g * d_g) * F;
                    return 7850 * vol * 1e-9;
                };

                const pso = new ParticleSwarm({
                    swarmSize: optimConfig.populationSize,
                    iterations: optimConfig.generations,
                    bounds,
                    objectiveFn
                });

                result = pso.run(onProgress);
            }

            setOptimResult(result);
            setRunning(false);
            setProgress(100);
        }, 50);
    }, [optimConfig, designParams]);

    const darkLayout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(10,14,26,0.8)',
        font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 12 },
        margin: { l: 60, r: 30, t: 40, b: 50 },
        xaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
        yaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
        hoverlabel: { bgcolor: '#1a2035', bordercolor: '#3b82f6', font: { color: '#f1f5f9' } },
    };

    return (
        <div className="animate-in">
            <div className="glass-card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <div className="card-title">
                        <div className="title-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-secondary)' }}>
                            <RocketOutlined />
                        </div>
                        Optimization Configuration
                    </div>
                </div>

                <div className="form-grid">
                    <Form.Item label="Algorithm">
                        <Radio.Group value={optimConfig.algorithm} onChange={e => setOptimConfig({ ...optimConfig, algorithm: e.target.value })}>
                            <Radio.Button value="ga">Genetic Algorithm</Radio.Button>
                            <Radio.Button value="pso">Particle Swarm</Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item label="Objective">
                        <Select value={optimConfig.objective} onChange={v => setOptimConfig({ ...optimConfig, objective: v })} style={{ width: '100%' }}>
                            <Option value="weight">Minimize Weight</Option>
                            <Option value="volume">Minimize Volume</Option>
                            <Option value="cost">Minimize Cost</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="Generations / Iterations">
                        <InputNumber min={10} max={500} value={optimConfig.generations}
                            onChange={v => setOptimConfig({ ...optimConfig, generations: v })} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Population / Swarm Size">
                        <InputNumber min={10} max={200} value={optimConfig.populationSize}
                            onChange={v => setOptimConfig({ ...optimConfig, populationSize: v })} style={{ width: '100%' }} />
                    </Form.Item>
                </div>

                <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <Button type="primary" size="large" icon={<ThunderboltOutlined />}
                        onClick={runOptimization} loading={running}
                        style={{ minWidth: 200, height: 44, borderRadius: 12 }}>
                        {running ? `Optimizing... ${progress.toFixed(0)}%` : 'Run Optimization'}
                    </Button>
                </div>

                {running && (
                    <div className="optimization-progress">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Results */}
            {optimResult && (
                <>
                    <div className="stat-grid">
                        <div className="stat-card purple">
                            <div className="stat-label">Optimized N_p</div>
                            <div className="stat-value">{Math.round(optimResult.bestSolution[0])}</div>
                            <div className="stat-unit">teeth</div>
                        </div>
                        <div className="stat-card blue">
                            <div className="stat-label">Optimized Module</div>
                            <div className="stat-value">{optimResult.bestSolution[1].toFixed(2)}</div>
                            <div className="stat-unit">mm</div>
                        </div>
                        <div className="stat-card green">
                            <div className="stat-label">Optimized Face Width</div>
                            <div className="stat-value">{optimResult.bestSolution[2].toFixed(1)}</div>
                            <div className="stat-unit">mm</div>
                        </div>
                        <div className="stat-card orange">
                            <div className="stat-label">Best Fitness ({optimConfig.objective})</div>
                            <div className="stat-value">{optimResult.bestFitness.toFixed(4)}</div>
                            <div className="stat-unit">{optimConfig.objective === 'weight' ? 'kg' : optimConfig.objective === 'cost' ? '$' : 'mm³'}</div>
                        </div>
                    </div>

                    {/* Convergence Plot */}
                    <div className="chart-container">
                        <Plot
                            data={[{
                                x: optimResult.convergenceHistory.map(h => h.generation || h.iteration),
                                y: optimResult.convergenceHistory.map(h => h.bestFitness),
                                type: 'scatter', mode: 'lines',
                                name: 'Best Fitness',
                                line: { color: '#8b5cf6', width: 3 },
                            }, {
                                x: optimResult.convergenceHistory.map(h => h.generation || h.iteration),
                                y: optimResult.convergenceHistory.map(h => h.avgFitness),
                                type: 'scatter', mode: 'lines',
                                name: 'Average Fitness',
                                line: { color: '#3b82f6', width: 1.5, dash: 'dot' },
                            }]}
                            layout={{
                                ...darkLayout,
                                title: { text: 'Convergence History', font: { size: 14, color: '#f1f5f9' } },
                                xaxis: { ...darkLayout.xaxis, title: optimConfig.algorithm === 'ga' ? 'Generation' : 'Iteration' },
                                yaxis: { ...darkLayout.yaxis, title: 'Fitness' },
                            }}
                            config={{ displayModeBar: false, responsive: true }}
                            style={{ width: '100%', height: 300 }}
                            useResizeHandler
                        />
                    </div>
                </>
            )}
        </div>
    );
}
