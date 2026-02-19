import React from 'react';
import { Button, message } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';

export default function ExportPanel({ results, designParams }) {
    const exportPDF = () => {
        import('jspdf').then(({ default: jsPDF }) => {
            import('jspdf-autotable').then(() => {
                const doc = new jsPDF();
                const pg = doc.internal.pageSize;

                // Title
                doc.setFontSize(22);
                doc.setTextColor(59, 130, 246);
                doc.text('GearOptix Design Report', 14, 20);

                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
                doc.text('Standard: AGMA 2001-D04', 14, 34);

                // Design Summary
                doc.setFontSize(14);
                doc.setTextColor(30);
                doc.text('Design Summary', 14, 48);

                if (results) {
                    const { geometry, stresses, safetyFactors, forces, factors, performance } = results;

                    // Geometry Table
                    doc.autoTable({
                        startY: 52,
                        head: [['Parameter', 'Value']],
                        body: [
                            ['Gear Type', designParams.gearType || 'Spur'],
                            ['Pinion Teeth (N_p)', `${geometry.N_p}`],
                            ['Gear Teeth (N_g)', `${geometry.N_g}`],
                            ['Module (m)', `${geometry.m} mm`],
                            ['Gear Ratio', `${geometry.m_G?.toFixed(4)}`],
                            ['Pinion Pitch Diameter', `${geometry.d_p?.toFixed(2)} mm`],
                            ['Gear Pitch Diameter', `${geometry.d_g?.toFixed(2)} mm`],
                            ['Center Distance', `${geometry.C?.toFixed(2)} mm`],
                            ['Face Width', `${geometry.F?.toFixed(1)} mm`],
                        ],
                        theme: 'grid',
                        headStyles: { fillColor: [59, 130, 246] },
                        styles: { fontSize: 9 },
                    });

                    // Stresses Table
                    doc.setFontSize(14);
                    doc.text('Stress Analysis', 14, doc.lastAutoTable.finalY + 16);
                    doc.autoTable({
                        startY: doc.lastAutoTable.finalY + 20,
                        head: [['Stress', 'Applied (MPa)', 'Allowable (MPa)', 'Safety Factor', 'Status']],
                        body: [
                            ['Bending (Pinion)', stresses.s_t_pinion?.toFixed(1), String(stresses.s_at_pinion), safetyFactors.bending_pinion?.toFixed(2), safetyFactors.bending_pinion >= 1 ? 'PASS' : 'FAIL'],
                            ['Bending (Gear)', stresses.s_t_gear?.toFixed(1), String(stresses.s_at_gear), safetyFactors.bending_gear?.toFixed(2), safetyFactors.bending_gear >= 1 ? 'PASS' : 'FAIL'],
                            ['Contact (Pinion)', stresses.s_c?.toFixed(1), String(stresses.s_ac_pinion), safetyFactors.contact_pinion?.toFixed(2), safetyFactors.contact_pinion >= 1 ? 'PASS' : 'FAIL'],
                            ['Contact (Gear)', stresses.s_c?.toFixed(1), String(stresses.s_ac_gear), safetyFactors.contact_gear?.toFixed(2), safetyFactors.contact_gear >= 1 ? 'PASS' : 'FAIL'],
                        ],
                        theme: 'grid',
                        headStyles: { fillColor: [59, 130, 246] },
                        styles: { fontSize: 9 },
                    });

                    // Forces
                    doc.setFontSize(14);
                    doc.text('Forces & Performance', 14, doc.lastAutoTable.finalY + 16);
                    doc.autoTable({
                        startY: doc.lastAutoTable.finalY + 20,
                        head: [['Parameter', 'Value']],
                        body: [
                            ['Tangential Force (W_t)', `${forces.W_t?.toFixed(1)} N`],
                            ['Radial Force (W_r)', `${forces.W_r?.toFixed(1)} N`],
                            ['Pinion Torque', `${forces.T_pinion?.toFixed(2)} N·m`],
                            ['Pitch Line Velocity', `${forces.V_ms?.toFixed(2)} m/s`],
                            ['Efficiency', `${(performance.efficiency * 100).toFixed(2)}%`],
                            ['Power Loss', `${performance.powerLoss?.toFixed(3)} kW`],
                        ],
                        theme: 'grid',
                        headStyles: { fillColor: [16, 185, 129] },
                        styles: { fontSize: 9 },
                    });

                    // AGMA Factors
                    if (doc.lastAutoTable.finalY < pg.height - 80) {
                        doc.setFontSize(14);
                        doc.text('AGMA Factors', 14, doc.lastAutoTable.finalY + 16);
                        doc.autoTable({
                            startY: doc.lastAutoTable.finalY + 20,
                            head: [['Factor', 'Value', 'Source']],
                            body: [
                                ['K_o (Overload)', factors.K_o?.toFixed(3), 'Table 9-1'],
                                ['K_v (Dynamic)', factors.K_v?.toFixed(3), 'Fig 9-16'],
                                ['K_s (Size)', factors.K_s?.toFixed(3), 'Fig 9-13'],
                                ['K_m (Load Dist)', factors.K_m?.toFixed(3), 'Eq 9-17'],
                                ['J (Geometry)', factors.J_pinion?.toFixed(4), 'Fig 9-10'],
                                ['I (Pitting)', factors.I?.toFixed(4), 'Fig 9-17'],
                                ['C_p (Elastic)', `${factors.C_p?.toFixed(1)} √MPa`, 'Eq 9-24'],
                            ],
                            theme: 'grid',
                            headStyles: { fillColor: [139, 92, 246] },
                            styles: { fontSize: 9 },
                        });
                    }
                }

                // Footer
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setFontSize(8);
                    doc.setTextColor(150);
                    doc.text(`GearOptix Report — Page ${i} of ${pageCount}`, pg.width / 2, pg.height - 10, { align: 'center' });
                }

                doc.save('GearOptix_Design_Report.pdf');
                message.success('PDF report downloaded!');
            });
        });
    };

    const exportExcel = () => {
        import('xlsx').then((XLSX) => {
            const wb = XLSX.utils.book_new();

            if (results) {
                const { geometry, stresses, safetyFactors, forces, factors, performance, trace } = results;

                // Summary sheet
                const summaryData = [
                    ['GearOptix Design Report'],
                    ['Generated', new Date().toLocaleString()],
                    ['Standard', 'AGMA 2001-D04'],
                    [],
                    ['GEOMETRY'],
                    ['Pinion Teeth', geometry.N_p],
                    ['Gear Teeth', geometry.N_g],
                    ['Module (mm)', geometry.m],
                    ['Gear Ratio', geometry.m_G],
                    ['Pinion Pitch Dia (mm)', geometry.d_p],
                    ['Gear Pitch Dia (mm)', geometry.d_g],
                    ['Center Distance (mm)', geometry.C],
                    ['Face Width (mm)', geometry.F],
                    [],
                    ['STRESSES'],
                    ['Bending Stress Pinion (MPa)', stresses.s_t_pinion],
                    ['Bending Stress Gear (MPa)', stresses.s_t_gear],
                    ['Contact Stress (MPa)', stresses.s_c],
                    ['Allowable Bending Pinion (MPa)', stresses.s_at_pinion],
                    ['Allowable Contact Pinion (MPa)', stresses.s_ac_pinion],
                    [],
                    ['SAFETY FACTORS'],
                    ['SF Bending Pinion', safetyFactors.bending_pinion],
                    ['SF Bending Gear', safetyFactors.bending_gear],
                    ['SF Contact Pinion', safetyFactors.contact_pinion],
                    ['SF Contact Gear', safetyFactors.contact_gear],
                    [],
                    ['PERFORMANCE'],
                    ['Efficiency (%)', (performance.efficiency * 100)],
                    ['Power Loss (kW)', performance.powerLoss],
                ];

                const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
                XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

                // Trace sheet
                if (trace) {
                    const traceData = [['Step', 'Parameter', 'Value', 'Formula']];
                    trace.forEach(t => traceData.push([t.step, t.label, t.value, t.formula || '']));
                    const ws2 = XLSX.utils.aoa_to_sheet(traceData);
                    XLSX.utils.book_append_sheet(wb, ws2, 'Calculation Trace');
                }
            }

            XLSX.writeFile(wb, 'GearOptix_Design.xlsx');
            message.success('Excel file downloaded!');
        });
    };

    return (
        <div className="animate-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                <div className="export-card" onClick={exportPDF}>
                    <div className="export-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}>
                        <FilePdfOutlined />
                    </div>
                    <div className="export-info">
                        <h4>PDF Report</h4>
                        <p>Complete design report with geometry, stresses, safety factors, AGMA factors, and compliance checks.</p>
                    </div>
                </div>

                <div className="export-card" onClick={exportExcel}>
                    <div className="export-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
                        <FileExcelOutlined />
                    </div>
                    <div className="export-info">
                        <h4>Excel Spreadsheet</h4>
                        <p>Editable spreadsheet with all calculations, summary data, and complete calculation trace.</p>
                    </div>
                </div>

                <div className="export-card" onClick={() => {
                    if (!results) { message.warning('Run analysis first'); return; }
                    const json = JSON.stringify({ designParams, results }, null, 2);
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'GearOptix_Design.json'; a.click();
                    URL.revokeObjectURL(url);
                    message.success('JSON exported!');
                }}>
                    <div className="export-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white' }}>
                        <FileTextOutlined />
                    </div>
                    <div className="export-info">
                        <h4>JSON Data</h4>
                        <p>Machine-readable export of all design parameters and analysis results for API integration.</p>
                    </div>
                </div>
            </div>

            {!results && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', marginTop: 20 }}>
                    <p>⚠️ Run an analysis first to generate exportable data.</p>
                </div>
            )}
        </div>
    );
}
