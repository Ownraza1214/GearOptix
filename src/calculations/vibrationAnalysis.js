/**
 * GearOptix Vibration Analysis
 * Source: "Machine Elements in Mechanical Design" 6th Ed, Sections 3-13, 3-14
 * Natural frequencies, FFT spectral analysis, NVH prediction
 */

/**
 * Calculate gear mesh natural frequencies and NVH characteristics
 */
export function analyzeVibration(params) {
    const {
        speed_pinion,    // RPM
        speed_gear,      // RPM
        N_pinion,        // teeth
        N_gear,          // teeth
        shaftStiffness = 1e6, // N/m (per shaft)
        gearMass = 2,    // kg (per gear)
        dampingRatio = 0.05
    } = params;

    // ========== Mesh Frequency ==========
    // f_mesh = N × RPM / 60
    const meshFreqPinion = (N_pinion * speed_pinion) / 60; // Hz
    const meshFreqGear = (N_gear * speed_gear) / 60; // Hz (should be same)
    const meshFreq = meshFreqPinion; // They should match

    // Shaft rotational frequencies
    const shaftFreqPinion = speed_pinion / 60; // Hz
    const shaftFreqGear = speed_gear / 60;

    // ========== Natural Frequency ==========
    // f_n = (1/2π) × √(k/m)  — single DOF model
    const omega_n = Math.sqrt(shaftStiffness / gearMass); // rad/s
    const f_n = omega_n / (2 * Math.PI); // Hz

    // Damped natural frequency
    const omega_d = omega_n * Math.sqrt(1 - dampingRatio * dampingRatio);
    const f_d = omega_d / (2 * Math.PI);

    // ========== Frequency Ratio & Amplification ==========
    const r = meshFreq / f_n; // Frequency ratio
    const amplification = 1 / Math.sqrt(
        Math.pow(1 - r * r, 2) + Math.pow(2 * dampingRatio * r, 2)
    );

    // ========== Generate Spectrum Data ==========
    // Simulated FFT spectrum with mesh frequency harmonics
    const spectrumData = [];
    const maxFreq = Math.max(meshFreq * 5, 2000);
    const numPoints = 512;

    for (let i = 0; i < numPoints; i++) {
        const freq = (i / numPoints) * maxFreq;
        let amplitude = 0;

        // Background noise
        amplitude += 0.01 * Math.random();

        // Shaft frequencies
        amplitude += gaussianPeak(freq, shaftFreqPinion, 2, 0.15);
        amplitude += gaussianPeak(freq, shaftFreqGear, 2, 0.12);

        // Mesh frequency and harmonics
        for (let h = 1; h <= 4; h++) {
            const harmFreq = meshFreq * h;
            const harmAmp = 1.0 / (h * h); // Decaying harmonics
            amplitude += gaussianPeak(freq, harmFreq, 5, harmAmp);

            // Sidebands (mesh freq ± shaft freq)
            amplitude += gaussianPeak(freq, harmFreq + shaftFreqPinion, 3, harmAmp * 0.1);
            amplitude += gaussianPeak(freq, harmFreq - shaftFreqPinion, 3, harmAmp * 0.1);
        }

        // Resonance amplification near natural frequency
        if (Math.abs(freq - f_n) < f_n * 0.2) {
            amplitude *= (1 + amplification * 0.1);
        }

        spectrumData.push({ frequency: freq, amplitude });
    }

    // ========== Vibration Severity (ISO 10816) ==========
    const rmsVelocity = 0.5 + 3 * r * amplification; // mm/s (simplified estimate)
    let severityClass;
    if (rmsVelocity < 1.8) severityClass = 'Good';
    else if (rmsVelocity < 4.5) severityClass = 'Acceptable';
    else if (rmsVelocity < 11.2) severityClass = 'Unsatisfactory';
    else severityClass = 'Unacceptable';

    // ========== NVH Prediction ==========
    // Sound pressure level estimate (dB) — empirical
    const SPL = 50 + 20 * Math.log10(meshFreq) + 10 * Math.log10(Math.max(amplification, 1));

    return {
        frequencies: {
            meshFrequency: meshFreq.toFixed(1),
            shaftFreqPinion: shaftFreqPinion.toFixed(2),
            shaftFreqGear: shaftFreqGear.toFixed(2),
            naturalFrequency: f_n.toFixed(1),
            dampedFrequency: f_d.toFixed(1)
        },
        dynamics: {
            frequencyRatio: r.toFixed(3),
            amplificationFactor: amplification.toFixed(3),
            dampingRatio,
            resonanceRisk: r > 0.8 && r < 1.2 ? 'HIGH' : r > 0.5 && r < 1.5 ? 'MODERATE' : 'LOW'
        },
        vibration: {
            rmsVelocity: rmsVelocity.toFixed(2),
            severityClass,
            SPL_dB: SPL.toFixed(1)
        },
        spectrum: spectrumData,
        recommendations: getVibrationRecommendations(r, amplification, severityClass)
    };
}

function gaussianPeak(x, center, width, amplitude) {
    return amplitude * Math.exp(-0.5 * Math.pow((x - center) / width, 2));
}

function getVibrationRecommendations(r, amp, severity) {
    const recs = [];
    if (r > 0.8 && r < 1.2) {
        recs.push('⚠️ Operating near resonance! Consider changing speed or adding damping.');
    }
    if (severity === 'Unsatisfactory' || severity === 'Unacceptable') {
        recs.push('Vibration levels exceed acceptable limits. Consider: higher quality gears, better alignment, or vibration isolation.');
    }
    if (amp > 5) {
        recs.push('High amplification factor. Increase damping or stiffen the system.');
    }
    if (recs.length === 0) {
        recs.push('✅ Vibration levels within acceptable range.');
    }
    return recs;
}

export default { analyzeVibration };
