/**
 * GearOptix NVH (Noise, Vibration, Harshness) Analysis
 * Source: "Machine Elements in Mechanical Design" Sections 3-8, 3-13
 * AGMA 908, ISO 10816, ISO 1940
 */

/**
 * Complete NVH analysis for a gear system
 */
export function analyzeNVH(params) {
    const {
        N_p = 18, N_g = 68, module: mod = 2,
        speed_pinion = 1750, gearRatio = 3.78,
        faceWidth = 13, pressureAngle = 20,
        shaftStiffness = 1e6, // N/m
        gearMass_p = 0.5, gearMass_g = 3.0, // kg
        dampingRatio = 0.03,
        bearingStiffness = 5e7, // N/m
        tipRelief = 0, // µm
        crowning = 0, // µm
        profileShift = 0, // x coefficient
        qualityNumber = 8,
    } = params;

    const omega_p = (2 * Math.PI * speed_pinion) / 60; // rad/s
    const omega_g = omega_p / gearRatio;

    // ========== 1. Mesh Frequency Analysis ==========
    const meshFreq = N_p * speed_pinion / 60; // Hz
    const harmonics = [];
    for (let h = 1; h <= 8; h++) {
        harmonics.push({
            order: h,
            frequency: meshFreq * h,
            amplitude: 1.0 / Math.pow(h, 1.3), // Decay with order
            label: h === 1 ? 'Fundamental' : `${h}th Harmonic`
        });
    }

    // Sidebands (modulation from planet/shaft errors)
    const sidebands = [];
    const shaftFreq_p = speed_pinion / 60;
    const shaftFreq_g = shaftFreq_p / gearRatio;
    for (let s = -3; s <= 3; s++) {
        if (s === 0) continue;
        sidebands.push({
            frequency: meshFreq + s * shaftFreq_p,
            amplitude: 0.15 / Math.abs(s),
            source: 'pinion shaft'
        });
        sidebands.push({
            frequency: meshFreq + s * shaftFreq_g,
            amplitude: 0.12 / Math.abs(s),
            source: 'gear shaft'
        });
    }

    // ========== 2. FFT Spectrum Generation ==========
    const fftResolution = 2048;
    const maxFreq = meshFreq * 10;
    const freqStep = maxFreq / fftResolution;
    const spectrum = [];

    for (let i = 0; i < fftResolution; i++) {
        const f = i * freqStep;
        let amplitude = 0.001 * Math.random(); // noise floor

        // Add harmonics
        harmonics.forEach(h => {
            const bw = meshFreq * 0.005; // Bandwidth
            const dist = Math.abs(f - h.frequency);
            if (dist < bw * 5) {
                amplitude += h.amplitude * Math.exp(-0.5 * (dist / bw) ** 2);
            }
        });

        // Add sidebands
        sidebands.forEach(sb => {
            const bw = shaftFreq_p * 0.5;
            const dist = Math.abs(f - sb.frequency);
            if (dist < bw * 5) {
                amplitude += sb.amplitude * Math.exp(-0.5 * (dist / bw) ** 2);
            }
        });

        spectrum.push({ frequency: f, amplitude });
    }

    // ========== 3. Modal Analysis (Multi-DOF) ==========
    // Simplified 4-DOF: pinion torsional, gear torsional, pinion lateral, gear lateral
    const r_p = (N_p * mod) / 2000; // m
    const r_g = (N_g * mod) / 2000; // m
    const meshStiffness = 2e8 * (faceWidth / 25) * (mod / 2); // N/m estimate

    // Torsional natural frequencies
    const I_p = 0.5 * gearMass_p * r_p * r_p; // kg·m²
    const I_g = 0.5 * gearMass_g * r_g * r_g;
    const k_eq_torsion = meshStiffness * r_p * r_p * r_g * r_g / (I_p * r_g * r_g + I_g * r_p * r_p);
    const f_n_torsion = Math.sqrt(k_eq_torsion) / (2 * Math.PI); // Hz

    // Lateral natural frequencies
    const f_n_lateral_p = Math.sqrt(bearingStiffness / gearMass_p) / (2 * Math.PI);
    const f_n_lateral_g = Math.sqrt(bearingStiffness / gearMass_g) / (2 * Math.PI);

    // Coupled mode
    const f_n_coupled = Math.sqrt(meshStiffness * (1 / gearMass_p + 1 / gearMass_g)) / (2 * Math.PI);

    const modes = [
        { mode: 1, type: 'Torsional', frequency: f_n_torsion, damping: dampingRatio, shape: 'Pinion-Gear twist' },
        { mode: 2, type: 'Lateral (Pinion)', frequency: f_n_lateral_p, damping: dampingRatio * 1.2, shape: 'Pinion bounce' },
        { mode: 3, type: 'Lateral (Gear)', frequency: f_n_lateral_g, damping: dampingRatio * 1.1, shape: 'Gear bounce' },
        { mode: 4, type: 'Coupled', frequency: f_n_coupled, damping: dampingRatio * 0.8, shape: 'Mesh rocking' },
    ];

    // ========== 4. Campbell Diagram ==========
    const campbellData = [];
    const speedRange = [];
    for (let rpm = speed_pinion * 0.2; rpm <= speed_pinion * 1.5; rpm += speed_pinion * 0.02) {
        speedRange.push(rpm);
        const mf = N_p * rpm / 60;
        campbellData.push({
            speed: rpm,
            meshFreq_1x: mf,
            meshFreq_2x: mf * 2,
            meshFreq_3x: mf * 3,
        });
    }

    // Resonance crossings
    const resonances = [];
    modes.forEach(m => {
        for (let h = 1; h <= 3; h++) {
            const criticalSpeed = (m.frequency * 60) / (N_p * h);
            if (criticalSpeed > speed_pinion * 0.2 && criticalSpeed < speed_pinion * 1.5) {
                resonances.push({
                    mode: m.mode,
                    harmonic: h,
                    criticalSpeed,
                    frequency: m.frequency,
                    severity: h === 1 ? 'HIGH' : h === 2 ? 'MEDIUM' : 'LOW'
                });
            }
        }
    });

    // ========== 5. Transmission Error & Gear Whine ==========
    // TE from AGMA quality number (µm)
    const teBase = 25 / Math.pow(2, (qualityNumber - 5) / 2); // µm base TE
    const teWithRelief = Math.max(1, teBase - tipRelief * 0.3 - crowning * 0.2);
    const teTotal = teWithRelief * (1 + 0.1 * Math.abs(profileShift));

    // Sound pressure level estimation (dB(A))
    const velocityFactor = Math.log10(omega_p * r_p * 1000 + 1) * 10;
    const baseSPL = 60 + velocityFactor + 20 * Math.log10(Math.max(teTotal, 0.1));
    const splWithRelief = baseSPL - tipRelief * 0.08 - crowning * 0.05;

    // ========== 6. Microgeometry Optimization ==========
    const optimalTipRelief = teBase * 0.4; // µm
    const optimalCrowning = faceWidth * 0.3; // µm
    const optimalProfile = 0.0; // Profile shift for noise

    const microgeometry = {
        current: { tipRelief, crowning, profileShift, te: teTotal, spl: splWithRelief },
        optimal: {
            tipRelief: optimalTipRelief,
            crowning: optimalCrowning,
            profileShift: optimalProfile,
            te: teBase * 0.3,
            spl: splWithRelief - 8
        },
        improvement: {
            teReduction: ((teTotal - teBase * 0.3) / teTotal * 100),
            splReduction: 8,
        }
    };

    // ========== 7. ISO 10816 Vibration Severity ==========
    const rmsVelocity = teTotal * omega_p * r_p * 0.001; // mm/s (simplified)
    let severity, severityClass;
    if (rmsVelocity < 0.71) { severity = 'Good'; severityClass = 'A'; }
    else if (rmsVelocity < 1.8) { severity = 'Acceptable'; severityClass = 'B'; }
    else if (rmsVelocity < 4.5) { severity = 'Alert'; severityClass = 'C'; }
    else { severity = 'Danger'; severityClass = 'D'; }

    // ========== 8. ISO 1940 Balancing Grade ==========
    const specificUnbalance = rmsVelocity / omega_p * 1000; // g·mm/kg
    let balancingGrade;
    if (specificUnbalance < 0.4) balancingGrade = 'G0.4 (Precision)';
    else if (specificUnbalance < 1) balancingGrade = 'G1 (Fine)';
    else if (specificUnbalance < 2.5) balancingGrade = 'G2.5 (Normal)';
    else if (specificUnbalance < 6.3) balancingGrade = 'G6.3 (Standard)';
    else balancingGrade = 'G16+ (Coarse)';

    return {
        meshFrequency: meshFreq,
        harmonics,
        sidebands: sidebands.slice(0, 6),
        spectrum,
        modes,
        campbellData,
        resonances,
        transmissionError: teTotal,
        soundPressureLevel: splWithRelief,
        microgeometry,
        vibrationSeverity: { rmsVelocity, severity, severityClass },
        balancingGrade,
        speedRange,
    };
}

export default { analyzeNVH };
