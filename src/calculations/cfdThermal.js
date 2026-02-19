/**
 * GearOptix CFD Thermal & Lubrication Analysis
 * Source: "Machine Elements in Mechanical Design" Sections 3-20, 16-5, 16-7
 * Lumped-parameter thermal network + EHL film thickness
 */

/**
 * Complete CFD thermal-lubrication simulation
 */
export function analyzeCFDThermal(params) {
    const {
        power = 2.237, // kW
        speed_pinion = 1750,
        gearRatio = 3.78,
        efficiency = 0.97,
        module: mod = 2,
        faceWidth = 13, // mm
        N_p = 18, N_g = 68,
        ambientTemp = 25, // °C
        lubricantType = 'mineral', // mineral | synthetic | PAO
        isoVGGrade = 68,
        coolingMethod = 'natural', // natural | forced_air | oil_cooler
        housingMaterial = 'cast_iron',
        housingArea = 0.15, // m² surface area
        oilVolume = 2.0, // liters
    } = params;

    const r_p = (N_p * mod) / 2000; // m
    const r_g = (N_g * mod) / 2000;
    const omega_p = (2 * Math.PI * speed_pinion) / 60;

    // ========== 1. Power Losses ==========
    const totalPowerLoss = power * (1 - efficiency) * 1000; // Watts

    // Breakdown of losses
    const meshLoss = totalPowerLoss * 0.55; // Tooth friction
    const churningLoss = calculateChurningLoss(r_g, omega_p / gearRatio, isoVGGrade, oilVolume);
    const windageLoss = calculateWindageLoss(r_p, r_g, omega_p, omega_p / gearRatio, faceWidth);
    const bearingLoss = totalPowerLoss * 0.20;
    const sealLoss = totalPowerLoss * 0.02;

    const losses = {
        mesh: meshLoss,
        churning: churningLoss,
        windage: windageLoss,
        bearing: bearingLoss,
        seal: sealLoss,
        total: meshLoss + churningLoss + windageLoss + bearingLoss + sealLoss,
    };

    // ========== 2. Lubricant Properties ==========
    const lubricant = getLubricantProperties(lubricantType, isoVGGrade);

    // ========== 3. Thermal Network ==========
    // Nodes: gear mesh, oil sump, housing inner, housing outer, ambient
    const h_conv_oil = 80; // W/(m²·K) oil to housing
    const h_conv_air = coolingMethod === 'natural' ? 10 :
        coolingMethod === 'forced_air' ? 35 : 15; // W/(m²·K)
    const h_oil_cooler = coolingMethod === 'oil_cooler' ? 500 : 0; // W/K

    const R_oil_housing = 1 / (h_conv_oil * housingArea * 0.8); // K/W
    const R_housing_air = 1 / (h_conv_air * housingArea);
    const R_cooler = h_oil_cooler > 0 ? 1 / h_oil_cooler : Infinity;

    // Steady-state temperatures
    const R_total = R_oil_housing + R_housing_air;
    const R_parallel = R_cooler < Infinity ?
        (R_total * R_cooler) / (R_total + R_cooler) : R_total;

    const T_oil_ss = ambientTemp + losses.total * R_parallel;
    const T_housing_ss = ambientTemp + losses.total * R_housing_air;
    const T_mesh_ss = T_oil_ss + 15; // Mesh flash temp above oil

    // ========== 4. Transient Thermal Simulation ==========
    const oilMass = oilVolume * 0.87; // kg (mineral oil density ~870 kg/m³)
    const cp_oil = lubricant.specificHeat; // J/(kg·K)
    const thermalCapacity = oilMass * cp_oil; // J/K

    const timeSteps = 200;
    const dt = 60; // seconds per step → 200 min simulation
    const transient = [];

    let T_oil = ambientTemp;
    let T_housing = ambientTemp;
    for (let i = 0; i <= timeSteps; i++) {
        const time_min = i * dt / 60;
        transient.push({
            time: time_min,
            T_oil: T_oil,
            T_housing: T_housing,
            T_mesh: T_oil + 15 * (1 - Math.exp(-time_min / 20)),
        });

        // Euler integration
        const Q_in = losses.total;
        const Q_out_conv = (T_oil - ambientTemp) / R_parallel;
        const dT = (Q_in - Q_out_conv) * dt / thermalCapacity;
        T_oil += dT;
        T_housing = ambientTemp + (T_oil - ambientTemp) * R_housing_air / R_total;
    }

    // ========== 5. EHL Film Thickness (Dowson-Higginson) ==========
    const V_pitch = omega_p * r_p; // m/s (entrainment velocity component)
    const V_g = (omega_p / gearRatio) * r_g;
    const U_e = (V_pitch + V_g) / 2; // Entrainment velocity

    const phi = (20 * Math.PI) / 180;
    const W_t = (power * 1000) / (omega_p * r_p); // Tangential load (N)
    const W_per_length = W_t / (faceWidth / 1000); // N/m

    // Equivalent radius at pitch point
    const R_eq = (r_p * r_g * Math.sin(phi)) / (r_p + r_g);

    const eta_0 = lubricant.viscosity40 * 1e-3; // Pa·s at 40°C
    const alpha = lubricant.pressureViscCoeff; // Pa⁻¹
    const E_star = 2.28e11; // Composite elastic modulus (steel-steel) Pa

    // Dimensionless parameters
    const U_param = (eta_0 * U_e) / (E_star * R_eq);
    const G_param = alpha * E_star;
    const W_param = W_per_length / (E_star * R_eq);

    // Dowson-Higginson (line contact)
    const h_min = 1.6 * R_eq * Math.pow(G_param, 0.6) * Math.pow(U_param, 0.7) / Math.pow(W_param, 0.13);
    const h_min_um = h_min * 1e6; // µm

    // Surface roughness composite (~0.4-0.8 µm for ground gears)
    const Ra_composite = 0.5; // µm
    const lambdaRatio = h_min_um / Ra_composite;

    let lubRegime;
    if (lambdaRatio > 3) lubRegime = 'Full Film (EHL)';
    else if (lambdaRatio > 1) lubRegime = 'Mixed Film';
    else if (lambdaRatio > 0.4) lubRegime = 'Boundary';
    else lubRegime = 'Dry Contact (DANGER)';

    // ========== 6. Cooling System Sizing ==========
    const requiredCooling = losses.total; // W
    const currentCooling = (T_oil_ss - ambientTemp) / R_parallel;
    const coolingAdequate = T_oil_ss <= lubricant.maxTemp;

    let recommendedCooling = coolingMethod;
    if (T_oil_ss > lubricant.maxTemp) {
        if (coolingMethod === 'natural') recommendedCooling = 'forced_air';
        else if (coolingMethod === 'forced_air') recommendedCooling = 'oil_cooler';
        else recommendedCooling = 'larger_oil_cooler';
    }

    // Oil cooler capacity needed
    const coolerCapacity = Math.max(0, losses.total - (lubricant.maxTemp - ambientTemp) / R_total);

    // ========== 7. Churning Loss Map ==========
    const churningMap = [];
    for (let speedPct = 0.1; speedPct <= 1.5; speedPct += 0.05) {
        const rpm = speed_pinion * speedPct;
        const w = (2 * Math.PI * rpm) / 60;
        churningMap.push({
            speed: rpm,
            loss: calculateChurningLoss(r_g, w / gearRatio, isoVGGrade, oilVolume),
        });
    }

    return {
        losses,
        lubricant,
        thermal: {
            steadyState: { T_oil: T_oil_ss, T_housing: T_housing_ss, T_mesh: T_mesh_ss },
            transient,
            thermalResistance: { R_oil_housing, R_housing_air, R_total },
        },
        ehl: {
            h_min_um,
            lambdaRatio,
            lubRegime,
            entrainmentVelocity: U_e,
            equivalentRadius: R_eq * 1000, // mm
        },
        cooling: {
            method: coolingMethod,
            adequate: coolingAdequate,
            recommended: recommendedCooling,
            requiredCapacity: requiredCooling,
            coolerCapacity,
        },
        churningMap,
    };
}

/**
 * Oil churning loss (Eq 16-5 approximation)
 */
function calculateChurningLoss(r_gear, omega_g, vgGrade, oilVolume) {
    const rho = 870; // kg/m³
    const nu = vgGrade * 1e-6; // m²/s at 40°C
    const immersionDepth = 0.02; // m (estimated)
    const C_d = 0.05; // drag coefficient
    const area = 2 * Math.PI * r_gear * immersionDepth;
    const V = omega_g * r_gear;
    return 0.5 * rho * C_d * area * V * V * V * 0.001; // Watts
}

/**
 * Windage power loss
 */
function calculateWindageLoss(r_p, r_g, omega_p, omega_g, faceWidth) {
    const rho_air = 1.2; // kg/m³
    const C_w = 0.001;
    const fw_m = faceWidth / 1000;
    const loss_p = 0.5 * rho_air * C_w * fw_m * Math.pow(r_p, 4) * Math.pow(omega_p, 3);
    const loss_g = 0.5 * rho_air * C_w * fw_m * Math.pow(r_g, 4) * Math.pow(omega_g, 3);
    return loss_p + loss_g;
}

/**
 * Lubricant properties database
 */
function getLubricantProperties(type, vgGrade) {
    const base = {
        mineral: { pressureViscCoeff: 2.2e-8, specificHeat: 1900, maxTemp: 90, thermalCond: 0.13, density: 870, name: 'Mineral Oil' },
        synthetic: { pressureViscCoeff: 1.5e-8, specificHeat: 2050, maxTemp: 120, thermalCond: 0.15, density: 850, name: 'Synthetic PAG' },
        PAO: { pressureViscCoeff: 1.8e-8, specificHeat: 2100, maxTemp: 130, thermalCond: 0.14, density: 840, name: 'PAO Synthetic' },
    };
    const props = base[type] || base.mineral;
    return {
        ...props,
        isoVG: vgGrade,
        viscosity40: vgGrade, // cSt at 40°C (ISO VG = kinematic viscosity at 40°C)
        viscosity100: vgGrade * 0.15, // Approximate
        viscosityIndex: type === 'mineral' ? 95 : 140,
    };
}

export default { analyzeCFDThermal };
