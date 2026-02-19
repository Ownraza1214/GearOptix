/**
 * GearOptix AGMA Factor Tables & Calculation Functions
 * Source: "Machine Elements in Mechanical Design" 6th Ed, Chapter 9
 * AGMA 2001-D04 for Spur/Helical Gears
 */

// =============== Overload Factor K_o (Table 9-1) ===============
export const OVERLOAD_TABLE = {
    // [Power Source][Driven Machine]
    uniform: {
        uniform: 1.00,
        moderate_shock: 1.25,
        heavy_shock: 1.75
    },
    light_shock: {
        uniform: 1.25,
        moderate_shock: 1.50,
        heavy_shock: 2.00
    },
    medium_shock: {
        uniform: 1.50,
        moderate_shock: 1.75,
        heavy_shock: 2.25
    }
};

export function getOverloadFactor(powerSource = 'uniform', drivenMachine = 'uniform') {
    return OVERLOAD_TABLE[powerSource]?.[drivenMachine] || 1.0;
}

// =============== Dynamic Factor K_v (Fig 9-16, AGMA 2001) ===============
/**
 * K_v = ((A + √(200V)) / A)^B  for Imperial (V in ft/min)
 * where A = 50 + 56(1 - B),  B = 0.25(12 - Qv)^(2/3)
 * Qv = AGMA Quality Number (6-12)
 */
export function getDynamicFactor(pitchLineVelocity, qualityNumber = 8) {
    const Qv = Math.min(Math.max(qualityNumber, 5), 12);
    const B = 0.25 * Math.pow(12 - Qv, 2 / 3);
    const A = 50 + 56 * (1 - B);
    const V = Math.abs(pitchLineVelocity); // ft/min

    // Maximum velocity for this quality
    const Vmax = (A + (Qv - 3)) ** 2;
    const Veff = Math.min(V, Vmax);

    const Kv = Math.pow((A + Math.sqrt(200 * Veff)) / A, B);
    return Math.max(Kv, 1.0);
}

/**
 * K_v for metric (V in m/s)
 */
export function getDynamicFactorMetric(pitchLineVelocity_ms, qualityNumber = 8) {
    // Convert m/s to ft/min
    const V_ftmin = pitchLineVelocity_ms * 196.85;
    return getDynamicFactor(V_ftmin, qualityNumber);
}

// =============== Size Factor K_s (Fig 9-13, AGMA 2001) ===============
/**
 * K_s = 1.192 * (F√Y / P)^0.0535   (Eq 9-15)
 * For diametral pitch P ≥ 5, K_s ≈ 1.0
 * Conservative: K_s = 1.0 for standard pitch gears
 */
export function getSizeFactor(diametralPitch, faceWidth, lewisFormFactor) {
    if (diametralPitch >= 5) return 1.0;
    const ks = 1.192 * Math.pow((faceWidth * Math.sqrt(lewisFormFactor)) / diametralPitch, 0.0535);
    return Math.max(ks, 1.0);
}

// =============== Load Distribution Factor K_m (Fig 9-12, AGMA 2001) ===============
/**
 * K_m = C_mf = 1 + C_mc(C_pf × C_pm + C_ma × C_e)  (Eq 9-17)
 * C_mc = lead correction (1.0 uncrowned, 0.8 crowned)
 * C_pf = pinion proportion factor
 * C_pm = pinion proportion modifier
 * C_ma = mesh alignment factor
 * C_e = mesh alignment correction (0.8 adjusted, 1.0 not)
 */
export function getLoadDistributionFactor(faceWidth, pitchDiameter, options = {}) {
    const {
        crowned = false,
        straddle = true,
        adjustedAtAssembly = false,
        enclosureType = 'commercial' // 'open', 'commercial', 'precision', 'extra_precision'
    } = options;

    const F = faceWidth;
    const d = pitchDiameter;

    // C_mc: Lead correction factor
    const C_mc = crowned ? 0.8 : 1.0;

    // C_pf: Pinion proportion factor (Fig 9-12a)
    let C_pf;
    const ratio = F / (10 * d);
    if (F <= 1.0) {
        C_pf = ratio - 0.025;
    } else if (F <= 17) {
        C_pf = ratio - 0.0375 + 0.0125 * F;
    } else {
        C_pf = ratio - 0.1109 + 0.0207 * F - 0.000228 * F * F;
    }
    C_pf = Math.max(C_pf, 0.05);

    // C_pm: Pinion proportion modifier
    const S1_over_S = straddle ? 0.5 : 0.75; // Simplified
    const C_pm = S1_over_S < 0.175 ? 1.0 : 1.1;

    // C_ma: Mesh alignment factor (Fig 9-12b) - empirical coefficients
    const maCoeffs = {
        open: { A: 0.247, B: 0.0167, C: -0.765e-4 },
        commercial: { A: 0.127, B: 0.0158, C: -0.930e-4 },
        precision: { A: 0.0675, B: 0.0128, C: -0.926e-4 },
        extra_precision: { A: 0.00360, B: 0.0102, C: -0.822e-4 }
    };
    const coeff = maCoeffs[enclosureType] || maCoeffs.commercial;
    const C_ma = coeff.A + coeff.B * F + coeff.C * F * F;

    // C_e: Mesh alignment correction
    const C_e = adjustedAtAssembly ? 0.8 : 1.0;

    // Final K_m
    const K_m = 1 + C_mc * (C_pf * C_pm + C_ma * C_e);
    return Math.max(K_m, 1.0);
}

// =============== Rim Thickness Factor K_B (Fig 9-14) ===============
/**
 * K_B = 1.0 if m_B ≥ 1.2 (backup ratio = rim thickness / tooth height)
 * K_B = 1.6 ln(2.242 / m_B) if m_B < 1.2
 */
export function getRimThicknessFactor(rimThickness, toothHeight) {
    if (!rimThickness || !toothHeight || rimThickness <= 0) return 1.0;
    const m_B = rimThickness / toothHeight;
    if (m_B >= 1.2) return 1.0;
    return Math.max(1.6 * Math.log(2.242 / m_B), 1.0);
}

// =============== Geometry Factor J (Fig 9-10, Spur Gears) ===============
/**
 * J factor for spur gears at 20° pressure angle
 * Interpolated from AGMA tables, depends on N_p, N_g, and load application point
 */
const J_TABLE_20DEG = {
    // [N_pinion]: { [N_gear]: J_pinion }
    12: { 12: 0.210, 14: 0.220, 17: 0.230, 21: 0.245, 26: 0.258, 35: 0.270, 55: 0.290, 135: 0.310, 300: 0.320 },
    14: { 14: 0.235, 17: 0.250, 21: 0.264, 26: 0.277, 35: 0.290, 55: 0.308, 135: 0.327, 300: 0.336 },
    17: { 17: 0.270, 21: 0.283, 26: 0.295, 35: 0.308, 55: 0.325, 135: 0.342, 300: 0.352 },
    21: { 21: 0.296, 26: 0.308, 35: 0.320, 55: 0.337, 135: 0.355, 300: 0.365 },
    26: { 26: 0.316, 35: 0.330, 55: 0.347, 135: 0.365, 300: 0.375 },
    35: { 35: 0.340, 55: 0.358, 135: 0.377, 300: 0.387 },
    55: { 55: 0.368, 135: 0.393, 300: 0.403 },
    135: { 135: 0.400, 300: 0.415 },
    300: { 300: 0.425 }
};

export function getGeometryFactorJ(N_pinion, N_gear, pressureAngle = 20) {
    const Np = Math.max(12, N_pinion);
    const Ng = Math.max(Np, N_gear);

    // Find bracketing keys
    const keys = Object.keys(J_TABLE_20DEG).map(Number).sort((a, b) => a - b);
    let lowerNp = keys[0], upperNp = keys[keys.length - 1];
    for (let i = 0; i < keys.length - 1; i++) {
        if (Np >= keys[i] && Np <= keys[i + 1]) {
            lowerNp = keys[i]; upperNp = keys[i + 1]; break;
        }
    }
    if (Np >= keys[keys.length - 1]) { lowerNp = upperNp = keys[keys.length - 1]; }

    function interpolateNg(NpKey, NgTarget) {
        const row = J_TABLE_20DEG[NpKey];
        if (!row) return 0.32;
        const gKeys = Object.keys(row).map(Number).sort((a, b) => a - b);
        if (NgTarget <= gKeys[0]) return row[gKeys[0]];
        if (NgTarget >= gKeys[gKeys.length - 1]) return row[gKeys[gKeys.length - 1]];
        for (let i = 0; i < gKeys.length - 1; i++) {
            if (NgTarget >= gKeys[i] && NgTarget <= gKeys[i + 1]) {
                const t = (NgTarget - gKeys[i]) / (gKeys[i + 1] - gKeys[i]);
                return row[gKeys[i]] + t * (row[gKeys[i + 1]] - row[gKeys[i]]);
            }
        }
        return 0.32;
    }

    if (lowerNp === upperNp) return interpolateNg(lowerNp, Ng);
    const jLower = interpolateNg(lowerNp, Ng);
    const jUpper = interpolateNg(upperNp, Ng);
    const t = (Np - lowerNp) / (upperNp - lowerNp);
    return jLower + t * (jUpper - jLower);
}

// =============== Pitting Geometry Factor I (Fig 9-17) ===============
/**
 * I = (cos φ sin φ / 2m_N) × (m_G / (m_G + 1))   for external
 * I = (cos φ sin φ / 2m_N) × (m_G / (m_G - 1))   for internal
 * m_N = 1.0 for spur, = cos²ψ for helical
 * m_G = gear ratio = N_g / N_p
 */
export function getPittingGeometryFactor(N_pinion, N_gear, pressureAngle = 20, helixAngle = 0, isInternal = false) {
    const phi = (pressureAngle * Math.PI) / 180;
    const psi = (helixAngle * Math.PI) / 180;
    const m_N = helixAngle === 0 ? 1.0 : Math.cos(psi) * Math.cos(psi);
    const m_G = N_gear / N_pinion;

    let I;
    if (isInternal) {
        I = (Math.cos(phi) * Math.sin(phi) / (2 * m_N)) * (m_G / (m_G - 1));
    } else {
        I = (Math.cos(phi) * Math.sin(phi) / (2 * m_N)) * (m_G / (m_G + 1));
    }
    return I;
}

// =============== Elastic Coefficient C_p (Table 9-8) ===============
/**
 * C_p = √(1 / (π × ((1-ν₁²)/E₁ + (1-ν₂²)/E₂)))
 * Pre-computed for common pairs (in √psi for Imperial)
 */
export const CP_TABLE = {
    'steel-steel': 191,       // (√MPa: 191)
    'steel-cast_iron': 162,
    'steel-aluminum': 142,
    'steel-bronze': 159,
    'cast_iron-cast_iron': 149,
    'cast_iron-bronze': 141,
    'aluminum-aluminum': 119,
    'bronze-bronze': 134
};

export function getElasticCoefficient(E1, v1, E2, v2) {
    // E in MPa, returns C_p in √MPa
    const denom = Math.PI * ((1 - v1 * v1) / E1 + (1 - v2 * v2) / E2);
    return Math.sqrt(1 / denom);
}

// =============== Lewis Form Factor Y (Table 9-3) ===============
export const LEWIS_Y_TABLE_20DEG = {
    12: 0.245, 13: 0.261, 14: 0.277, 15: 0.290,
    16: 0.296, 17: 0.303, 18: 0.309, 19: 0.314,
    20: 0.322, 21: 0.328, 22: 0.331, 24: 0.337,
    25: 0.340, 26: 0.346, 28: 0.353, 30: 0.359,
    32: 0.365, 34: 0.371, 36: 0.377, 38: 0.383,
    40: 0.389, 45: 0.399, 50: 0.408, 55: 0.415,
    60: 0.421, 65: 0.425, 70: 0.429, 75: 0.433,
    80: 0.436, 90: 0.442, 100: 0.446, 150: 0.458,
    200: 0.463, 300: 0.471, 400: 0.480, 1000: 0.484
};

export function getLewisFormFactor(numTeeth, pressureAngle = 20) {
    const table = LEWIS_Y_TABLE_20DEG;
    const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
    const N = Math.max(12, numTeeth);

    if (N <= keys[0]) return table[keys[0]];
    if (N >= keys[keys.length - 1]) return table[keys[keys.length - 1]];

    for (let i = 0; i < keys.length - 1; i++) {
        if (N >= keys[i] && N <= keys[i + 1]) {
            const t = (N - keys[i]) / (keys[i + 1] - keys[i]);
            return table[keys[i]] + t * (table[keys[i + 1]] - table[keys[i]]);
        }
    }
    return 0.32;
}

// =============== Stress Cycle Life Factors Y_N, Z_N (Figs 9-21, 9-22) ===============
/**
 * Y_N = Bending strength life factor
 * Z_N = Pitting resistance life factor
 * For 10^7 cycles (standard): Y_N = Z_N = 1.0
 */
export function getBendingLifeFactor(cycles) {
    if (cycles <= 0) return 1.0;
    const logN = Math.log10(cycles);

    // From Fig 9-21: Y_N curve (approximate for Grade 1 & 2)
    if (cycles < 1e3) return 4.9404 * Math.pow(cycles, -0.1045);
    if (cycles < 1e4) return 3.517 * Math.pow(cycles, -0.0817);
    if (cycles < 3e6) return 2.3194 * Math.pow(cycles, -0.0538);
    if (cycles <= 1e7) return 1.0;
    if (cycles <= 1e10) return 1.3558 * Math.pow(cycles, -0.0178);
    return 0.9;
}

export function getPittingLifeFactor(cycles) {
    if (cycles <= 0) return 1.0;

    // From Fig 9-22: Z_N curve
    if (cycles < 1e4) return 2.466 * Math.pow(cycles, -0.056);
    if (cycles < 1e7) return 1.4488 * Math.pow(cycles, -0.023);
    if (cycles <= 1e7) return 1.0;
    if (cycles <= 1e10) return 1.4488 * Math.pow(cycles, -0.023);
    return 0.85;
}

// =============== Hardness Ratio Factor C_H (Fig 9-20) ===============
/**
 * C_H = 1.0 + A'(m_G - 1.0) for HBp/HBg ≥ 1.2
 * A' depends on HB ratio, per Fig 9-20
 */
export function getHardnessRatioFactor(HB_pinion, HB_gear) {
    const ratio = HB_pinion / HB_gear;
    if (ratio < 1.2) return 1.0;

    // A' approximation from Fig 9-20
    const Aprime = 0.00698 * ratio - 0.00274;
    return 1.0; // C_H applied to gear only, returns 1.0 for pinion
}

// =============== Reliability Factor K_R (Table 9-12) ===============
export const RELIABILITY_FACTORS = {
    0.50: 0.70,
    0.90: 0.85,
    0.99: 1.00,
    0.999: 1.25,
    0.9999: 1.50
};

export function getReliabilityFactor(reliability = 0.99) {
    const keys = Object.keys(RELIABILITY_FACTORS).map(Number).sort((a, b) => a - b);
    if (reliability <= keys[0]) return RELIABILITY_FACTORS[keys[0]];
    if (reliability >= keys[keys.length - 1]) return RELIABILITY_FACTORS[keys[keys.length - 1]];

    for (let i = 0; i < keys.length - 1; i++) {
        if (reliability >= keys[i] && reliability <= keys[i + 1]) {
            const t = (reliability - keys[i]) / (keys[i + 1] - keys[i]);
            return RELIABILITY_FACTORS[keys[i]] + t * (RELIABILITY_FACTORS[keys[i + 1]] - RELIABILITY_FACTORS[keys[i]]);
        }
    }
    return 1.0;
}

// =============== Temperature Factor K_T (AGMA 2001) ===============
export function getTemperatureFactor(tempF = 250) {
    // K_T = 1.0 for oil temp ≤ 250°F
    // K_T = (460 + T) / 710 for T > 250°F
    if (tempF <= 250) return 1.0;
    return (460 + tempF) / 710;
}

// =============== Safety Factor (AGMA) ===============
/**
 * Required allowable stress:
 * Bending: s_at_required = s_t × K_R × K_T / (Y_N)
 * Contact: s_ac_required = s_c × K_R × K_T / (Z_N × C_H)
 * Safety factors:
 * SF_bending = s_at / (s_t × K_R × K_T / Y_N)
 * SF_contact = (s_ac / (s_c × K_R × K_T / (Z_N × C_H)))²
 */

// =============== AGMA Quality Number to ISO 1328 Grade (Table 9-4) ===============
export const QUALITY_CONVERSION = {
    // AGMA_Qv: ISO_grade (approximate)
    5: 10, 6: 8, 7: 7, 8: 6, 9: 5,
    10: 4, 11: 3, 12: 2
};

export function agmaToIsoQuality(agmaQv) {
    return QUALITY_CONVERSION[agmaQv] || 6;
}

// =============== Pressure Angle Factor ===============
export const PRESSURE_ANGLES = [14.5, 20, 25];

// =============== Service Factors (AGMA Application Standards) ===============
export const SERVICE_FACTORS = {
    // Application: { duration_hours: C_SF }
    general: { 8: 1.00, 24: 1.25, continuous: 1.50 },
    automotive: { 8: 1.00, 24: 1.25, continuous: 1.50 },
    marine: { 8: 1.30, 24: 1.50, continuous: 1.75 },
    crane: { 8: 1.25, 24: 1.50, continuous: 1.75 },
    steel_mill: { 8: 1.50, 24: 1.75, continuous: 2.00 },
    mining: { 8: 1.50, 24: 1.75, continuous: 2.25 }
};

export default {
    getOverloadFactor,
    getDynamicFactor,
    getDynamicFactorMetric,
    getSizeFactor,
    getLoadDistributionFactor,
    getRimThicknessFactor,
    getGeometryFactorJ,
    getPittingGeometryFactor,
    getElasticCoefficient,
    getLewisFormFactor,
    getBendingLifeFactor,
    getPittingLifeFactor,
    getHardnessRatioFactor,
    getReliabilityFactor,
    getTemperatureFactor,
    agmaToIsoQuality,
};
