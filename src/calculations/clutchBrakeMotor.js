/**
 * GearOptix Clutch, Brake & Motor Analysis
 * Source: "Machine Elements in Mechanical Design" Chapters 21, 22
 * Equations 22-5 (clutch torque), motor torque-speed curves
 */

/**
 * Electric motor analysis and selection
 */
export function analyzeMotor(params) {
    const {
        requiredPower = 2.237, // kW
        requiredSpeed = 1750, // RPM
        requiredTorque = 12.2, // N·m
        motorType = 'AC_induction', // AC_induction | BLDC | servo
        voltage = 230, // V
        frequency = 60, // Hz
        poles = 4,
    } = params;

    const syncSpeed = (120 * frequency) / poles;
    const slip = motorType === 'AC_induction' ? 0.03 + 0.02 * Math.random() : 0;
    const ratedSpeed = syncSpeed * (1 - slip);

    // Motor database (sized up from requirement)
    const motorSizes = [0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3.0, 4.0, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75];
    const selectedPower = motorSizes.find(p => p >= requiredPower * 1.15) || motorSizes[motorSizes.length - 1];
    const ratedTorque = (selectedPower * 1000 * 60) / (2 * Math.PI * ratedSpeed);

    // Torque-speed curve generation
    const torqueSpeedCurve = [];
    const T_rated = ratedTorque;
    const T_breakdown = T_rated * 2.5;
    const T_starting = T_rated * 1.5;

    for (let speedPct = 0; speedPct <= 1.05; speedPct += 0.01) {
        const speed = speedPct * syncSpeed;
        let torque;

        if (motorType === 'AC_induction') {
            const s = Math.max(0.001, 1 - speedPct);
            const s_bd = 0.08;
            torque = (2 * T_breakdown * (s / s_bd)) / (1 + (s / s_bd) ** 2);
        } else if (motorType === 'BLDC') {
            torque = speed < ratedSpeed ? T_rated : T_rated * ratedSpeed / Math.max(speed, 1);
        } else {
            torque = T_rated * (1 - 0.3 * (speed / syncSpeed - 0.5) ** 2);
        }
        torqueSpeedCurve.push({ speed, torque: Math.max(0, torque) });
    }

    // Efficiency map (simplified)
    const efficiencyMap = [];
    for (let loadPct = 0.1; loadPct <= 1.2; loadPct += 0.05) {
        const load = loadPct * selectedPower;
        const eff = motorType === 'BLDC' ? 0.92 - 0.1 * (1 - loadPct) ** 2 :
            0.88 - 0.15 * (1 - loadPct) ** 2 - 0.02 * Math.max(0, loadPct - 1);
        efficiencyMap.push({ loadPercent: loadPct * 100, efficiency: Math.max(0.5, Math.min(0.96, eff)) });
    }

    // Thermal derating
    const ambientTemp = 40;
    const maxTemp = 155; // Class F insulation
    const thermalMargin = maxTemp - ambientTemp - (selectedPower * (1 - 0.88) * 1000) / 15;

    return {
        selected: {
            power: selectedPower,
            ratedSpeed,
            ratedTorque,
            syncSpeed,
            slip,
            voltage,
            type: motorType,
        },
        torqueSpeedCurve,
        efficiencyMap,
        operatingPoint: {
            speed: requiredSpeed,
            torque: requiredTorque,
            loadPercent: (requiredPower / selectedPower) * 100,
            withinCapability: requiredTorque <= T_breakdown,
        },
        thermal: {
            maxTemp,
            ambientTemp,
            thermalMargin,
            deratingRequired: thermalMargin < 10,
        },
        startingPerformance: {
            startingTorque: T_starting,
            breakdownTorque: T_breakdown,
            startingToRated: T_starting / T_rated,
            breakdownToRated: T_breakdown / T_rated,
        },
    };
}

/**
 * Clutch design and analysis (Chapter 22)
 */
export function analyzeClutch(params) {
    const {
        torqueCapacity = 50, // N·m required
        clutchType = 'single_plate', // single_plate | multi_plate | cone
        numSurfaces = 2,
        outerRadius = 0.1, // m
        innerRadius = 0.06, // m
        frictionCoeff = 0.35,
        pressureMax = 1e6, // Pa
        inputInertia = 0.01, // kg·m²
        outputInertia = 0.05,
        inputSpeed = 1750, // RPM
    } = params;

    const omega_i = (2 * Math.PI * inputSpeed) / 60;

    // Uniform wear theory (Eq 22-5)
    const R_o = outerRadius;
    const R_i = innerRadius;
    const p_max = pressureMax;

    // T = n × π × μ × p_max × R_i × (R_o² - R_i²) / 2
    const T_capacity = numSurfaces * Math.PI * frictionCoeff * p_max * R_i * (R_o ** 2 - R_i ** 2) / 2;

    // Required actuating force
    const F_actuating = 2 * Math.PI * p_max * R_i * (R_o - R_i);

    // Average friction radius
    const R_f = (2 / 3) * (R_o ** 3 - R_i ** 3) / (R_o ** 2 - R_i ** 2);

    // Engagement dynamics
    const J_eq = (inputInertia * outputInertia) / (inputInertia + outputInertia);
    const engagementTime = (J_eq * omega_i) / T_capacity;
    const angularImpulse = J_eq * omega_i;

    // Energy absorbed during engagement
    const energyAbsorbed = 0.5 * J_eq * omega_i ** 2;
    const avgPower = energyAbsorbed / engagementTime;

    // Temperature rise (single engagement)
    const contactArea = Math.PI * (R_o ** 2 - R_i ** 2) * numSurfaces;
    const mass = contactArea * 0.003 * 7800; // 3mm thick steel disc
    const specificHeat = 500; // J/(kg·K)
    const tempRise = energyAbsorbed / (mass * specificHeat);

    // Engagement simulation
    const engagementProfile = [];
    const dt = engagementTime / 100;
    let w_in = omega_i, w_out = 0;
    for (let t = 0; t <= engagementTime * 1.2; t += dt) {
        const slipping = w_in > w_out * 1.001;
        const T_friction = slipping ? T_capacity : 0;

        engagementProfile.push({
            time: t * 1000, // ms
            speedInput: w_in * 30 / Math.PI,
            speedOutput: w_out * 30 / Math.PI,
            torque: T_friction,
            slipping,
        });

        if (slipping) {
            w_in -= (T_friction / inputInertia) * dt;
            w_out += (T_friction / outputInertia) * dt;
        }
    }

    // Wear life estimation
    const pvValue = p_max * omega_i * R_f; // Pa·m/s
    const maxPV = 10e6; // Typical limit for sintered materials
    const wearFactor = pvValue / maxPV;

    return {
        design: {
            type: clutchType,
            numSurfaces,
            outerRadius: R_o * 1000, innerRadius: R_i * 1000,
            frictionCoeff,
            frictionRadius: R_f * 1000,
        },
        capacity: {
            torque: T_capacity,
            requiredTorque: torqueCapacity,
            safetyFactor: T_capacity / torqueCapacity,
            adequate: T_capacity >= torqueCapacity,
        },
        actuation: {
            force: F_actuating,
            pressure: p_max / 1e6, // MPa
        },
        engagement: {
            time: engagementTime * 1000, // ms
            energy: energyAbsorbed,
            avgPower,
            tempRise,
        },
        engagementProfile,
        wear: { pvValue, maxPV, wearFactor, adequate: wearFactor < 1 },
    };
}

/**
 * Brake design and analysis (Chapter 22)
 */
export function analyzeBrake(params) {
    const {
        brakeType = 'disc', // disc | band | drum
        brakingTorque = 50, // N·m required
        discRadius = 0.12, // m
        padArea = 0.003, // m²
        frictionCoeff = 0.35,
        inputSpeed = 500, // RPM
        rotatingInertia = 0.1, // kg·m²
        mass = 500, // kg (for stopping distance)
        initialVelocity = 5, // m/s (for stopping distance)
    } = params;

    const omega = (2 * Math.PI * inputSpeed) / 60;

    // Braking force required
    const F_brake = brakingTorque / discRadius;
    const normalForce = F_brake / frictionCoeff;
    const padPressure = normalForce / padArea;

    // Stopping time
    const alpha = brakingTorque / rotatingInertia; // rad/s²
    const stoppingTime = omega / alpha;

    // Stopping distance (linear motion)
    const deceleration = brakingTorque / (mass * discRadius);
    const stoppingDistance = (initialVelocity ** 2) / (2 * deceleration);

    // Energy absorbed
    const kineticEnergy = 0.5 * rotatingInertia * omega ** 2;
    const linearKE = 0.5 * mass * initialVelocity ** 2;
    const totalEnergy = kineticEnergy + linearKE;

    // Temperature rise
    const brakeMass = 2.5; // kg (estimated disc mass)
    const specificHeat = 500;
    const tempRise = totalEnergy / (brakeMass * specificHeat);

    // Thermal fade check
    const maxTemp = 400; // °C for organic pads
    const operatingTemp = 25 + tempRise;
    const thermalFade = operatingTemp > maxTemp * 0.7;
    const fadeCoeff = thermalFade ? frictionCoeff * (1 - 0.3 * (operatingTemp - maxTemp * 0.7) / (maxTemp * 0.3)) : frictionCoeff;

    // Braking curve
    const brakingCurve = [];
    let w = omega;
    const dtBrake = stoppingTime / 100;
    for (let t = 0; w > 0; t += dtBrake) {
        brakingCurve.push({
            time: t * 1000, // ms
            speed: w * 30 / Math.PI, // RPM
            torque: brakingTorque,
            temperature: 25 + tempRise * (1 - w / omega),
        });
        w = Math.max(0, w - alpha * dtBrake);
    }

    return {
        design: {
            type: brakeType,
            discRadius: discRadius * 1000,
            padArea: padArea * 1e6, // mm²
            frictionCoeff,
            normalForce,
            padPressure: padPressure / 1e6, // MPa
        },
        performance: {
            brakingTorque,
            stoppingTime: stoppingTime * 1000, // ms
            stoppingDistance: stoppingDistance * 1000, // mm
            energyAbsorbed: totalEnergy,
        },
        thermal: {
            tempRise,
            operatingTemp,
            maxTemp,
            thermalFade,
            fadeCoeff,
        },
        brakingCurve,
    };
}

export default { analyzeMotor, analyzeClutch, analyzeBrake };
