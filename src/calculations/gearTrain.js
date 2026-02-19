/**
 * GearOptix Gear Train Analysis
 * Source: "Machine Elements in Mechanical Design" 6th Ed, Chapter 8 (Sections 8-13, 8-14)
 * Covers simple, compound, reverted, and epicyclic (planetary) gear trains
 */

/**
 * Simple gear train: velocity ratio = product of driven/driver teeth
 */
export function analyzeSimpleTrain(stages) {
    // stages: [{ N_driver, N_driven, type }]
    let overallRatio = 1;
    let overallEfficiency = 1;
    const stageResults = [];

    for (let i = 0; i < stages.length; i++) {
        const { N_driver, N_driven, efficiency = 0.98 } = stages[i];
        const ratio = N_driven / N_driver;
        overallRatio *= ratio;
        overallEfficiency *= efficiency;

        stageResults.push({
            stage: i + 1,
            N_driver, N_driven,
            ratio: ratio.toFixed(4),
            efficiency: (efficiency * 100).toFixed(2) + '%'
        });
    }

    // Direction: even number of external meshes = same direction
    const numExternalMeshes = stages.filter(s => !s.internal).length;
    const outputSameDirection = numExternalMeshes % 2 === 0;

    return {
        overallRatio,
        overallEfficiency,
        stageResults,
        outputSameDirection,
        description: `${stages.length}-stage gear train, ratio = ${overallRatio.toFixed(4)}`
    };
}

/**
 * Compound gear train: multiple gears on same shaft
 * Eq 8-27: TV = (N_A × N_C × N_E ...) / (N_B × N_D × N_F ...)
 * where odd = drivers, even = driven
 */
export function analyzeCompoundTrain(shafts) {
    // shafts: [{ gears: [{ teeth, role: 'driver'|'driven' }] }]
    let driverProduct = 1;
    let drivenProduct = 1;
    let efficiency = 1;

    const meshes = [];
    for (let i = 0; i < shafts.length; i++) {
        for (const gear of shafts[i].gears) {
            if (gear.role === 'driver') driverProduct *= gear.teeth;
            else drivenProduct *= gear.teeth;
        }
        if (i < shafts.length - 1) efficiency *= 0.98; // Per mesh
    }

    const overallRatio = drivenProduct / driverProduct;

    return {
        overallRatio,
        driverProduct,
        drivenProduct,
        overallEfficiency: efficiency,
        description: `Compound train: ratio = ${overallRatio.toFixed(4)}`
    };
}

/**
 * Reverted gear train: input and output on same axis
 * Constraint: C₁ = C₂ (center distances must be equal)
 * (N₁ + N₂) × m₁ = (N₃ + N₄) × m₂
 */
export function analyzeRevertedTrain(stage1, stage2) {
    const { N_driver: N1, N_driven: N2, module: m1 } = stage1;
    const { N_driver: N3, N_driven: N4, module: m2 } = stage2;

    const C1 = (N1 + N2) * m1 / 2;
    const C2 = (N3 + N4) * m2 / 2;

    const ratio = (N2 * N4) / (N1 * N3);
    const centerDistanceMatch = Math.abs(C1 - C2) < 0.1;

    return {
        overallRatio: ratio,
        C1, C2,
        centerDistanceMatch,
        overallEfficiency: 0.98 * 0.98,
        warning: centerDistanceMatch ? null : `Center distances don't match: C1=${C1.toFixed(2)}mm, C2=${C2.toFixed(2)}mm`
    };
}

/**
 * Epicyclic (Planetary) gear train analysis
 * Uses tabular method (Section 8-14)
 *
 * Components: Sun (S), Planet (P), Ring (R), Arm/Carrier (A)
 * Constraint: N_R = N_S + 2×N_P
 *
 * Fixed carrier: train value e = -N_S/N_R (sun→ring) or -(N_S×N_P2)/(N_P1×N_R) for compound
 * General equation: (ω_R - ω_A) / (ω_S - ω_A) = e
 */
export function analyzeEpicyclic(params) {
    const {
        N_sun, N_planet, N_ring = null,
        fixedComponent = 'ring', // 'sun', 'ring', or 'arm'
        inputSpeed = 100, // RPM of input
        inputComponent = 'sun' // which component is input
    } = params;

    // Calculate ring teeth if not provided
    const N_R = N_ring || (N_sun + 2 * N_planet);
    const N_S = N_sun;
    const N_P = N_planet;

    // Verify geometry
    const geometryValid = N_R === N_S + 2 * N_P;

    // Train value: e = -(N_S/N_R) for simple planetary
    const e = -(N_S / N_R);

    // Solve for speeds using: (ω_R - ω_A) / (ω_S - ω_A) = e
    let omega_S, omega_R, omega_A;

    if (fixedComponent === 'ring') {
        omega_R = 0;
        if (inputComponent === 'sun') {
            omega_S = inputSpeed;
            // ω_R - ω_A = e × (ω_S - ω_A)
            // 0 - ω_A = e × (ω_S - ω_A)
            // -ω_A = e × ω_S - e × ω_A
            // ω_A(e - 1) = e × ω_S
            omega_A = (e * omega_S) / (e - 1);
        } else {
            omega_A = inputSpeed;
            omega_S = omega_A + (omega_R - omega_A) / e;
        }
    } else if (fixedComponent === 'sun') {
        omega_S = 0;
        if (inputComponent === 'ring') {
            omega_R = inputSpeed;
            omega_A = omega_R / (1 - e);
        } else {
            omega_A = inputSpeed;
            omega_R = omega_A * (1 - e);
        }
    } else { // arm fixed
        omega_A = 0;
        if (inputComponent === 'sun') {
            omega_S = inputSpeed;
            omega_R = e * omega_S;
        } else {
            omega_R = inputSpeed;
            omega_S = omega_R / e;
        }
    }

    // Calculate ratio
    let ratio;
    if (fixedComponent === 'ring') {
        ratio = inputComponent === 'sun' ? omega_S / omega_A : omega_A / omega_S;
    } else if (fixedComponent === 'sun') {
        ratio = inputComponent === 'ring' ? omega_R / omega_A : omega_A / omega_R;
    } else {
        ratio = inputComponent === 'sun' ? omega_S / omega_R : omega_R / omega_S;
    }

    return {
        geometry: { N_S, N_P, N_R, geometryValid },
        trainValue: e,
        speeds: {
            sun: omega_S,
            ring: omega_R,
            arm: omega_A,
            planet: omega_A // planet orbits at arm speed + spins
        },
        ratio: Math.abs(ratio),
        fixedComponent,
        efficiency: 0.97, // Planetary typically 97%+
        description: `Planetary: N_S=${N_S}, N_P=${N_P}, N_R=${N_R}, fixed=${fixedComponent}, ratio=${Math.abs(ratio).toFixed(4)}`
    };
}

/**
 * Calculate overall efficiency for chained gear stages
 */
export function chainEfficiency(efficiencies) {
    return efficiencies.reduce((acc, eta) => acc * eta, 1.0);
}

export default {
    analyzeSimpleTrain,
    analyzeCompoundTrain,
    analyzeRevertedTrain,
    analyzeEpicyclic,
    chainEfficiency
};
