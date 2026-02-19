/**
 * GearOptix Worm Gear Calculations
 * Source: "Machine Elements in Mechanical Design" 6th Ed, Chapter 10 (Sections 10-9 to 10-13)
 * AGMA 6034-B92 Standard
 */

import { getOverloadFactor, getReliabilityFactor } from '../data/agmaFactors';

/**
 * Worm gear design per AGMA 6034-B92
 * Efficiency: η = (cos φ_n - μ tan λ) / (cos φ_n tan λ + μ)  (Eq 10-5)
 * Friction coefficient: μ from Eq 10-8
 */
export function designWormGear(params) {
    const {
        power, speed_worm, gearRatio,
        numThreadsWorm = 2, // N_w (typically 1-8)
        module: mod, faceWidth,
        pressureAngle = 20, // normal pressure angle (14.5° or 20°)
        materialWorm, materialGear, // worm: steel, gear: bronze
        powerSource = 'uniform', drivenMachine = 'uniform',
        reliability = 0.99, designLife = 1e7
    } = params;

    const trace = [];
    const addTrace = (step, label, value, formula = '') => {
        trace.push({ step, label, value, formula });
    };

    const N_w = numThreadsWorm;
    const N_g = Math.round(N_w * gearRatio); // Gear teeth
    const m_G = N_g / N_w; // Actual ratio

    // Worm geometry
    const p = Math.PI * mod; // Axial pitch (mm)
    const L = N_w * p; // Lead (mm)
    const d_w = mod * (N_w + 2) * 2.4; // Worm pitch diameter (empirical, mm)
    const d_g = N_g * mod; // Gear pitch diameter (mm)
    const C = (d_w + d_g) / 2; // Center distance (mm)

    // Lead angle
    const lambda = Math.atan(L / (Math.PI * d_w)); // radians
    const lambda_deg = lambda * 180 / Math.PI;

    // Normal pressure angle
    const phi_n = (pressureAngle * Math.PI) / 180;

    addTrace(1, 'Worm Threads (N_w)', N_w);
    addTrace(2, 'Gear Teeth (N_g)', N_g);
    addTrace(3, 'Gear Ratio', m_G.toFixed(2));
    addTrace(4, 'Axial Pitch', `${p.toFixed(2)} mm`);
    addTrace(5, 'Lead', `${L.toFixed(2)} mm`);
    addTrace(6, 'Worm Pitch Diameter', `${d_w.toFixed(2)} mm`);
    addTrace(7, 'Gear Pitch Diameter', `${d_g.toFixed(2)} mm`);
    addTrace(8, 'Center Distance', `${C.toFixed(2)} mm`);
    addTrace(9, 'Lead Angle (λ)', `${lambda_deg.toFixed(2)}°`, 'λ = atan(L / πd_w)');

    // ========== Velocities ==========
    const speed_gear = speed_worm / m_G;
    const V_s = (Math.PI * (d_w / 1000) * speed_worm) / (60 * Math.cos(lambda)); // Sliding velocity (m/s)
    const V_s_ftmin = V_s * 196.85;

    addTrace(10, 'Gear Speed', `${speed_gear.toFixed(2)} RPM`);
    addTrace(11, 'Sliding Velocity', `${V_s.toFixed(2)} m/s (${V_s_ftmin.toFixed(0)} ft/min)`);

    // ========== Friction Coefficient (Eq 10-8, Fig 10-14) ==========
    // μ depends on sliding velocity
    let mu;
    if (V_s_ftmin <= 0) {
        mu = 0.15;
    } else if (V_s_ftmin < 10) {
        mu = 0.124 * Math.exp(-0.074 * Math.pow(V_s_ftmin, 0.645));
        mu = Math.max(mu, 0.012);
    } else if (V_s_ftmin < 100) {
        mu = 0.103 * Math.exp(-0.110 * Math.pow(V_s_ftmin, 0.450));
        mu = Math.max(mu, 0.012);
    } else {
        mu = 0.012 + 0.46 / (V_s_ftmin + 50);
    }

    addTrace(12, 'Friction Coefficient (μ)', mu.toFixed(4), 'Eq 10-8 / Fig 10-14');

    // ========== Efficiency (Eq 10-5) ==========
    // η = (cos φ_n - μ tan λ) / (cos φ_n tan λ + μ)
    const cos_phi = Math.cos(phi_n);
    const tan_lambda = Math.tan(lambda);
    const efficiency = (cos_phi - mu * tan_lambda) / (cos_phi * tan_lambda + mu);

    addTrace(13, 'Mesh Efficiency', `${(efficiency * 100).toFixed(2)}%`,
        'η = (cos φ_n - μ tan λ) / (cos φ_n tan λ + μ)');

    // ========== Forces ==========
    const power_W = power * 1000;
    const T_worm = (power_W * 60) / (2 * Math.PI * speed_worm);
    const T_gear = T_worm * m_G * efficiency;

    // Worm gear forces (Section 10-10)
    const W_t_worm = (2 * T_worm) / (d_w / 1000); // Tangential on worm = Axial on gear
    const W_t_gear = (2 * T_gear) / (d_g / 1000); // Tangential on gear = Axial on worm

    // Normal force
    const W_n = W_t_gear / (Math.cos(phi_n) * Math.cos(lambda) - mu * Math.sin(lambda));

    // Radial force (separating)
    const W_r = W_n * Math.sin(phi_n);

    addTrace(14, 'Worm Torque', `${T_worm.toFixed(2)} N·m`);
    addTrace(15, 'Gear Torque', `${T_gear.toFixed(2)} N·m`);
    addTrace(16, 'Tangential Force (worm)', `${W_t_worm.toFixed(1)} N`);
    addTrace(17, 'Tangential Force (gear)', `${W_t_gear.toFixed(1)} N`);
    addTrace(18, 'Radial (Separating) Force', `${W_r.toFixed(1)} N`);

    // ========== Wear Rating (AGMA 6034-B92) ==========
    // Rated input power based on materials strength
    const K_o = getOverloadFactor(powerSource, drivenMachine);
    const s_at_gear = materialGear.s_at;
    const s_ac_gear = materialGear.s_ac;

    // Simplified bending stress on gear tooth
    const F_e = Math.min(faceWidth, 0.67 * d_w); // Effective face width
    const s_t = (W_t_gear * K_o) / (F_e * mod * 0.32); // Simplified Lewis for worm gear
    const s_t_MPa = s_t / 1000;

    // Safety factors
    const SF_bending = s_at_gear / Math.max(s_t_MPa, 0.001);
    const SF_wear = s_ac_gear / Math.max(s_t_MPa * 2, 0.001); // Approximate

    addTrace(19, 'Effective Face Width', `${F_e.toFixed(1)} mm`);
    addTrace(20, 'Gear Tooth Stress', `${s_t_MPa.toFixed(1)} MPa`);
    addTrace(21, 'SF Bending (gear)', SF_bending.toFixed(2));

    // ========== Thermal Analysis (Section 10-13) ==========
    // Heat generated = Power_in × (1 - η)
    const heatGenerated = power_W * (1 - efficiency); // Watts
    const powerLoss = power * (1 - efficiency); // kW

    // Temperature rise (simplified): ΔT = Q / (h × A)
    // h ≈ 10-20 W/(m²·K), A ≈ housing surface area
    const housingSurfaceArea = 0.01 * Math.pow(C / 50, 2); // m² (estimate)
    const h_conv = 12; // W/(m²·K) natural convection
    const tempRise = heatGenerated / (h_conv * housingSurfaceArea);

    addTrace(22, 'Heat Generated', `${heatGenerated.toFixed(1)} W`);
    addTrace(23, 'Power Loss', `${powerLoss.toFixed(3)} kW`);
    addTrace(24, 'Est. Temperature Rise', `${tempRise.toFixed(1)} °C`);

    // Self-locking check: worm is self-locking if λ < arctan(μ)
    const selfLocking = lambda < Math.atan(mu);

    addTrace(25, 'Self-Locking', selfLocking ? 'Yes' : 'No',
        `λ=${lambda_deg.toFixed(1)}° vs atan(μ)=${(Math.atan(mu) * 180 / Math.PI).toFixed(1)}°`);

    return {
        inputs: {
            power, speed_worm, gearRatio: m_G, numThreadsWorm: N_w,
            module: mod, faceWidth, pressureAngle,
            materialWorm: materialWorm.name, materialGear: materialGear.name
        },
        geometry: {
            N_w, N_g, m_G, mod, p, L,
            d_w, d_g, C, F_e,
            lambda_deg,
            speed_gear
        },
        forces: {
            T_worm, T_gear,
            W_t_worm, W_t_gear, W_r, W_n,
            V_s, V_s_ftmin
        },
        factors: { K_o, mu },
        stresses: {
            s_t_gear: s_t_MPa,
            s_at_gear, s_ac_gear
        },
        safetyFactors: {
            bending_gear: SF_bending,
            wear_gear: SF_wear,
            min_bending: SF_bending,
            min_contact: SF_wear,
            bending_pass: SF_bending >= 1.0,
            contact_pass: SF_wear >= 1.0,
            overall_pass: SF_bending >= 1.0 && SF_wear >= 1.0
        },
        performance: {
            efficiency,
            powerLoss,
            heatGenerated,
            tempRise,
            selfLocking
        },
        trace
    };
}

export default { designWormGear };
