/**
 * GearOptix Shaft Design Module
 * Source: "Machine Elements in Mechanical Design" 6th Ed, Chapter 12
 * Deflection (Eq 12-6), stresses (Eq 12-5), critical speed, keys (Chapter 11)
 */

/**
 * Shaft design for a gear-carrying shaft
 * DE-Goodman criterion for combined loading (Eq 12-5)
 */
export function designShaft(params) {
    const {
        torque,           // N·m
        tangentialForce,  // N (from gear)
        radialForce,      // N (from gear)
        axialForce = 0,   // N (thrust, helical/bevel/worm)
        shaftLength,      // mm (between bearings)
        gearPosition,     // mm (from left bearing)
        material,         // shaft material object
        safetyFactor = 2.5,
        keyWidth = 0,     // mm
        keyDepth = 0      // mm
    } = params;

    const L = shaftLength;
    const a = gearPosition;
    const b = L - a;
    const E = material.E * 1000; // GPa -> MPa
    const s_y = material.s_y;
    const s_ut = material.s_ut;
    const s_e = 0.5 * s_ut; // Endurance limit estimate (Eq 5-8)

    // ========== Bearing Reactions ==========
    // Vertical plane (radial force)
    const R_Av = (radialForce * b) / L;
    const R_Bv = (radialForce * a) / L;

    // Horizontal plane (tangential force)
    const R_Ah = (tangentialForce * b) / L;
    const R_Bh = (tangentialForce * a) / L;

    // Max bending moment at gear position
    const M_v = R_Av * a; // N·mm (vertical)
    const M_h = R_Ah * a; // N·mm (horizontal)
    const M = Math.sqrt(M_v * M_v + M_h * M_h); // Resultant moment (N·mm)

    const T = torque * 1000; // N·m -> N·mm

    // ========== DE-Goodman: Minimum shaft diameter ==========
    // Eq 12-5: d³ = (16n/π) × {(1/S_e)×[4(K_f×M_a)² + 3(K_fs×T_a)²]^½ + (1/S_ut)×[4(K_f×M_m)² + 3(K_fs×T_m)²]^½}
    // For constant torque: M_a = M, M_m = 0, T_a = 0, T_m = T (fully reversed bending, steady torque)
    const K_f = 2.0;  // Fatigue stress concentration (keyway, typical, Table 12-1)
    const K_fs = 1.6; // Shear fatigue concentration

    const term1 = Math.sqrt(4 * Math.pow(K_f * M, 2)) / s_e;
    const term2 = Math.sqrt(3 * Math.pow(K_fs * T, 2)) / s_ut;

    const d_cubed = (16 * safetyFactor / Math.PI) * (term1 + term2);
    const d_min = Math.pow(d_cubed, 1 / 3); // mm

    // Round up to standard size
    const standardSizes = [10, 12, 15, 17, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100, 110, 120];
    const d_selected = standardSizes.find(s => s >= d_min) || Math.ceil(d_min / 5) * 5;

    // ========== Deflection (Eq 12-6) ==========
    // δ = (F × a² × b²) / (3 × E × I × L)
    const I = (Math.PI * Math.pow(d_selected, 4)) / 64; // mm⁴
    const totalTransverseForce = Math.sqrt(tangentialForce * tangentialForce + radialForce * radialForce);
    const deflection = (totalTransverseForce * a * a * b * b) / (3 * E * I * L); // mm

    // Slope at bearings
    const slope_A = (totalTransverseForce * a * b * (L + b)) / (6 * E * I * L); // radians
    const slope_B = (totalTransverseForce * a * b * (L + a)) / (6 * E * I * L);

    // ========== Critical Speed (Rayleigh) ==========
    // ω_cr = √(g × Σ(w_i × δ_i) / Σ(w_i × δ_i²))
    // Simplified for single mass:
    const gearMass = 2; // kg (estimate)
    const g = 9810; // mm/s²
    const criticalSpeed_rads = Math.sqrt(g / Math.max(deflection, 0.001));
    const criticalSpeed_rpm = (criticalSpeed_rads * 60) / (2 * Math.PI);

    // ========== Key Design (Chapter 11, Eq 11-2/11-3) ==========
    let keyResult = null;
    if (keyWidth > 0) {
        // Shear stress in key: τ = F / (w × L_key) ... Eq 11-2
        // Compressive stress: σ = 2F / (h × L_key) ... Eq 11-3
        const F_key = T / (d_selected / 2); // Tangential force on key (N)
        const L_key = 1.5 * d_selected; // Typical key length = 1.5D
        const tau_key = F_key / (keyWidth * L_key);
        const sigma_key = (2 * F_key) / (keyDepth * L_key);

        keyResult = {
            keyWidth, keyDepth,
            keyLength: L_key,
            shearStress: tau_key,
            compressiveStress: sigma_key,
            shearSF: (0.577 * s_y) / tau_key,
            compressiveSF: s_y / sigma_key
        };
    }

    // ========== Von Mises Stress Check ==========
    const sigma_bending = (32 * M) / (Math.PI * Math.pow(d_selected, 3));
    const tau_torsion = (16 * T) / (Math.PI * Math.pow(d_selected, 3));
    const vonMises = Math.sqrt(sigma_bending * sigma_bending + 3 * tau_torsion * tau_torsion);
    const actualSF = s_y / vonMises;

    return {
        geometry: {
            d_min: d_min.toFixed(2),
            d_selected,
            shaftLength: L,
            gearPosition: a
        },
        reactions: {
            R_Av: R_Av.toFixed(1),
            R_Bv: R_Bv.toFixed(1),
            R_Ah: R_Ah.toFixed(1),
            R_Bh: R_Bh.toFixed(1)
        },
        moments: {
            M_v: M_v.toFixed(1),
            M_h: M_h.toFixed(1),
            M_resultant: M.toFixed(1),
            T: T.toFixed(1)
        },
        stresses: {
            sigma_bending: sigma_bending.toFixed(1),
            tau_torsion: tau_torsion.toFixed(1),
            vonMises: vonMises.toFixed(1),
            s_y, s_ut, s_e: s_e.toFixed(1)
        },
        safetyFactor: actualSF.toFixed(2),
        safetyPass: actualSF >= safetyFactor,
        deflection: {
            maxDeflection: deflection.toFixed(4),
            slope_A: (slope_A * 1000).toFixed(4), // mrad
            slope_B: (slope_B * 1000).toFixed(4),
            deflectionLimit: (0.0005 * L).toFixed(4), // typical limit: 0.0005L
            deflectionPass: deflection < 0.0005 * L
        },
        criticalSpeed: {
            rpm: criticalSpeed_rpm.toFixed(0),
            margin: ((criticalSpeed_rpm / Math.max(params.operatingSpeed || 1000, 1)) * 100).toFixed(1) + '%'
        },
        key: keyResult
    };
}

export default { designShaft };
