/**
 * GearOptix Bevel Gear Calculations
 * Source: "Machine Elements in Mechanical Design" 6th Ed, Chapter 10 (Sections 10-6 to 10-8)
 * AGMA 2003-C10 Standard
 */

import {
    getOverloadFactor, getDynamicFactor,
    getElasticCoefficient, getBendingLifeFactor, getPittingLifeFactor,
    getReliabilityFactor, getTemperatureFactor
} from '../data/agmaFactors';

/**
 * Bevel gear design per AGMA 2003-C10
 * Assumes straight bevel at 90° shaft angle
 */
export function designBevelGear(params) {
    const {
        power, speed_pinion, gearRatio,
        numTeethPinion, module: mod, faceWidth,
        pressureAngle = 20, shaftAngle = 90,
        materialPinion, materialGear,
        qualityNumber = 8,
        powerSource = 'uniform', drivenMachine = 'uniform',
        reliability = 0.99, designLife = 1e7,
        oilTemp = 160
    } = params;

    const trace = [];
    const addTrace = (step, label, value, formula = '') => {
        trace.push({ step, label, value, formula });
    };

    const N_p = Math.round(numTeethPinion);
    const N_g = Math.round(N_p * gearRatio);
    const m = mod;
    const F = faceWidth;
    const F_in = F / 25.4;
    const P_d = 25.4 / m;
    const m_G = N_g / N_p;
    const Sigma = (shaftAngle * Math.PI) / 180;
    const phi = (pressureAngle * Math.PI) / 180;

    // Pitch diameters
    const d_p = N_p * m;
    const d_g = N_g * m;
    const d_p_in = d_p / 25.4;
    const d_g_in = d_g / 25.4;

    // Pitch cone angles (for 90° shaft angle)
    const gamma_p = Math.atan(Math.sin(Sigma) / (m_G + Math.cos(Sigma)));
    const gamma_g = Sigma - gamma_p;

    // Cone distance (pitch cone element length)
    const A_o = d_p / (2 * Math.sin(gamma_p)); // mm
    const A_o_in = A_o / 25.4;

    // Mean cone distance
    const A_m = A_o - F / 2;
    const A_m_in = A_m / 25.4;

    // Mean pitch diameter (for calculations)
    const d_pm = d_p * (A_m / A_o);
    const d_gm = d_g * (A_m / A_o);

    addTrace(1, 'Pinion Teeth', N_p);
    addTrace(2, 'Gear Teeth', N_g);
    addTrace(3, 'Module', `${m} mm`);
    addTrace(4, 'Pinion Pitch Cone Angle (γ_p)', `${(gamma_p * 180 / Math.PI).toFixed(2)}°`);
    addTrace(5, 'Gear Pitch Cone Angle (γ_g)', `${(gamma_g * 180 / Math.PI).toFixed(2)}°`);
    addTrace(6, 'Cone Distance (A_o)', `${A_o.toFixed(2)} mm`);
    addTrace(7, 'Mean Cone Distance (A_m)', `${A_m.toFixed(2)} mm`);

    // ========== Forces ==========
    const speed_gear = speed_pinion / m_G;
    const power_W = power * 1000;
    const T_pinion = (power_W * 60) / (2 * Math.PI * speed_pinion);
    const V_pitch = (Math.PI * d_p_in * speed_pinion) / 12;

    const W_t_N = (2 * T_pinion) / (d_pm / 1000); // Based on mean diameter
    const W_t_lb = W_t_N * 0.2248;

    // Bevel gear forces (Section 10-6)
    const W_r_N = W_t_N * Math.tan(phi) * Math.cos(gamma_p);
    const W_a_pinion = W_t_N * Math.tan(phi) * Math.sin(gamma_p); // Axial on pinion

    addTrace(8, 'Tangential Force (W_t)', `${W_t_N.toFixed(1)} N`);
    addTrace(9, 'Radial Force (W_r)', `${W_r_N.toFixed(1)} N`);
    addTrace(10, 'Axial Force (W_a)', `${W_a_pinion.toFixed(1)} N`);

    // ========== AGMA Factors for Bevel ==========
    const K_o = getOverloadFactor(powerSource, drivenMachine);
    const K_v = getDynamicFactor(V_pitch, qualityNumber);

    // Size factor for bevel (approximation from AGMA 2003)
    const K_s = 0.4867 + 0.2132 / P_d;

    // Load distribution for bevel (simplified - depends on mounting)
    const K_m = 1.0 + 0.0036 * F_in * F_in; // Approximation

    addTrace(11, 'K_o', K_o.toFixed(3));
    addTrace(12, 'K_v', K_v.toFixed(3));
    addTrace(13, 'K_s (bevel)', K_s.toFixed(3));
    addTrace(14, 'K_m (bevel)', K_m.toFixed(3));

    // ========== J factor for bevel (Fig 10-15) ==========
    // Simplified interpolation for straight bevel at 20° PA
    const J_pinion = getBevelGeometryJ(N_p, N_g);
    const J_gear = getBevelGeometryJ(N_g, N_p);

    // I factor for bevel pitting
    const I = getBevelPittingI(N_p, N_g, pressureAngle);

    addTrace(15, 'J (pinion, bevel)', J_pinion.toFixed(4));
    addTrace(16, 'J (gear, bevel)', J_gear.toFixed(4));
    addTrace(17, 'I (bevel pitting)', I.toFixed(4));

    // ========== Stresses ==========
    const s_t_pinion_psi = (W_t_lb * P_d * K_o * K_v * K_s * K_m) / (F_in * J_pinion);
    const s_t_gear_psi = (W_t_lb * P_d * K_o * K_v * K_s * K_m) / (F_in * J_gear);
    const s_t_pinion = s_t_pinion_psi * 0.006895;
    const s_t_gear = s_t_gear_psi * 0.006895;

    const E_p = materialPinion.E * 1000;
    const E_g = materialGear.E * 1000;
    const C_p = getElasticCoefficient(E_p, materialPinion.poisson, E_g, materialGear.poisson);

    const s_c_psi = C_p * Math.sqrt((W_t_lb * K_o * K_v * K_s * K_m) / (F_in * d_p_in * I));
    const s_c = s_c_psi * 0.006895;

    addTrace(18, 'Bending Stress (pinion)', `${s_t_pinion.toFixed(1)} MPa`);
    addTrace(19, 'Bending Stress (gear)', `${s_t_gear.toFixed(1)} MPa`);
    addTrace(20, 'Contact Stress', `${s_c.toFixed(1)} MPa`);

    // ========== Safety Factors ==========
    const Y_N_p = getBendingLifeFactor(designLife);
    const Y_N_g = getBendingLifeFactor(designLife / m_G);
    const Z_N_p = getPittingLifeFactor(designLife);
    const Z_N_g = getPittingLifeFactor(designLife / m_G);
    const K_R = getReliabilityFactor(reliability);
    const K_T = getTemperatureFactor(oilTemp);

    const SF_bending_pinion = (materialPinion.s_at * Y_N_p) / (s_t_pinion * K_T * K_R);
    const SF_bending_gear = (materialGear.s_at * Y_N_g) / (s_t_gear * K_T * K_R);
    const SH_p = (materialPinion.s_ac * Z_N_p) / (s_c * K_T * K_R);
    const SH_g = (materialGear.s_ac * Z_N_g) / (s_c * K_T * K_R);
    const SF_contact_pinion = SH_p * SH_p;
    const SF_contact_gear = SH_g * SH_g;

    addTrace(21, 'SF Bending (pinion)', SF_bending_pinion.toFixed(2));
    addTrace(22, 'SF Bending (gear)', SF_bending_gear.toFixed(2));
    addTrace(23, 'SF Contact (pinion)', SF_contact_pinion.toFixed(2));
    addTrace(24, 'SF Contact (gear)', SF_contact_gear.toFixed(2));

    // Efficiency (bevel ≈ 95-99%)
    const efficiency = Math.max(0.95, 0.99 - 0.005 * m_G);

    return {
        inputs: {
            power, speed_pinion, gearRatio, numTeethPinion: N_p,
            module: m, faceWidth: F, pressureAngle, shaftAngle,
            materialPinion: materialPinion.name, materialGear: materialGear.name
        },
        geometry: {
            N_p, N_g, m, P_d, d_p, d_g, C: (d_p + d_g) / 2,
            gamma_p_deg: gamma_p * 180 / Math.PI,
            gamma_g_deg: gamma_g * 180 / Math.PI,
            A_o, A_m, d_pm, d_gm, F, F_in,
            m_G, speed_gear
        },
        forces: {
            T_pinion, W_t: W_t_N, W_r: W_r_N, W_a: W_a_pinion,
            W_t_lb, V_pitch
        },
        factors: { K_o, K_v, K_s, K_m, J_pinion, J_gear, I, C_p },
        stresses: {
            s_t_pinion, s_t_gear, s_c,
            s_t_pinion_psi, s_t_gear_psi, s_c_psi,
            s_at_pinion: materialPinion.s_at, s_at_gear: materialGear.s_at,
            s_ac_pinion: materialPinion.s_ac, s_ac_gear: materialGear.s_ac
        },
        safetyFactors: {
            bending_pinion: SF_bending_pinion, bending_gear: SF_bending_gear,
            contact_pinion: SF_contact_pinion, contact_gear: SF_contact_gear,
            min_bending: Math.min(SF_bending_pinion, SF_bending_gear),
            min_contact: Math.min(SF_contact_pinion, SF_contact_gear),
            bending_pass: Math.min(SF_bending_pinion, SF_bending_gear) >= 1.0,
            contact_pass: Math.min(SF_contact_pinion, SF_contact_gear) >= 1.0,
            overall_pass: Math.min(SF_bending_pinion, SF_bending_gear) >= 1.0 &&
                Math.min(SF_contact_pinion, SF_contact_gear) >= 1.0
        },
        performance: { efficiency, powerLoss: power * (1 - efficiency), heatGenerated: power * (1 - efficiency) * 1000 },
        trace
    };
}

/**
 * Simplified bevel gear J factor (from Fig 10-15)
 * For straight bevel, 20° PA, 90° shaft angle
 */
function getBevelGeometryJ(N_driver, N_driven) {
    const ratio = N_driven / N_driver;
    // Approximate curve fit from Fig 10-15
    const baseJ = 0.175 + 0.005 * Math.min(N_driver, 40);
    const ratioAdj = 1 + 0.04 * Math.log(ratio);
    return Math.max(0.18, Math.min(baseJ * ratioAdj, 0.42));
}

/**
 * Bevel gear pitting geometry factor I
 */
function getBevelPittingI(N_p, N_g, pressureAngle = 20) {
    const phi = (pressureAngle * Math.PI) / 180;
    const m_G = N_g / N_p;
    return (Math.cos(phi) * Math.sin(phi) / 2) * (m_G / (m_G + 1)) * 0.85; // 0.85 bevel correction
}

export default { designBevelGear };
