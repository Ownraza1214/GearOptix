/**
 * GearOptix Manufacturing Process Simulation
 * Source: "Machine Elements in Mechanical Design" Section 8-11, 18-9
 * Process selection, heat treatment, shot peening, cost estimation
 */

/**
 * Complete manufacturing analysis
 */
export function analyzeManufacturing(params) {
    const {
        gearType = 'spur',
        module: mod = 2,
        numTeethPinion = 18, numTeethGear = 68,
        faceWidth = 13, // mm
        material = 'AISI 4140',
        hardness = 300, // HB
        qualityGrade = 8, // AGMA quality
        quantity = 100,
        requiredSurfaceFinish = 0.8, // µm Ra
    } = params;

    // ========== 1. Process Selection & Feasibility ==========
    const processes = evaluateProcesses(gearType, mod, numTeethGear, qualityGrade, requiredSurfaceFinish, hardness);

    // ========== 2. Heat Treatment Simulation ==========
    const heatTreatment = simulateHeatTreatment(material, hardness, mod);

    // ========== 3. Shot Peening (Section 18-9) ==========
    const shotPeening = analyzesShotPeening(mod, faceWidth, material);

    // ========== 4. Tolerance Analysis (ISO 1328) ==========
    const tolerances = calculateTolerances(mod, numTeethPinion, numTeethGear, qualityGrade);

    // ========== 5. Cost Estimation ==========
    const costs = estimateCosts(gearType, mod, numTeethPinion, numTeethGear, faceWidth, material, quantity, qualityGrade, processes[0]);

    // ========== 6. DFM Scoring ==========
    const dfm = assessDFM(gearType, mod, numTeethPinion, numTeethGear, faceWidth, qualityGrade, material, hardness);

    // ========== 7. Gear Blank Weight ==========
    const r_outer_p = ((numTeethPinion + 2) * mod) / 2; // mm
    const r_outer_g = ((numTeethGear + 2) * mod) / 2;
    const volume_p = Math.PI * (r_outer_p / 1000) ** 2 * (faceWidth / 1000); // m³
    const volume_g = Math.PI * (r_outer_g / 1000) ** 2 * (faceWidth / 1000);
    const density = 7850; // kg/m³ steel
    const rawWeight_p = volume_p * density * 1.3; // 30% extra for blank
    const rawWeight_g = volume_g * density * 1.3;

    return {
        recommendedProcess: processes[0],
        allProcesses: processes,
        heatTreatment,
        shotPeening,
        tolerances,
        costs,
        dfm,
        blankWeight: {
            pinion: rawWeight_p * 1000, // grams
            gear: rawWeight_g * 1000,
            total: (rawWeight_p + rawWeight_g) * 1000,
        },
    };
}

function evaluateProcesses(gearType, mod, numTeeth, quality, surfaceFinish, hardness) {
    const processes = [
        {
            name: 'Hobbing',
            feasible: mod >= 0.5 && mod <= 25 && gearType !== 'worm',
            quality: 7, surfaceFinish: 1.6, maxHardness: 350,
            speed: 'fast', cost: 'low',
            description: 'CNC gear hobbing on dedicated hobbing machine',
            cycleTime: 2 + numTeeth * 0.05, // minutes
        },
        {
            name: 'Gear Shaping',
            feasible: gearType !== 'worm',
            quality: 6, surfaceFinish: 1.2, maxHardness: 350,
            speed: 'medium', cost: 'medium',
            description: 'Reciprocating gear shaping with pinion cutter',
            cycleTime: 5 + numTeeth * 0.1,
        },
        {
            name: 'Gear Grinding',
            feasible: quality <= 5 || surfaceFinish < 0.8,
            quality: 3, surfaceFinish: 0.2, maxHardness: 65, // HRC
            speed: 'slow', cost: 'high',
            description: 'Form or generating grinding for precision finish',
            cycleTime: 10 + numTeeth * 0.2,
        },
        {
            name: 'Gear Skiving',
            feasible: mod <= 5 && gearType !== 'bevel',
            quality: 5, surfaceFinish: 0.8, maxHardness: 400,
            speed: 'fast', cost: 'medium',
            description: 'Power skiving on multi-axis CNC',
            cycleTime: 1.5 + numTeeth * 0.04,
        },
        {
            name: 'Wire EDM',
            feasible: mod >= 0.3 && numTeeth < 30,
            quality: 5, surfaceFinish: 0.4, maxHardness: 70,
            speed: 'very_slow', cost: 'high',
            description: 'Wire EDM for prototype/hardened gears',
            cycleTime: 30 + numTeeth * 1.5,
        },
        {
            name: '3D Printing (SLM)',
            feasible: mod >= 1 && mod <= 5,
            quality: 8, surfaceFinish: 6.0, maxHardness: 350,
            speed: 'slow', cost: 'high',
            description: 'Selective Laser Melting — requires post-machining',
            cycleTime: 60 + numTeeth * 2,
            postProcess: 'Requires HIP + finish machining',
        },
    ];

    // Score each process
    return processes
        .filter(p => p.feasible)
        .map(p => ({
            ...p,
            qualityPass: p.quality <= quality,
            finishPass: p.surfaceFinish <= surfaceFinish || p.name === 'Gear Grinding',
            hardnessPass: hardness <= p.maxHardness || p.name.includes('Grinding') || p.name.includes('EDM'),
            score: (p.qualityPass !== false ? 25 : 0) + (p.finishPass !== false ? 25 : 0) +
                (p.cost === 'low' ? 30 : p.cost === 'medium' ? 20 : 10) +
                (p.speed === 'fast' ? 20 : p.speed === 'medium' ? 15 : 5),
        }))
        .sort((a, b) => b.score - a.score);
}

function simulateHeatTreatment(material, hardness, mod) {
    const isCarburizing = hardness > 350 || material.includes('8620') || material.includes('9310');
    const profile = [];
    const totalTime = isCarburizing ? 480 : 180; // minutes

    if (isCarburizing) {
        // Carburizing cycle
        const stages = [
            { name: 'Ramp to Carburize', endTime: 60, startTemp: 25, endTemp: 925 },
            { name: 'Carburizing', endTime: 300, startTemp: 925, endTemp: 925 },
            { name: 'Diffuse', endTime: 360, startTemp: 925, endTemp: 870 },
            { name: 'Quench', endTime: 365, startTemp: 870, endTemp: 60 },
            { name: 'Temper', endTime: 425, startTemp: 60, endTemp: 170 },
            { name: 'Hold Temper', endTime: 475, startTemp: 170, endTemp: 170 },
            { name: 'Cool', endTime: 480, startTemp: 170, endTemp: 25 },
        ];

        stages.forEach(s => {
            for (let t = profile.length > 0 ? profile[profile.length - 1].time + 1 : 0; t <= s.endTime; t += 5) {
                const pct = (t - (s === stages[0] ? 0 : stages[stages.indexOf(s) - 1].endTime)) /
                    (s.endTime - (s === stages[0] ? 0 : stages[stages.indexOf(s) - 1].endTime));
                profile.push({
                    time: t,
                    temperature: s.startTemp + (s.endTemp - s.startTemp) * Math.min(1, pct),
                    stage: s.name,
                });
            }
        });
    } else {
        // Through-hardening
        for (let t = 0; t <= totalTime; t += 5) {
            let temp;
            if (t < 45) temp = 25 + (850 - 25) * (t / 45);
            else if (t < 90) temp = 850;
            else if (t < 95) temp = 850 - (850 - 50) * ((t - 90) / 5);
            else if (t < 155) temp = 50 + (200 - 50) * ((t - 95) / 60);
            else if (t < 175) temp = 200;
            else temp = 200 - (200 - 25) * ((t - 175) / 5);
            profile.push({ time: t, temperature: temp, stage: t < 45 ? 'Ramp' : t < 90 ? 'Austenitize' : t < 95 ? 'Quench' : t < 175 ? 'Temper' : 'Cool' });
        }
    }

    // Hardness gradient through tooth
    const caseDepth = isCarburizing ? mod * 0.25 : 0; // mm
    const hardnessGradient = [];
    for (let depth = 0; depth <= mod * 1.5; depth += 0.1) {
        let hrc;
        if (isCarburizing) {
            hrc = depth <= caseDepth ? 60 - 2 * depth / caseDepth :
                60 - 30 * ((depth - caseDepth) / (mod * 1.5 - caseDepth));
        } else {
            hrc = hardness / 10; // Approximate HB to HRC
        }
        hardnessGradient.push({ depth, hardness: Math.max(25, hrc) });
    }

    return {
        type: isCarburizing ? 'Carburizing + Quench + Temper' : 'Through Hardening + Temper',
        profile,
        caseDepth,
        surfaceHardness: isCarburizing ? 60 : hardness / 10,
        coreHardness: isCarburizing ? 35 : hardness / 10,
        hardnessGradient,
        totalTime,
    };
}

function analyzesShotPeening(mod, faceWidth, material) {
    const residualStress = -400; // MPa (compressive)
    const depth = 0.25; // mm
    const fatigueImprovement = 25; // percent

    return {
        recommended: true,
        media: 'S230 steel shot',
        intensity: mod < 3 ? '0.010-0.014A' : '0.014-0.018A',
        coverage: '200%',
        residualStress,
        depth,
        fatigueImprovement,
        costAdder: 5, // percent of gear cost
    };
}

function calculateTolerances(mod, N_p, N_g, quality) {
    // ISO 1328 tolerances (simplified)
    const d_p = N_p * mod;
    const d_g = N_g * mod;

    const baseTolerance = 3.2 + 0.1 * Math.sqrt(d_g); // µm base
    const qualityFactor = Math.pow(2, (quality - 5) / 3);
    const totalTolerance = baseTolerance * qualityFactor;

    return {
        quality,
        pitchError: (totalTolerance * 0.5).toFixed(1), // µm
        profileError: (totalTolerance * 0.6).toFixed(1),
        helixError: (totalTolerance * 0.4).toFixed(1),
        runout: (totalTolerance * 1.2).toFixed(1),
        toothThickness: (mod * 0.02 * qualityFactor).toFixed(3), // mm
    };
}

function estimateCosts(gearType, mod, N_p, N_g, faceWidth, material, quantity, quality, primaryProcess) {
    const d_g = N_g * mod;
    const blankVolume = Math.PI * (d_g / 2000) ** 2 * (faceWidth / 1000);
    const materialCost = blankVolume * 7850 * 3.5; // $3.50/kg steel

    const machiningRate = 80; // $/hr
    const cycleTime = primaryProcess ? primaryProcess.cycleTime / 60 : 0.5; // hours
    const machiningCost = machiningRate * cycleTime;

    const htCost = quality <= 6 ? 15 : 8;
    const finishingCost = quality <= 5 ? machiningCost * 0.5 : 0;
    const inspectionCost = quality <= 5 ? 10 : 5;

    const setupCost = 200 / Math.max(1, quantity);
    const unitCost = materialCost + machiningCost + htCost + finishingCost + inspectionCost + setupCost;

    return {
        breakdown: {
            material: materialCost,
            machining: machiningCost,
            heatTreatment: htCost,
            finishing: finishingCost,
            inspection: inspectionCost,
            setup: setupCost,
        },
        unitCost,
        batchCost: unitCost * quantity,
        quantity,
    };
}

function assessDFM(gearType, mod, N_p, N_g, faceWidth, quality, material, hardness) {
    const scores = [];

    // Tooth strength (undercut risk)
    const undercutRisk = N_p < 17;
    scores.push({ category: 'Undercut Risk', score: undercutRisk ? 3 : 9, comment: undercutRisk ? 'N_p < 17, undercut likely' : 'OK' });

    // Aspect ratio
    const aspectRatio = faceWidth / mod;
    const goodAR = aspectRatio >= 8 && aspectRatio <= 16;
    scores.push({ category: 'Face Width Ratio', score: goodAR ? 9 : aspectRatio < 6 || aspectRatio > 20 ? 3 : 6, comment: `F/m = ${aspectRatio.toFixed(1)}` });

    // Quality vs cost
    const qualityScore = quality >= 7 ? 9 : quality >= 5 ? 6 : 3;
    scores.push({ category: 'Quality Grade', score: qualityScore, comment: `AGMA Q${quality}` });

    // Material machinability
    const easyMachine = hardness < 300;
    scores.push({ category: 'Machinability', score: easyMachine ? 8 : 4, comment: `${hardness} HB` });

    // Module standardness
    const stdModules = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
    const isStd = stdModules.includes(mod);
    scores.push({ category: 'Standard Module', score: isStd ? 10 : 4, comment: `m = ${mod}` });

    // Gear type complexity
    const typeComplexity = { spur: 10, helical: 7, bevel: 5, worm: 4 };
    scores.push({ category: 'Gear Type', score: typeComplexity[gearType] || 6, comment: gearType });

    const overallScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    const rating = overallScore >= 8 ? 'A' : overallScore >= 6 ? 'B' : overallScore >= 4 ? 'C' : 'D';

    return { scores, overallScore, rating, recommendation: overallScore < 6 ? 'Review design for manufacturing improvements' : 'Design is manufacturing-friendly' };
}

export default { analyzeManufacturing };
