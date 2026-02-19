/**
 * GearOptix Helical Gear Calculations
 * Source: "Machine Elements in Mechanical Design" 6th Ed, Chapter 10 (Sections 10-1 to 10-5)
 * AGMA 2001-D04 for Helical Gears
 */

import { designSpurGear } from './spurGear';
import {
    getOverloadFactor, getDynamicFactor, getSizeFactor,
    getLoadDistributionFactor, getGeometryFactorJ,
    getPittingGeometryFactor, getElasticCoefficient,
    getBendingLifeFactor, getPittingLifeFactor,
    getReliabilityFactor, getTemperatureFactor,
    getLewisFormFactor
} from '../data/agmaFactors';

/**
 * Helical gear design uses normal-plane approach (Section 10-3)
 * Key conversions:
 *   P_nd = P_d / cos(ψ)   — Normal diametral pitch
 *   φ_n = atan(tan(φ) × cos(ψ))  — Normal pressure angle
 *   p_n = p × cos(ψ)    — Normal circular pitch
 */
export function designHelicalGear(params) {
    const {
        power, speed_pinion, gearRatio,
        numTeethPinion, module: mod, faceWidth,
        pressureAngle = 20, helixAngle = 25,
        materialPinion, materialGear,
        qualityNumber = 8,
        powerSource = 'uniform', drivenMachine = 'uniform',
        reliability = 0.99, designLife = 1e7,
        oilTemp = 160,
        crowned = false, straddle = true,
        adjustedAtAssembly = false, enclosureType = 'commercial'
    } = params;

    const trace = [];
    const addTrace = (step, label, value, formula = '') => {
        trace.push({ step, label, value, formula });
    };

    // ========== Helical-specific geometry ==========
    const psi = (helixAngle * Math.PI) / 180; // helix angle (rad)
    const phi_t = (pressureAngle * Math.PI) / 180; // transverse pressure angle
    const phi_n = Math.atan(Math.tan(phi_t) * Math.cos(psi)); // normal pressure angle

    // Normal module
    const m_n = mod * Math.cos(psi); // Normal module
    const m_t = mod; // Transverse module (as input)

    const N_p = Math.round(numTeethPinion);
    const N_g = Math.round(N_p * gearRatio);

    // Pitch diameters (based on transverse module)
    const d_p = N_p * m_t;
    const d_g = N_g * m_t;
    const C = (d_p + d_g) / 2;
    const m_G = N_g / N_p;

    const d_p_in = d_p / 25.4;
    const d_g_in = d_g / 25.4;
    const F = faceWidth;
    const F_in = F / 25.4;
    const P_d = 25.4 / m_t;
    const P_nd = P_d / Math.cos(psi); // Normal diametral pitch

    addTrace(1, 'Helix Angle (ψ)', `${helixAngle}°`);
    addTrace(2, 'Normal Pressure Angle (φ_n)', `${(phi_n * 180 / Math.PI).toFixed(2)}°`, 'φ_n = atan(tan(φ)·cos(ψ))');
    addTrace(3, 'Transverse Module (m_t)', `${m_t} mm`);
    addTrace(4, 'Normal Module (m_n)', `${m_n.toFixed(3)} mm`, 'm_n = m_t·cos(ψ)');
    addTrace(5, 'Normal Diametral Pitch (P_nd)', `${P_nd.toFixed(3)} 1/in`);
    addTrace(6, 'Pinion Pitch Diameter', `${d_p.toFixed(2)} mm`);
    addTrace(7, 'Gear Pitch Diameter', `${d_g.toFixed(2)} mm`);
    addTrace(8, 'Center Distance', `${C.toFixed(2)} mm`);

    // ========== Forces ==========
    const speed_gear = speed_pinion / m_G;
    const power_W = power * 1000;
    const T_pinion = (power_W * 60) / (2 * Math.PI * speed_pinion);
    const V_pitch = (Math.PI * d_p_in * speed_pinion) / 12;
    const V_ms = (Math.PI * (d_p / 1000) * speed_pinion) / 60;

    const W_t_N = (2 * T_pinion) / (d_p / 1000);
    const W_t_lb = W_t_N * 0.2248;

    // Helical forces (Section 10-3)
    const W_r_N = W_t_N * Math.tan(phi_n) / Math.cos(psi); // Radial
    const W_a_N = W_t_N * Math.tan(psi); // Axial (thrust)
    const W_n_N = W_t_N / (Math.cos(phi_n) * Math.cos(psi)); // Normal

    addTrace(9, 'Tangential Force (W_t)', `${W_t_N.toFixed(1)} N`);
    addTrace(10, 'Radial Force (W_r)', `${W_r_N.toFixed(1)} N`, 'W_r = W_t·tan(φ_n)/cos(ψ)');
    addTrace(11, 'Axial (Thrust) Force (W_a)', `${W_a_N.toFixed(1)} N`, 'W_a = W_t·tan(ψ)');
    addTrace(12, 'Normal Force (W_n)', `${W_n_N.toFixed(1)} N`);

    // ========== Virtual (Equivalent) Teeth ==========
    const N_vp = N_p / (Math.cos(psi) * Math.cos(psi) * Math.cos(psi));
    const N_vg = N_g / (Math.cos(psi) * Math.cos(psi) * Math.cos(psi));

    addTrace(13, 'Virtual Pinion Teeth (N_vp)', N_vp.toFixed(1), 'N_v = N/cos³(ψ)');
    addTrace(14, 'Virtual Gear Teeth (N_vg)', N_vg.toFixed(1));

    // ========== AGMA Factors (use normal-plane values) ==========
    const K_o = getOverloadFactor(powerSource, drivenMachine);
    const K_v = getDynamicFactor(V_pitch, qualityNumber);
    const Y_lewis = getLewisFormFactor(Math.round(N_vp));
    const K_s = getSizeFactor(P_nd, F_in, Y_lewis);
    const K_m = getLoadDistributionFactor(F_in, d_p_in, { crowned, straddle, adjustedAtAssembly, enclosureType });
    const K_B = 1.0;

    // Use virtual teeth for J factor
    const J_pinion = getGeometryFactorJ(Math.round(N_vp), Math.round(N_vg));
    const J_gear = getGeometryFactorJ(Math.round(N_vg), Math.round(N_vp));

    // Helical overlap factor (increase J by ~5-15%)
    const C_psi = Math.min(1.0 + 0.003 * helixAngle, 1.15); // Empirical helical benefit
    const J_pinion_h = J_pinion * C_psi;
    const J_gear_h = J_gear * C_psi;

    // Pitting geometry with helix angle
    const I = getPittingGeometryFactor(N_p, N_g, pressureAngle, helixAngle);

    addTrace(15, 'K_o', K_o.toFixed(3));
    addTrace(16, 'K_v', K_v.toFixed(3));
    addTrace(17, 'K_s', K_s.toFixed(3));
    addTrace(18, 'K_m', K_m.toFixed(3));
    addTrace(19, 'J (pinion, helical)', J_pinion_h.toFixed(4));
    addTrace(20, 'J (gear, helical)', J_gear_h.toFixed(4));
    addTrace(21, 'I (pitting)', I.toFixed(4));

    // ========== Stresses ==========
    const s_t_pinion_psi = (W_t_lb * P_nd * K_o * K_v * K_s * K_m * K_B) / (F_in * J_pinion_h);
    const s_t_gear_psi = (W_t_lb * P_nd * K_o * K_v * K_s * K_m * K_B) / (F_in * J_gear_h);
    const s_t_pinion = s_t_pinion_psi * 0.006895;
    const s_t_gear = s_t_gear_psi * 0.006895;

    const E_p = materialPinion.E * 1000;
    const E_g = materialGear.E * 1000;
    const C_p = getElasticCoefficient(E_p, materialPinion.poisson, E_g, materialGear.poisson);

    const s_c_psi = C_p * Math.sqrt((W_t_lb * K_o * K_v * K_s * K_m) / (F_in * d_p_in * I));
    const s_c = s_c_psi * 0.006895;

    addTrace(22, 'Bending Stress (pinion)', `${s_t_pinion.toFixed(1)} MPa`);
    addTrace(23, 'Bending Stress (gear)', `${s_t_gear.toFixed(1)} MPa`);
    addTrace(24, 'Contact Stress', `${s_c.toFixed(1)} MPa`);

    // ========== Safety Factors ==========
    const N_cycles_pinion = designLife;
    const N_cycles_gear = designLife / m_G;
    const Y_N_p = getBendingLifeFactor(N_cycles_pinion);
    const Y_N_g = getBendingLifeFactor(N_cycles_gear);
    const Z_N_p = getPittingLifeFactor(N_cycles_pinion);
    const Z_N_g = getPittingLifeFactor(N_cycles_gear);
    const K_R = getReliabilityFactor(reliability);
    const K_T = getTemperatureFactor(oilTemp);

    const SF_bending_pinion = (materialPinion.s_at * Y_N_p) / (s_t_pinion * K_T * K_R);
    const SF_bending_gear = (materialGear.s_at * Y_N_g) / (s_t_gear * K_T * K_R);
    const SH_p = (materialPinion.s_ac * Z_N_p) / (s_c * K_T * K_R);
    const SH_g = (materialGear.s_ac * Z_N_g) / (s_c * K_T * K_R);
    const SF_contact_pinion = SH_p * SH_p;
    const SF_contact_gear = SH_g * SH_g;

    addTrace(25, 'SF Bending (pinion)', SF_bending_pinion.toFixed(2));
    addTrace(26, 'SF Bending (gear)', SF_bending_gear.toFixed(2));
    addTrace(27, 'SF Contact (pinion)', SF_contact_pinion.toFixed(2));
    addTrace(28, 'SF Contact (gear)', SF_contact_gear.toFixed(2));

    // ========== Efficiency (Eq 10-7 approx) ==========
    const f = 0.06;
    const efficiency = 1 - f * Math.PI * (1 / N_p + 1 / N_g) / (Math.cos(psi) * Math.cos(phi_n));
    const eff = Math.max(0.90, Math.min(efficiency, 0.995));

    addTrace(29, 'Mesh Efficiency', `${(eff * 100).toFixed(2)}%`);

    // Tooth geometry
    const addendum = m_n;
    const dedendum = 1.25 * m_n;
    const wholeDepth = 2.25 * m_n;

    return {
        inputs: {
            power, speed_pinion, gearRatio, numTeethPinion: N_p,
            module: m_t, faceWidth: F, pressureAngle, helixAngle,
            materialPinion: materialPinion.name, materialGear: materialGear.name,
            qualityNumber, reliability, designLife
        },
        geometry: {
            N_p, N_g, m_t, m_n, P_d, P_nd,
            d_p, d_g, C, F, F_in,
            N_vp, N_vg,
            addendum, dedendum, wholeDepth,
            outsideDiamPinion: d_p + 2 * addendum,
            outsideDiamGear: d_g + 2 * addendum,
            m_G, speed_gear, helixAngle,
            phi_n_deg: phi_n * 180 / Math.PI
        },
        forces: {
            T_pinion, W_t: W_t_N, W_r: W_r_N, W_a: W_a_N, W_n: W_n_N,
            W_t_lb, V_pitch, V_ms
        },
        factors: {
            K_o, K_v, K_s, K_m, K_B,
            J_pinion: J_pinion_h, J_gear: J_gear_h, I, C_p,
            Y_N_p, Y_N_g, Z_N_p, Z_N_g, K_R, K_T
        },
        stresses: {
            s_t_pinion, s_t_gear, s_t_pinion_psi, s_t_gear_psi,
            s_c, s_c_psi,
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
        performance: {
            efficiency: eff,
            powerLoss: power * (1 - eff),
            heatGenerated: power * (1 - eff) * 1000
        },
        trace
    };
}

export default { designHelicalGear };
