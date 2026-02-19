import React from 'react';
import { BulbOutlined, GithubOutlined } from '@ant-design/icons';

const tabTitles = {
    design: 'Design Input',
    analysis: 'Analysis Dashboard',
    viewer: '3D Gear Visualization',
    optimization: 'Optimization Engine',
    charts: 'Performance Charts',
    export: 'Export & Reports',
    learn: 'Educational Mode'
};

export default function Header({ activeTab, unitSystem, onUnitChange }) {
    return (
        <header className="app-header">
            <div className="header-left">
                <h3>{tabTitles[activeTab] || 'GearOptix'}</h3>
            </div>
            <div className="header-right">
                <div className="unit-toggle">
                    <button
                        className={unitSystem === 'SI' ? 'active' : ''}
                        onClick={() => onUnitChange('SI')}
                    >
                        SI
                    </button>
                    <button
                        className={unitSystem === 'Imperial' ? 'active' : ''}
                        onClick={() => onUnitChange('Imperial')}
                    >
                        Imperial
                    </button>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
                    AGMA 2001-D04
                </span>
            </div>
        </header>
    );
}
