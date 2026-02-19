/**
 * GearOptix Unit Conversion Module
 * SI ↔ Imperial converters per book Section 1-9
 */

export const conversions = {
    // Power
    kW_to_HP: (kW) => kW * 1.34102,
    HP_to_kW: (hp) => hp * 0.7457,

    // Torque
    Nm_to_lbft: (nm) => nm * 0.7376,
    lbft_to_Nm: (lbft) => lbft * 1.3558,
    Nm_to_lbin: (nm) => nm * 8.8507,
    lbin_to_Nm: (lbin) => lbin * 0.1130,

    // Length
    mm_to_in: (mm) => mm / 25.4,
    in_to_mm: (inch) => inch * 25.4,
    m_to_ft: (m) => m * 3.28084,
    ft_to_m: (ft) => ft * 0.3048,

    // Stress/Pressure
    MPa_to_psi: (mpa) => mpa * 145.038,
    psi_to_MPa: (psi) => psi * 0.006895,
    MPa_to_ksi: (mpa) => mpa * 0.145038,
    ksi_to_MPa: (ksi) => ksi * 6.895,

    // Force
    N_to_lb: (n) => n * 0.2248,
    lb_to_N: (lb) => lb * 4.4482,
    N_to_kgf: (n) => n * 0.10197,
    kgf_to_N: (kgf) => kgf * 9.8066,

    // Velocity
    ms_to_ftmin: (ms) => ms * 196.85,
    ftmin_to_ms: (ftmin) => ftmin / 196.85,

    // Temperature
    C_to_F: (c) => c * 9 / 5 + 32,
    F_to_C: (f) => (f - 32) * 5 / 9,

    // Module ↔ Diametral Pitch
    module_to_Pd: (m) => 25.4 / m,
    Pd_to_module: (pd) => 25.4 / pd,

    // Mass
    kg_to_lb: (kg) => kg * 2.20462,
    lb_to_kg: (lb) => lb * 0.45359,

    // Density
    kgm3_to_lbin3: (d) => d * 3.6127e-5,
    lbin3_to_kgm3: (d) => d / 3.6127e-5,

    // Area
    mm2_to_in2: (mm2) => mm2 / 645.16,
    in2_to_mm2: (in2) => in2 * 645.16,

    // Volume
    mm3_to_in3: (mm3) => mm3 / 16387.064,
    in3_to_mm3: (in3) => in3 * 16387.064,

    // Moment of inertia
    mm4_to_in4: (mm4) => mm4 / 416231.426,
    in4_to_mm4: (in4) => in4 * 416231.426,

    // Angular
    rpm_to_rads: (rpm) => rpm * Math.PI / 30,
    rads_to_rpm: (rads) => rads * 30 / Math.PI,
    deg_to_rad: (deg) => deg * Math.PI / 180,
    rad_to_deg: (rad) => rad * 180 / Math.PI
};

/**
 * Convert a value between unit systems
 * @param {number} value - Value to convert
 * @param {string} from - Source unit
 * @param {string} to - Target unit
 * @returns {number} Converted value
 */
export function convert(value, from, to) {
    const key = `${from}_to_${to}`;
    if (conversions[key]) return conversions[key](value);

    // Try reverse
    const reverseKey = `${to}_to_${from}`;
    if (conversions[reverseKey]) {
        // Inverse function - use Newton's method approx
        // For linear conversions, just invert
        const testVal = conversions[reverseKey](1);
        return value / testVal;
    }

    console.warn(`No conversion found for ${from} to ${to}`);
    return value;
}

/**
 * Format a number with appropriate precision
 */
export function formatValue(value, decimals = 2) {
    if (typeof value !== 'number' || isNaN(value)) return '—';
    if (!isFinite(value)) return '∞';
    if (Math.abs(value) >= 1e6) return value.toExponential(decimals);
    if (Math.abs(value) < 0.01 && value !== 0) return value.toExponential(decimals);
    return value.toFixed(decimals);
}

export default { conversions, convert, formatValue };
