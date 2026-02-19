/**
 * GearOptix Thermal Analysis
 * Source: "Machine Elements in Mechanical Design" 6th Ed, Section 16-7
 * Heat generation/dissipation, temperature rise, lubricant selection
 */

/**
 * Calculate heat generation and thermal equilibrium
 */
export function analyzeThermal(params) {
    const {
        inputPower,      // kW
        efficiency,      // 0-1
        ambientTemp = 25, // °C
        maxOilTemp = 100, // °C
        housingArea = 0.5, // m² estimated surface area
        coolingType = 'natural', // 'natural', 'forced_air', 'oil_cooled'
        oilType = 'ISO_VG_68'
    } = params;

    // Heat generated = Power × (1 - η)
    const heatGenerated = inputPower * 1000 * (1 - efficiency); // Watts

    // Convection coefficients (W/m²·K)
    const h_coefficients = {
        natural: 10,
        forced_air: 30,
        oil_cooled: 100
    };
    const h = h_coefficients[coolingType] || 10;

    // Temperature rise: Q = h × A × ΔT  →  ΔT = Q / (h × A)
    const tempRise = heatGenerated / (h * housingArea);
    const operatingTemp = ambientTemp + tempRise;

    // Lubricant viscosity recommendation
    const oilData = {
        'ISO_VG_32': { viscosity40: 32, viscosity100: 5.4, flashPoint: 200, label: 'ISO VG 32 (Light)' },
        'ISO_VG_46': { viscosity40: 46, viscosity100: 6.8, flashPoint: 210, label: 'ISO VG 46 (Medium)' },
        'ISO_VG_68': { viscosity40: 68, viscosity100: 8.7, flashPoint: 220, label: 'ISO VG 68 (Standard)' },
        'ISO_VG_100': { viscosity40: 100, viscosity100: 11.4, flashPoint: 230, label: 'ISO VG 100 (Heavy)' },
        'ISO_VG_150': { viscosity40: 150, viscosity100: 15.0, flashPoint: 240, label: 'ISO VG 150 (Very Heavy)' },
        'ISO_VG_220': { viscosity40: 220, viscosity100: 19.5, flashPoint: 250, label: 'ISO VG 220 (Extra Heavy)' }
    };

    const selectedOil = oilData[oilType] || oilData['ISO_VG_68'];

    // Check thermal adequacy
    const thermalOK = operatingTemp <= maxOilTemp;

    // Required cooling capacity if temp exceeds limit
    let requiredCooling = 0;
    if (!thermalOK) {
        const maxHeatDissipation = h * housingArea * (maxOilTemp - ambientTemp);
        requiredCooling = heatGenerated - maxHeatDissipation;
    }

    return {
        heatGenerated: heatGenerated.toFixed(1),
        tempRise: tempRise.toFixed(1),
        operatingTemp: operatingTemp.toFixed(1),
        maxOilTemp,
        thermalOK,
        coolingType,
        convectionCoeff: h,
        housingArea,
        lubricant: selectedOil,
        requiredCooling: requiredCooling.toFixed(1),
        recommendation: thermalOK
            ? 'Thermal design is adequate'
            : `Need ${requiredCooling.toFixed(0)}W additional cooling or larger housing`
    };
}

export default { analyzeThermal };
