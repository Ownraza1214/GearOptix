/**
 * GearOptix Standard Sizes & Parameters
 * ISO 54, AGMA, and conventional standard values
 */

// =============== Standard Modules (ISO 54) - mm ===============
export const STANDARD_MODULES = [
    0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0,
    1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0,
    3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 7.0, 8.0,
    9.0, 10.0, 11.0, 12.0, 14.0, 16.0, 18.0, 20.0,
    22.0, 25.0, 28.0, 32.0, 36.0, 40.0, 45.0, 50.0
];

// =============== Standard Diametral Pitches (US Customary) ===============
export const STANDARD_DIAMETRAL_PITCHES = [
    1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 48, 64, 80, 96, 120
];

// =============== Standard Pressure Angles ===============
export const STANDARD_PRESSURE_ANGLES = [
    { value: 14.5, label: '14.5° (Legacy)', description: 'Older standard, smooth meshing but weaker' },
    { value: 20, label: '20° (Standard)', description: 'AGMA standard, best balance of strength/noise' },
    { value: 25, label: '25° (Strong)', description: 'Stronger tooth, more noise, used in high-load apps' }
];

// =============== Standard Helix Angles ===============
export const STANDARD_HELIX_ANGLES = [
    15, 20, 23, 25, 30, 35, 40, 45
];

// =============== AGMA Quality Numbers ===============
export const AGMA_QUALITY_NUMBERS = [
    { value: 5, label: 'Qv 5', description: 'Lowest precision, rough cut' },
    { value: 6, label: 'Qv 6', description: 'Low precision, general purpose' },
    { value: 7, label: 'Qv 7', description: 'Standard commercial' },
    { value: 8, label: 'Qv 8', description: 'Precision commercial' },
    { value: 9, label: 'Qv 9', description: 'Precision ground' },
    { value: 10, label: 'Qv 10', description: 'High precision, ground/lapped' },
    { value: 11, label: 'Qv 11', description: 'Very high precision' },
    { value: 12, label: 'Qv 12', description: 'Ultra precision, aerospace' }
];

// =============== Gear Types ===============
export const GEAR_TYPES = [
    {
        id: 'spur',
        name: 'Spur Gear',
        description: 'Simplest type, teeth parallel to axis. Per Chapter 9.',
        standard: 'AGMA 2001-D04',
        icon: '⚙️',
        maxRatio: 10,
        typicalEfficiency: [97, 99.5]
    },
    {
        id: 'helical',
        name: 'Helical Gear',
        description: 'Teeth at helix angle, smoother/quieter. Per Chapter 10.',
        standard: 'AGMA 2001-D04',
        icon: '🔩',
        maxRatio: 10,
        typicalEfficiency: [96, 99]
    },
    {
        id: 'bevel',
        name: 'Bevel Gear',
        description: 'Conical, 90° shaft angle. Per Chapter 10.',
        standard: 'AGMA 2003-C10',
        icon: '📐',
        maxRatio: 6,
        typicalEfficiency: [95, 99]
    },
    {
        id: 'worm',
        name: 'Worm Gear',
        description: 'High ratio, single stage. Per Chapter 10.',
        standard: 'AGMA 6034-B92',
        icon: '🐛',
        maxRatio: 100,
        typicalEfficiency: [40, 95]
    }
];

// =============== Load Classifications (Table 9-1) ===============
export const POWER_SOURCES = [
    { value: 'uniform', label: 'Uniform (Electric Motor)', description: 'Constant speed/torque' },
    { value: 'light_shock', label: 'Light Shock (Multi-Cyl Engine)', description: 'Minor fluctuations' },
    { value: 'medium_shock', label: 'Medium Shock (Single-Cyl Engine)', description: 'Significant fluctuations' }
];

export const DRIVEN_MACHINES = [
    { value: 'uniform', label: 'Uniform', description: 'Generator, conveyor (steady load)' },
    { value: 'moderate_shock', label: 'Moderate Shock', description: 'Machine tool, mixer, pump' },
    { value: 'heavy_shock', label: 'Heavy Shock', description: 'Crusher, punch press, rolling mill' }
];

// =============== Standard Face Width Ratios ===============
export const FACE_WIDTH_GUIDELINES = {
    min: 3, // minimum F/m ratio (book: at least 3× module)
    typical: 10, // normal F/m ratio (8-12× module typical)
    max: 16, // maximum F/m ratio (practically limited)
    pinion_rule: 'F should be 8 to 16 times the module (m) or 8/P to 16/P'
};

// =============== Minimum Teeth (to avoid interference, Section 8-5) ===============
export const MIN_TEETH = {
    14.5: { full_depth: 32, stub: 26 },
    20: { full_depth: 18, stub: 14 },
    25: { full_depth: 12, stub: 10 }
};

// =============== Standard Tooth Systems (Section 8-4) ===============
export const TOOTH_SYSTEMS = [
    {
        id: 'full_depth',
        name: 'Full Depth (Standard)',
        addendum: 1.0,    // × module
        dedendum: 1.25,    // × module
        clearance: 0.25,   // × module
        workingDepth: 2.0, // × module
        wholeDepth: 2.25   // × module
    },
    {
        id: 'stub',
        name: 'Stub Tooth',
        addendum: 0.8,
        dedendum: 1.0,
        clearance: 0.2,
        workingDepth: 1.6,
        wholeDepth: 1.8
    }
];

// =============== Unit Systems ===============
export const UNIT_SYSTEMS = {
    SI: {
        name: 'SI (Metric)',
        power: { unit: 'kW', label: 'Kilowatts' },
        torque: { unit: 'N·m', label: 'Newton-meters' },
        speed: { unit: 'RPM', label: 'Revolutions/min' },
        length: { unit: 'mm', label: 'Millimeters' },
        stress: { unit: 'MPa', label: 'Megapascals' },
        force: { unit: 'N', label: 'Newtons' },
        velocity: { unit: 'm/s', label: 'Meters/sec' },
        temperature: { unit: '°C', label: 'Celsius' }
    },
    Imperial: {
        name: 'US Customary',
        power: { unit: 'HP', label: 'Horsepower' },
        torque: { unit: 'lb·ft', label: 'Pound-feet' },
        speed: { unit: 'RPM', label: 'Revolutions/min' },
        length: { unit: 'in', label: 'Inches' },
        stress: { unit: 'psi', label: 'Pounds/sq-in' },
        force: { unit: 'lb', label: 'Pounds-force' },
        velocity: { unit: 'ft/min', label: 'Feet/min' },
        temperature: { unit: '°F', label: 'Fahrenheit' }
    }
};

// =============== Common Gear Train Configurations ===============
export const TRAIN_TYPES = [
    { id: 'simple', name: 'Simple Gear Train', description: 'Single pair, direct mesh' },
    { id: 'compound', name: 'Compound Gear Train', description: 'Multiple pairs on shared shafts' },
    { id: 'reverted', name: 'Reverted Gear Train', description: 'Input/output on same axis' },
    { id: 'epicyclic', name: 'Epicyclic (Planetary)', description: 'Sun/planet/ring arrangement' }
];

export default {
    STANDARD_MODULES,
    STANDARD_DIAMETRAL_PITCHES,
    STANDARD_PRESSURE_ANGLES,
    STANDARD_HELIX_ANGLES,
    AGMA_QUALITY_NUMBERS,
    GEAR_TYPES,
    POWER_SOURCES,
    DRIVEN_MACHINES,
    FACE_WIDTH_GUIDELINES,
    MIN_TEETH,
    TOOTH_SYSTEMS,
    UNIT_SYSTEMS,
    TRAIN_TYPES
};
