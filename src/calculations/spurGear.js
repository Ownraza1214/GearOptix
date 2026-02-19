/**
 * GearOptix Spur Gear Calculations
 * Source: "Machine Elements in Mechanical Design" 6th Ed, Chapter 9
 * AGMA 2001-D04 Standard
 * Implements full 22-step design procedure (Section 9-9)
 */

import {
    getOverloadFactor, getDynamicFactor, getSizeFactor,
    getLoadDistributionFactor, getRimThicknessFactor,
    getGeometryFactorJ, getPittingGeometryFactor,
    getElasticCoefficient, getLewisFormFactor,
    getBendingLifeFactor, getPittingLifeFactor,
    getReliabilityFactor, getTemperatureFactor,
} from '../data/agmaFactors';

/**
 * Complete spur gear pair design analysis
 * @param {Object} params - Design parameters
 * @returns {Object} Complete analysis results with calculation trace
 */
export function designSpurGear(params) {
    const {
        // Operating conditions
        power,          // kW
        speed_pinion,   // RPM
        gearRatio,      // N_g / N_p (≥ 1.0)

        // Gear geometry
        numTeethPinion, // N_p
        module: mod,    // mm (metric module)
        faceWidth,      // mm
        pressureAngle = 20, // degrees

        // Material properties
        materialPinion, // material object
        materialGear,   // material object (can be same)

        // AGMA factors (overrides)
        qualityNumber = 8,   // Qv (5-12)
        powerSource = 'uniform',
        drivenMachine = 'uniform',
        reliability = 0.99,
        designLife = 1e7,    // cycles
        oilTemp = 160,       // °F

        // Assembly
        crowned = false,
        straddle = true,
        adjustedAtAssembly = false,
        enclosureType = 'commercial',

        // Unit system
        unitSystem = 'SI'  // 'SI' or 'Imperial'
    } = params;

    const trace = [];
    const addTrace = (step, label, value, formula = '') => {
        trace.push({ step, label, value, formula });
    };

    // ========== Step 1-3: Basic Geometry ==========
    const N_p = Math.round(numTeethPinion);
    const N_g = Math.round(N_p * gearRatio);
    const m = mod; // metric module (mm)
    const P_d = 25.4 / m; // diametral pitch (1/in)
    const F = faceWidth; // mm
    const F_in = F / 25.4; // face width in inches

    // Pitch diameters
    const d_p = N_p * m; // mm
    const d_g = N_g * m; // mm
    const d_p_in = d_p / 25.4; // inches
    const d_g_in = d_g / 25.4;

    // Center distance
    const C = (d_p + d_g) / 2; // mm

    // Actual gear ratio
    const m_G = N_g / N_p;

    addTrace(1, 'Pinion Teeth (N_p)', N_p);
    addTrace(2, 'Gear Teeth (N_g)', N_g);
    addTrace(3, 'Module (m)', `${m} mm`);
    addTrace(4, 'Diametral Pitch (P_d)', `${P_d.toFixed(2)} 1/in`);
    addTrace(5, 'Pinion Pitch Diameter (d_p)', `${d_p.toFixed(2)} mm`);
    addTrace(6, 'Gear Pitch Diameter (d_g)', `${d_g.toFixed(2)} mm`);
    addTrace(7, 'Center Distance (C)', `${C.toFixed(2)} mm`);
    addTrace(8, 'Gear Ratio (m_G)', m_G.toFixed(4));

    // ========== Step 4: Velocities ==========
    const speed_gear = speed_pinion / m_G;
    const V_pitch = (Math.PI * d_p_in * speed_pinion) / 12; // ft/min
    const V_ms = (Math.PI * (d_p / 1000) * speed_pinion) / 60; // m/s

    addTrace(9, 'Gear Speed', `${speed_gear.toFixed(1)} RPM`);
    addTrace(10, 'Pitch Line Velocity', `${V_pitch.toFixed(1)} ft/min (${V_ms.toFixed(2)} m/s)`);

    // ========== Step 5: Forces (Eq 9-7, 9-8) ==========
    const power_W = power * 1000; // Watts
    const T_pinion = (power_W * 60) / (2 * Math.PI * speed_pinion); // N·m
    const T_pinion_lbin = T_pinion * 8.8507; // lb·in

    // Tangential force
    const W_t_N = (2 * T_pinion) / (d_p / 1000); // Newtons
    const W_t_lb = W_t_N * 0.2248; // lbf

    // Radial force
    const phi = (pressureAngle * Math.PI) / 180;
    const W_r_N = W_t_N * Math.tan(phi);
    const W_r_lb = W_r_N * 0.2248;

    // Resultant
    const W_n_N = W_t_N / Math.cos(phi);

    addTrace(11, 'Pinion Torque', `${T_pinion.toFixed(2)} N·m`);
    addTrace(12, 'Tangential Force (W_t)', `${W_t_N.toFixed(1)} N (${W_t_lb.toFixed(1)} lb)`, 'W_t = 2T/d');
    addTrace(13, 'Radial Force (W_r)', `${W_r_N.toFixed(1)} N`, 'W_r = W_t × tan(φ)');
    addTrace(14, 'Normal Force (W_n)', `${W_n_N.toFixed(1)} N`, 'W_n = W_t / cos(φ)');

    // ========== Step 6-11: AGMA Factors ==========
    const K_o = getOverloadFactor(powerSource, drivenMachine);
    const K_v = getDynamicFactor(V_pitch, qualityNumber);
    const Y_lewis = getLewisFormFactor(N_p);
    const K_s = getSizeFactor(P_d, F_in, Y_lewis);
    const K_m = getLoadDistributionFactor(F_in, d_p_in, { crowned, straddle, adjustedAtAssembly, enclosureType });
    const K_B = 1.0; // Assume solid gear (m_B ≥ 1.2)

    addTrace(15, 'Overload Factor (K_o)', K_o.toFixed(3), `Table 9-1: ${powerSource}/${drivenMachine}`);
    addTrace(16, 'Dynamic Factor (K_v)', K_v.toFixed(3), `Fig 9-16: Qv=${qualityNumber}, V=${V_pitch.toFixed(0)} ft/min`);
    addTrace(17, 'Size Factor (K_s)', K_s.toFixed(3), 'Fig 9-13');
    addTrace(18, 'Load Distribution (K_m)', K_m.toFixed(3), 'Eq 9-17');
    addTrace(19, 'Rim Thickness (K_B)', K_B.toFixed(3), 'Solid gear');

    // ========== Step 12: Geometry Factors ==========
    const J_pinion = getGeometryFactorJ(N_p, N_g, pressureAngle);
    const J_gear = getGeometryFactorJ(N_g, N_p, pressureAngle); // Swap for gear
    const I = getPittingGeometryFactor(N_p, N_g, pressureAngle);

    addTrace(20, 'Geometry Factor J (pinion)', J_pinion.toFixed(4), 'Fig 9-10');
    addTrace(21, 'Geometry Factor J (gear)', J_gear.toFixed(4), 'Fig 9-10');
    addTrace(22, 'Pitting Geometry I', I.toFixed(4), 'Fig 9-17');

    // ========== Step 13: AGMA Bending Stress (Eq 9-16) ==========
    // s_t = (W_t × P_d × K_o × K_v × K_s × K_m × K_B) / (F × J)
    const s_t_pinion_psi = (W_t_lb * P_d * K_o * K_v * K_s * K_m * K_B) / (F_in * J_pinion);
    const s_t_gear_psi = (W_t_lb * P_d * K_o * K_v * K_s * K_m * K_B) / (F_in * J_gear);

    // Convert to MPa
    const s_t_pinion = s_t_pinion_psi * 0.006895; // psi to MPa
    const s_t_gear = s_t_gear_psi * 0.006895;

    addTrace(23, 'Bending Stress σ_t (pinion)', `${s_t_pinion.toFixed(1)} MPa (${s_t_pinion_psi.toFixed(0)} psi)`,
        'σ_t = W_t·P_d·K_o·K_v·K_s·K_m·K_B / (F·J)');
    addTrace(24, 'Bending Stress σ_t (gear)', `${s_t_gear.toFixed(1)} MPa (${s_t_gear_psi.toFixed(0)} psi)`, 'Eq 9-16');

    // ========== Step 14: Elastic Coefficient ==========
    const E_p = materialPinion.E * 1000; // GPa -> MPa
    const E_g = materialGear.E * 1000;
    const v_p = materialPinion.poisson;
    const v_g = materialGear.poisson;
    const C_p = getElasticCoefficient(E_p, v_p, E_g, v_g);

    addTrace(25, 'Elastic Coefficient (C_p)', `${C_p.toFixed(1)} √MPa`, 'Eq 9-24');

    // ========== Step 15: AGMA Contact Stress (Eq 9-23) ==========
    // s_c = C_p × √(W_t × K_o × K_v × K_s × K_m / (F × d_p × I))
    const s_c_psi = C_p * Math.sqrt(
        (W_t_lb * K_o * K_v * K_s * K_m) / (F_in * d_p_in * I)
    );
    const s_c = s_c_psi * 0.006895; // MPa

    addTrace(26, 'Contact Stress σ_c', `${s_c.toFixed(1)} MPa (${s_c_psi.toFixed(0)} psi)`,
        'σ_c = C_p × √(W_t·K_o·K_v·K_s·K_m / (F·d·I))');

    // ========== Step 16: Life Factors & Allowable Stresses ==========
    const N_cycles_pinion = designLife;
    const N_cycles_gear = designLife / m_G;

    const Y_N_p = getBendingLifeFactor(N_cycles_pinion);
    const Y_N_g = getBendingLifeFactor(N_cycles_gear);
    const Z_N_p = getPittingLifeFactor(N_cycles_pinion);
    const Z_N_g = getPittingLifeFactor(N_cycles_gear);

    const K_R = getReliabilityFactor(reliability);
    const K_T = getTemperatureFactor(oilTemp);

    addTrace(27, 'Pinion Cycles', N_cycles_pinion.toExponential(2));
    addTrace(28, 'Gear Cycles', N_cycles_gear.toExponential(2));
    addTrace(29, 'Bending Life Factor Y_N (pinion)', Y_N_p.toFixed(3), 'Fig 9-21');
    addTrace(30, 'Bending Life Factor Y_N (gear)', Y_N_g.toFixed(3));
    addTrace(31, 'Pitting Life Factor Z_N (pinion)', Z_N_p.toFixed(3), 'Fig 9-22');
    addTrace(32, 'Pitting Life Factor Z_N (gear)', Z_N_g.toFixed(3));
    addTrace(33, 'Reliability Factor (K_R)', K_R.toFixed(3), `R = ${reliability}`);
    addTrace(34, 'Temperature Factor (K_T)', K_T.toFixed(3), `T = ${oilTemp}°F`);

    // ========== Step 17-18: Safety Factors ==========
    // Bending SF = (s_at × Y_N) / (s_t × K_T × K_R)
    const SF_bending_pinion = (materialPinion.s_at * Y_N_p) / (s_t_pinion * K_T * K_R);
    const SF_bending_gear = (materialGear.s_at * Y_N_g) / (s_t_gear * K_T * K_R);

    // Contact SF = (s_ac × Z_N / (s_c × K_T × K_R))²   — squared per AGMA
    const SH_pinion = (materialPinion.s_ac * Z_N_p) / (s_c * K_T * K_R);
    const SH_gear = (materialGear.s_ac * Z_N_g) / (s_c * K_T * K_R);
    const SF_contact_pinion = SH_pinion * SH_pinion;
    const SF_contact_gear = SH_gear * SH_gear;

    addTrace(35, 'SF Bending (pinion)', SF_bending_pinion.toFixed(2), 'SF = s_at·Y_N / (σ_t·K_T·K_R)');
    addTrace(36, 'SF Bending (gear)', SF_bending_gear.toFixed(2));
    addTrace(37, 'SF Contact (pinion)', SF_contact_pinion.toFixed(2), 'SF = (s_ac·Z_N / (σ_c·K_T·K_R))²');
    addTrace(38, 'SF Contact (gear)', SF_contact_gear.toFixed(2));

    // ========== Step 19: Efficiency ==========
    const efficiency = calculateSpurEfficiency(N_p, N_g, pressureAngle);

    addTrace(39, 'Mesh Efficiency', `${(efficiency * 100).toFixed(2)}%`);

    // ========== Step 20: Tooth Geometry ==========
    const addendum = m; // mm
    const dedendum = 1.25 * m;
    const clearance = 0.25 * m;
    const wholeDepth = 2.25 * m;
    const workingDepth = 2.0 * m;
    const circularPitch = Math.PI * m;
    const toothThickness = circularPitch / 2;
    const outsideDiamPinion = d_p + 2 * addendum;
    const outsideDiamGear = d_g + 2 * addendum;
    const rootDiamPinion = d_p - 2 * dedendum;
    const rootDiamGear = d_g - 2 * dedendum;
    const baseDiamPinion = d_p * Math.cos(phi);
    const baseDiamGear = d_g * Math.cos(phi);

    // ========== Compile Results ==========
    const passThreshold = 1.0;

    return {
        // Input echo
        inputs: {
            power, speed_pinion, gearRatio, numTeethPinion: N_p,
            module: m, faceWidth: F, pressureAngle,
            materialPinion: materialPinion.name,
            materialGear: materialGear.name,
            qualityNumber, reliability, designLife
        },

        // Geometry
        geometry: {
            N_p, N_g, m, P_d,
            d_p, d_g, C,
            F, F_in,
            addendum, dedendum, clearance,
            wholeDepth, workingDepth,
            circularPitch, toothThickness,
            outsideDiamPinion, outsideDiamGear,
            rootDiamPinion, rootDiamGear,
            baseDiamPinion, baseDiamGear,
            m_G, speed_gear
        },

        // Forces
        forces: {
            T_pinion, W_t: W_t_N, W_r: W_r_N, W_n: W_n_N,
            W_t_lb, W_r_lb,
            V_pitch, V_ms
        },

        // AGMA Factors
        factors: {
            K_o, K_v, K_s, K_m, K_B,
            J_pinion, J_gear, I, C_p,
            Y_N_p, Y_N_g, Z_N_p, Z_N_g,
            K_R, K_T
        },

        // Stresses
        stresses: {
            s_t_pinion, s_t_gear,
            s_t_pinion_psi, s_t_gear_psi,
            s_c, s_c_psi,
            s_at_pinion: materialPinion.s_at,
            s_at_gear: materialGear.s_at,
            s_ac_pinion: materialPinion.s_ac,
            s_ac_gear: materialGear.s_ac
        },

        // Safety Factors
        safetyFactors: {
            bending_pinion: SF_bending_pinion,
            bending_gear: SF_bending_gear,
            contact_pinion: SF_contact_pinion,
            contact_gear: SF_contact_gear,
            min_bending: Math.min(SF_bending_pinion, SF_bending_gear),
            min_contact: Math.min(SF_contact_pinion, SF_contact_gear),
            bending_pass: Math.min(SF_bending_pinion, SF_bending_gear) >= passThreshold,
            contact_pass: Math.min(SF_contact_pinion, SF_contact_gear) >= passThreshold,
            overall_pass: Math.min(SF_bending_pinion, SF_bending_gear) >= passThreshold &&
                Math.min(SF_contact_pinion, SF_contact_gear) >= passThreshold
        },

        // Performance
        performance: {
            efficiency,
            powerLoss: power * (1 - efficiency),
            heatGenerated: power * (1 - efficiency) * 1000 // Watts
        },

        // Calculation trace
        trace
    };
}

/**
 * Calculate spur gear mesh efficiency
 * η = 1 - f × π(1/N_p + 1/N_g) where f ≈ 0.05-0.08 (friction coeff)
 */
export function calculateSpurEfficiency(N_p, N_g, pressureAngle = 20, frictionCoeff = 0.06) {
    const phi = (pressureAngle * Math.PI) / 180;
    const slidingLoss = frictionCoeff * Math.PI * (1 / N_p + 1 / N_g) * (1 / Math.cos(phi));
    return Math.max(0.90, 1 - slidingLoss);
}

/**
 * Modified Lewis equation for bending stress (Eq 9-13)
 * s = W_t × P_d / (F × Y)  — basic Lewis
 */
export function lewisEquation(W_t, P_d, F, Y) {
    return (W_t * P_d) / (F * Y);
}

/**
 * Minimum number of teeth to avoid interference (Section 8-5)
 */
export function minTeethNoInterference(pressureAngle = 20, gearRatio = 1) {
    const phi = (pressureAngle * Math.PI) / 180;
    const k = 1.0; // full-depth
    const N_min = (2 * k * (1 + 2 * gearRatio)) /
        ((1 + 2 * gearRatio) * Math.sin(phi) * Math.sin(phi) - 1 + Math.sqrt(1 + (1 + 2 * gearRatio) * (1 + 2 * gearRatio) * Math.sin(phi) * Math.sin(phi) - (1 + 2 * gearRatio)));
    return Math.ceil(N_min);
}

/**
 * Fatigue life estimation based on S-N curve
 * Returns estimated cycles to failure at given stress
 */
export function estimateFatigueLife(appliedStress, allowableStress, enduranceLimit = null) {
    if (!enduranceLimit) enduranceLimit = allowableStress * 0.5;
    if (appliedStress <= enduranceLimit) return Infinity; // below endurance limit
    if (appliedStress >= allowableStress) return 1000; // immediate concern

    // Log-linear interpolation on S-N curve (10³ to 10⁶ knee)
    const logN = 3 + 3 * (Math.log10(allowableStress) - Math.log10(appliedStress)) /
        (Math.log10(allowableStress) - Math.log10(enduranceLimit));
    return Math.pow(10, Math.min(logN, 10));
}

export default { designSpurGear, calculateSpurEfficiency, lewisEquation, minTeethNoInterference, estimateFatigueLife };
