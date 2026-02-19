/**
 * GearOptix Sustainability & Lifecycle Analysis
 * Source: "Machine Elements in Mechanical Design" Section 2-18
 * Carbon footprint, LCA, recyclability, lifecycle cost
 */

/**
 * Complete lifecycle sustainability analysis
 */
export function analyzeLifecycle(params) {
    const {
        material = 'AISI 4140',
        materialWeight = 2.5, // kg total gear weight
        power = 2.237, // kW
        efficiency = 0.97,
        operatingHours = 40000, // total design life hours
        electricityRate = 0.12, // $/kWh
        electricityCO2 = 0.5, // kg CO₂/kWh (grid average)
        maintenanceCycles = 8, // number of maintenance events
        manufacturingCost = 150, // $ per set
        disposalMethod = 'recycle', // recycle | landfill | refurbish
    } = params;

    // ========== 1. Carbon Footprint by Phase ==========
    const materialData = getMaterialCO2(material);
    const extractionCO2 = materialWeight * materialData.co2PerKg; // kg CO₂
    const manufacturingCO2 = materialWeight * 2.5; // ~2.5 kg CO₂/kg for machining
    const transportCO2 = materialWeight * 0.3; // Estimated logistics
    const operationPowerLoss = power * (1 - efficiency); // kW lost
    const operationCO2 = operationPowerLoss * operatingHours * electricityCO2; // kg CO₂
    const maintenanceCO2 = maintenanceCycles * 5; // kg CO₂ per maintenance event
    const disposalCO2 = disposalMethod === 'recycle' ? -extractionCO2 * materialData.recyclability :
        disposalMethod === 'refurbish' ? -extractionCO2 * 0.7 : materialWeight * 0.5;

    const totalCO2 = extractionCO2 + manufacturingCO2 + transportCO2 + operationCO2 + maintenanceCO2 + disposalCO2;

    const carbonFootprint = {
        extraction: extractionCO2,
        manufacturing: manufacturingCO2,
        transport: transportCO2,
        operation: operationCO2,
        maintenance: maintenanceCO2,
        disposal: disposalCO2,
        total: totalCO2,
        unit: 'kg CO₂',
        perHour: totalCO2 / operatingHours,
    };

    // ========== 2. Lifecycle Cost Analysis (LCA) ==========
    const acquisitionCost = manufacturingCost;
    const energyCost = power * operatingHours * electricityRate;
    const energyLossCost = operationPowerLoss * operatingHours * electricityRate;
    const maintenanceCost = maintenanceCycles * 50; // $50 per maintenance
    const downtimeCost = maintenanceCycles * 200; // $200 per downtime event
    const disposalCostVal = disposalMethod === 'recycle' ? -materialWeight * materialData.scrapValue :
        disposalMethod === 'refurbish' ? -manufacturingCost * 0.3 : materialWeight * 0.5;

    const totalLCC = acquisitionCost + energyLossCost + maintenanceCost + downtimeCost + disposalCostVal;

    const lifecycleCost = {
        acquisition: acquisitionCost,
        energyLoss: energyLossCost,
        maintenance: maintenanceCost,
        downtime: downtimeCost,
        disposal: disposalCostVal,
        total: totalLCC,
        perHour: totalLCC / operatingHours,
        currency: 'USD',
    };

    // ========== 3. Recyclability Analysis ==========
    const recyclability = {
        material: material,
        recyclabilityPercent: materialData.recyclability * 100,
        scrapValue: materialWeight * materialData.scrapValue,
        embodiedEnergy: materialWeight * materialData.embodiedEnergy, // MJ
        reuseabilityScore: disposalMethod === 'refurbish' ? 85 : disposalMethod === 'recycle' ? 70 : 10,
        components: [
            { name: 'Gear Body', weight: materialWeight * 0.7, recyclable: true, method: 'Melt & recast' },
            { name: 'Shaft', weight: materialWeight * 0.2, recyclable: true, method: 'Melt & recast' },
            { name: 'Lubricant', weight: materialWeight * 0.05, recyclable: true, method: 'Re-refine' },
            { name: 'Seals/Gaskets', weight: materialWeight * 0.03, recyclable: false, method: 'Landfill' },
            { name: 'Bearings', weight: materialWeight * 0.02, recyclable: true, method: 'Recondition' },
        ],
    };

    // ========== 4. Energy Payback ==========
    // If we improve efficiency by 1%, how long until energy savings pay back?
    const efficiencyImprovement = 0.01; // 1% improvement
    const savedPower = power * efficiencyImprovement; // kW saved
    const savedCostPerHour = savedPower * electricityRate;
    const savedCO2PerHour = savedPower * electricityCO2;
    const additionalCost = manufacturingCost * 0.15; // 15% cost premium for better efficiency
    const paybackHours = additionalCost / savedCostPerHour;
    const paybackCO2 = additionalCost * 2 / savedCO2PerHour; // approx CO₂ payback

    const energyPayback = {
        efficiencyGain: efficiencyImprovement * 100,
        additionalCost,
        savedPerHour: savedCostPerHour,
        paybackHours,
        paybackYears: paybackHours / 8760,
        co2PaybackHours: paybackCO2,
        worthwhile: paybackHours < operatingHours * 0.3,
    };

    // ========== 5. Sustainability Score ==========
    let score = 50; // base
    if (materialData.recyclability > 0.8) score += 10;
    if (efficiency > 0.95) score += 10;
    if (disposalMethod === 'recycle') score += 10;
    if (disposalMethod === 'refurbish') score += 15;
    if (energyPayback.worthwhile) score += 5;
    if (totalCO2 / operatingHours < 0.01) score += 10;

    const maxScore = 100;
    score = Math.min(maxScore, score);

    const rating = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F';

    return {
        carbonFootprint,
        lifecycleCost,
        recyclability,
        energyPayback,
        sustainability: { score, rating, maxScore },
    };
}

/**
 * Comparative analysis: Design A vs Design B
 */
export function compareDesigns(designA, designB) {
    const resultA = analyzeLifecycle(designA);
    const resultB = analyzeLifecycle(designB);

    return {
        designA: { ...resultA, label: designA.label || 'Design A' },
        designB: { ...resultB, label: designB.label || 'Design B' },
        comparison: {
            co2Difference: resultA.carbonFootprint.total - resultB.carbonFootprint.total,
            costDifference: resultA.lifecycleCost.total - resultB.lifecycleCost.total,
            betterCO2: resultA.carbonFootprint.total < resultB.carbonFootprint.total ? 'A' : 'B',
            betterCost: resultA.lifecycleCost.total < resultB.lifecycleCost.total ? 'A' : 'B',
        },
    };
}

function getMaterialCO2(material) {
    const database = {
        'AISI 1020': { co2PerKg: 2.0, recyclability: 0.90, embodiedEnergy: 25, scrapValue: 0.30 },
        'AISI 1045': { co2PerKg: 2.1, recyclability: 0.90, embodiedEnergy: 27, scrapValue: 0.30 },
        'AISI 4140': { co2PerKg: 2.8, recyclability: 0.85, embodiedEnergy: 35, scrapValue: 0.50 },
        'AISI 4340': { co2PerKg: 3.2, recyclability: 0.85, embodiedEnergy: 40, scrapValue: 0.55 },
        'AISI 8620': { co2PerKg: 3.0, recyclability: 0.85, embodiedEnergy: 38, scrapValue: 0.45 },
        'AISI 9310': { co2PerKg: 4.5, recyclability: 0.80, embodiedEnergy: 55, scrapValue: 0.70 },
        'Cast Iron': { co2PerKg: 1.5, recyclability: 0.95, embodiedEnergy: 17, scrapValue: 0.15 },
        'Bronze': { co2PerKg: 5.0, recyclability: 0.90, embodiedEnergy: 70, scrapValue: 3.50 },
        'Aluminum': { co2PerKg: 8.0, recyclability: 0.95, embodiedEnergy: 170, scrapValue: 1.00 },
        'Titanium': { co2PerKg: 35, recyclability: 0.70, embodiedEnergy: 600, scrapValue: 8.00 },
        'Nylon': { co2PerKg: 6.7, recyclability: 0.30, embodiedEnergy: 90, scrapValue: 0.05 },
    };
    return database[material] || database['AISI 4140'];
}

export default { analyzeLifecycle, compareDesigns };
