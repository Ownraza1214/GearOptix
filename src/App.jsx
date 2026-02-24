import React, { useState, useCallback, Suspense } from 'react';
import { ConfigProvider, theme as antdTheme, Spin, message } from 'antd';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import InputForm from './components/InputForm';
import ResultsDashboard from './components/ResultsDashboard';
import Charts from './components/Charts';
import OptimizationPanel from './components/OptimizationPanel';
import ExportPanel from './components/ExportPanel';
import EducationalMode from './components/EducationalMode';
import NVHPanel from './components/NVHPanel';
import CFDSimulation from './components/CFDSimulation';
import DigitalTwinDashboard from './components/DigitalTwinDashboard';
import DrivetrainBuilder from './components/DrivetrainBuilder';
import DrivetrainComponents from './components/DrivetrainComponents';
import ManufacturingPanel from './components/ManufacturingPanel';
import SustainabilityPanel from './components/SustainabilityPanel';
import PDFDiffPanel from './components/PDFDiffPanel';
import { designSpurGear } from './calculations/spurGear';
import { designHelicalGear } from './calculations/helicalGear';
import { designBevelGear } from './calculations/bevelGear';
import { designWormGear } from './calculations/wormGear';
import { materials } from './data/materials';
import './App.css';

const GearVisualizer = React.lazy(() => import('./components/GearVisualizer'));

const defaultParams = {
    gearType: 'spur',
    power: 2.237, // kW (~ 3 HP)
    speed_pinion: 1750,
    gearRatio: 3.78,
    numTeethPinion: 18,
    module: 2,
    faceWidth: 13,
    pressureAngle: 20,
    helixAngle: 25,
    qualityNumber: 8,
    powerSource: 'uniform',
    drivenMachine: 'heavy_shock',
    reliability: 0.99,
    designLife: 1e7,
    oilTemp: 160,
    materialId: 'SAE_4140_OQT1000',
    sameMaterial: true,
    enclosureType: 'commercial'
};

export default function App() {
    const [activeTab, setActiveTab] = useState('design');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [unitSystem, setUnitSystem] = useState('SI');
    const [designParams, setDesignParams] = useState(defaultParams);
    const [results, setResults] = useState(null);

    const handleCalculate = useCallback(() => {
        try {
            const mat = materials.find(m => m.id === designParams.materialId) || materials[0];

            const calcParams = {
                power: designParams.power,
                speed_pinion: designParams.speed_pinion,
                gearRatio: designParams.gearRatio,
                numTeethPinion: designParams.numTeethPinion,
                module: designParams.module,
                faceWidth: designParams.faceWidth,
                pressureAngle: designParams.pressureAngle,
                qualityNumber: designParams.qualityNumber,
                powerSource: designParams.powerSource,
                drivenMachine: designParams.drivenMachine,
                reliability: designParams.reliability,
                designLife: designParams.designLife,
                oilTemp: designParams.oilTemp,
                materialPinion: mat,
                materialGear: mat,
                enclosureType: designParams.enclosureType,
            };

            let result;
            switch (designParams.gearType) {
                case 'helical':
                    result = designHelicalGear({ ...calcParams, helixAngle: designParams.helixAngle || 25 });
                    break;
                case 'bevel':
                    result = designBevelGear(calcParams);
                    break;
                case 'worm':
                    result = designWormGear({
                        ...calcParams,
                        speed_worm: calcParams.speed_pinion,
                        materialWorm: calcParams.materialPinion,
                        numThreadsWorm: Math.max(1, Math.min(8, calcParams.numTeethPinion)),
                    });
                    break;
                default:
                    result = designSpurGear(calcParams);
            }
            // Attach gearType so components know what was analyzed
            result.gearType = designParams.gearType;

            setResults(result);
            setActiveTab('analysis');
            message.success('Analysis complete!');
        } catch (err) {
            console.error('Calculation error:', err);
            message.error(`Calculation error: ${err.message}`);
        }
    }, [designParams]);

    const handleLoadExample = useCallback((params) => {
        setDesignParams({ ...defaultParams, ...params });
        setActiveTab('design');
        message.info('Example loaded! Click "Analyze Design" to run.');
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'design':
                return <InputForm
                    designParams={designParams}
                    onParamsChange={setDesignParams}
                    onCalculate={handleCalculate}
                    unitSystem={unitSystem}
                />;
            case 'analysis':
                return <ResultsDashboard results={results} unitSystem={unitSystem} />;
            case 'viewer':
                return (
                    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spin size="large" tip="Loading 3D Viewer..." /></div>}>
                        <GearVisualizer results={results} />
                    </Suspense>
                );
            case 'optimization':
                return <OptimizationPanel designParams={designParams} results={results} />;
            case 'charts':
                return <Charts results={results} />;
            case 'export':
                return <ExportPanel results={results} designParams={designParams} />;
            case 'learn':
                return <EducationalMode onLoadExample={handleLoadExample} />;
            // ===== Advanced Modules =====
            case 'nvh':
                return <NVHPanel results={results} designParams={designParams} />;
            case 'cfd':
                return <CFDSimulation results={results} designParams={designParams} />;
            case 'twin':
                return <DigitalTwinDashboard results={results} designParams={designParams} />;
            case 'drivetrain':
                return <DrivetrainBuilder results={results} designParams={designParams} />;
            case 'components':
                return <DrivetrainComponents results={results} designParams={designParams} />;
            case 'manufacturing':
                return <ManufacturingPanel results={results} designParams={designParams} />;
            case 'sustainability':
                return <SustainabilityPanel results={results} designParams={designParams} />;
            case 'pdfdiff':
                return <PDFDiffPanel />;
            default:
                return null;
        }
    };

    return (
        <ConfigProvider theme={{
            algorithm: antdTheme.darkAlgorithm,
            token: {
                colorPrimary: '#3b82f6',
                colorBgContainer: 'rgba(15, 23, 42, 0.8)',
                colorBorder: 'rgba(148, 163, 184, 0.1)',
                borderRadius: 10,
                fontFamily: 'Inter, -apple-system, sans-serif',
                colorText: '#f1f5f9',
                colorTextSecondary: '#94a3b8',
            }
        }}>
            <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Sidebar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    collapsed={sidebarCollapsed}
                    onCollapse={setSidebarCollapsed}
                />
                <div className="main-content">
                    <Header
                        activeTab={activeTab}
                        unitSystem={unitSystem}
                        onUnitChange={setUnitSystem}
                    />
                    <div className="content-area">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </ConfigProvider>
    );
}
