/**
 * GearOptix Digital Twin Engine
 * Simulated IoT sensor data, fatigue damage accumulation, RUL prediction
 * Source: "Machine Elements in Mechanical Design" Section 5-6 (Miner's Rule)
 */

/**
 * Create and run a digital twin simulation
 */
export function runDigitalTwin(params) {
    const {
        power = 2.237, speed_pinion = 1750, gearRatio = 3.78,
        efficiency = 0.97,
        safetyFactorBending = 2.0, safetyFactorContact = 1.5,
        designLife = 1e7, // cycles
        operatingHours = 8760, // hours to simulate (1 year)
        ambientTemp = 25,
        startDamage = 0, // initial fatigue damage [0,1]
    } = params;

    const meshFreq = speed_pinion * 18 / 60; // approximate mesh freq
    const cyclesPerHour = speed_pinion * 60;
    const totalCycles = operatingHours * cyclesPerHour;

    // ========== 1. Simulated Sensor Data ==========
    const sensorData = [];
    const healthHistory = [];
    const anomalies = [];
    const hourStep = Math.max(1, Math.floor(operatingHours / 500));

    let cumulativeDamage = startDamage;
    let healthScore = 100;

    for (let hour = 0; hour <= operatingHours; hour += hourStep) {
        const progress = hour / operatingHours;
        const cyclesSoFar = hour * cyclesPerHour;

        // Simulate load variations (random walk with drift)
        const loadFactor = 0.85 + 0.3 * (Math.sin(hour * 0.01) * 0.5 + 0.5) + (Math.random() - 0.5) * 0.1;
        const speedVar = speed_pinion * (0.95 + 0.1 * Math.sin(hour * 0.005) + (Math.random() - 0.5) * 0.02);

        // Temperature model (depends on load + degradation)
        const baseTemp = ambientTemp + (power * (1 - efficiency) * 1000) / (10 * 0.15) * 0.3;
        const degradationTemp = cumulativeDamage * 15; // Degradation increases temp
        const temp = baseTemp + degradationTemp + (Math.random() - 0.5) * 3 * loadFactor;

        // Vibration model (increases with wear)
        const baseVib = 0.5 + 0.3 * loadFactor;
        const wearVib = cumulativeDamage * 5; // Wear increases vibration
        const vibration = baseVib + wearVib + (Math.random() - 0.5) * 0.2;

        // Torque
        const torque = (power * 1000 * 60) / (2 * Math.PI * speedVar) * loadFactor;

        // Oil condition (degrades over time)
        const oilCondition = Math.max(0, 100 - (hour / operatingHours) * 30 - cumulativeDamage * 20);

        // ========== 2. Fatigue Damage Accumulation (Miner's Rule) ==========
        // D = Σ(n_i / N_i) where n_i is cycles at load_i, N_i is endurance at load_i
        const stressFactor = loadFactor ** 3; // S-N curve exponent
        const N_i = designLife / stressFactor; // Endurance at this load
        const n_i = hourStep * cyclesPerHour;
        const damageIncrement = n_i / N_i;
        cumulativeDamage = Math.min(1.0, cumulativeDamage + damageIncrement);

        // ========== 3. Health Score ==========
        healthScore = Math.max(0, 100 * (1 - cumulativeDamage));

        // ========== 4. Anomaly Detection ==========
        const vibThreshold = 2.5 + wearVib * 0.5;
        const tempThreshold = baseTemp + 20;
        let anomalyDetected = false;
        let anomalyType = '';

        if (vibration > vibThreshold) {
            anomalyType = 'High Vibration';
            anomalyDetected = true;
        }
        if (temp > tempThreshold) {
            anomalyType = anomalyType ? anomalyType + ' + Overheating' : 'Overheating';
            anomalyDetected = true;
        }
        if (oilCondition < 30) {
            anomalyType = anomalyType ? anomalyType + ' + Oil Degraded' : 'Oil Degraded';
            anomalyDetected = true;
        }

        if (anomalyDetected && anomalies.length < 50) {
            anomalies.push({
                hour,
                type: anomalyType,
                severity: vibration > vibThreshold * 1.5 || temp > tempThreshold + 10 ? 'CRITICAL' :
                    vibration > vibThreshold * 1.2 ? 'WARNING' : 'INFO',
                vibration: vibration.toFixed(2),
                temperature: temp.toFixed(1),
            });
        }

        sensorData.push({
            hour,
            speed: speedVar,
            torque,
            temperature: temp,
            vibration,
            loadFactor,
            oilCondition,
        });

        healthHistory.push({
            hour,
            health: healthScore,
            damage: cumulativeDamage,
            vibration,
            temperature: temp,
        });
    }

    // ========== 5. Remaining Useful Life (RUL) ==========
    const remainingDamage = 1.0 - cumulativeDamage;
    const avgDamageRate = cumulativeDamage / operatingHours;
    const rulHours = avgDamageRate > 0 ? remainingDamage / avgDamageRate : Infinity;
    const rulCycles = rulHours * cyclesPerHour;
    const rulConfidence = cumulativeDamage < 0.3 ? 0.6 : cumulativeDamage < 0.7 ? 0.8 : 0.9;

    // ========== 6. Wear Prediction (Archard's Law) ==========
    // V_wear = K × F_n × s / H
    const K_archard = 1e-16; // Wear coefficient (m²/N) for lubricated steel
    const F_normal = (power * 1000) / (speed_pinion * Math.PI / 30 * (18 * 0.002 / 2));
    const slidingDist = operatingHours * 3600 * speed_pinion * Math.PI / 30 * 0.001;
    const wearVolume = K_archard * F_normal * slidingDist / 3e9; // m³
    const wearDepth = wearVolume / (Math.PI * 0.018 * 0.013) * 1e6; // µm

    // ========== 7. Maintenance Schedule ==========
    const maintenanceSchedule = [
        { interval: 500, task: 'Oil Level Check', status: operatingHours > 500 ? 'Due' : 'Pending' },
        { interval: 2000, task: 'Oil Analysis', status: operatingHours > 2000 ? 'Due' : 'Pending' },
        { interval: 4000, task: 'Vibration Survey', status: operatingHours > 4000 ? 'Due' : 'Pending' },
        { interval: 8000, task: 'Oil Change', status: operatingHours > 8000 ? 'Due' : 'Pending' },
        { interval: Math.round(rulHours * 0.7), task: 'Gear Inspection', status: 'Predictive' },
        { interval: Math.round(rulHours * 0.9), task: 'Planned Replacement', status: 'Predictive' },
    ];

    // Current status
    const latestSensor = sensorData[sensorData.length - 1] || {};

    return {
        currentStatus: {
            speed: latestSensor.speed || speed_pinion,
            torque: latestSensor.torque || 0,
            temperature: latestSensor.temperature || ambientTemp,
            vibration: latestSensor.vibration || 0,
            oilCondition: latestSensor.oilCondition || 100,
            healthScore,
            cumulativeDamage,
        },
        rul: {
            hours: rulHours,
            cycles: rulCycles,
            confidence: rulConfidence,
            damageRate: avgDamageRate,
        },
        wear: {
            volume_mm3: wearVolume * 1e9,
            depth_um: wearDepth,
        },
        sensorData,
        healthHistory,
        anomalies,
        maintenanceSchedule,
    };
}

export default { runDigitalTwin };
