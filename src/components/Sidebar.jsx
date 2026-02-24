import React from 'react';
import {
    SettingOutlined, DashboardOutlined, EyeOutlined,
    RocketOutlined, BarChartOutlined, ExportOutlined,
    BookOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
    SoundOutlined, FireOutlined, CloudServerOutlined,
    ApartmentOutlined, ThunderboltOutlined, ToolOutlined,
    GlobalOutlined, FileSyncOutlined
} from '@ant-design/icons';

const navItems = [
    { key: 'design', icon: <SettingOutlined />, label: 'Design Input', badge: null },
    { key: 'analysis', icon: <DashboardOutlined />, label: 'Analysis', badge: null },
    { key: 'viewer', icon: <EyeOutlined />, label: '3D Viewer', badge: null },
    { key: 'optimization', icon: <RocketOutlined />, label: 'Optimization', badge: 'AI' },
    { key: 'charts', icon: <BarChartOutlined />, label: 'Charts', badge: null },
    { key: 'export', icon: <ExportOutlined />, label: 'Export', badge: null },
    { key: 'learn', icon: <BookOutlined />, label: 'Learn', badge: 'NEW' },
];

const advancedItems = [
    { key: 'nvh', icon: <SoundOutlined />, label: 'NVH Analysis', badge: 'ADV' },
    { key: 'cfd', icon: <FireOutlined />, label: 'CFD Thermal', badge: 'ADV' },
    { key: 'twin', icon: <CloudServerOutlined />, label: 'Digital Twin', badge: 'IoT' },
    { key: 'drivetrain', icon: <ApartmentOutlined />, label: 'Multi-Body', badge: 'ADV' },
    { key: 'components', icon: <ThunderboltOutlined />, label: 'Motor/Clutch', badge: 'ADV' },
    { key: 'manufacturing', icon: <ToolOutlined />, label: 'Manufacturing', badge: 'DFM' },
    { key: 'sustainability', icon: <GlobalOutlined />, label: 'Sustainability', badge: 'LCA' },
    { key: 'pdfdiff', icon: <FileSyncOutlined />, label: 'PDF Diff', badge: 'NEW' },
];

export default function Sidebar({ activeTab, onTabChange, collapsed, onCollapse }) {
    return (
        <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-logo">
                <div className="logo-icon">⚙</div>
                <div className="logo-text">
                    <h2>GearOptix</h2>
                    <span>Transmission Designer</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <div
                        key={item.key}
                        className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
                        onClick={() => onTabChange(item.key)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                        {item.badge && <span className="nav-badge">{item.badge}</span>}
                    </div>
                ))}

                {/* Advanced Section Divider */}
                <div className="nav-divider">
                    <span className="nav-divider-text">{collapsed ? '—' : 'ADVANCED'}</span>
                </div>

                {advancedItems.map(item => (
                    <div
                        key={item.key}
                        className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
                        onClick={() => onTabChange(item.key)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                        {item.badge && <span className="nav-badge adv-badge">{item.badge}</span>}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="collapse-btn" onClick={() => onCollapse(!collapsed)}>
                    {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                </button>
            </div>
        </div>
    );
}
