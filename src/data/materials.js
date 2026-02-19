/**
 * GearOptix Material Database
 * Source: "Machine Elements in Mechanical Design" 6th Ed, Appendices 3-13
 * Properties: s_ut (ultimate tensile, MPa), s_y (yield, MPa), HB (Brinell hardness),
 * s_at (allowable bending stress, MPa), s_ac (allowable contact stress, MPa),
 * density (kg/m³), E (elastic modulus, GPa), poisson (Poisson's ratio)
 */

export const MATERIAL_CATEGORIES = {
    STEEL_THROUGH_HARDENED: 'Through-Hardened Steel',
    STEEL_CASE_HARDENED: 'Case-Hardened Steel',
    STEEL_FLAME_INDUCTION: 'Flame/Induction Hardened Steel',
    STEEL_NITRIDED: 'Nitrided Steel',
    CAST_IRON: 'Cast Iron',
    BRONZE: 'Bronze',
    ALUMINUM: 'Aluminum Alloy',
    STAINLESS: 'Stainless Steel',
    POLYMER: 'Polymer/Nylon'
};

export const materials = [
    // =============== Through-Hardened Steels (Figs 9-18, 9-19) ===============
    {
        id: 'SAE_1020',
        name: 'SAE 1020 Steel',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 1',
        s_ut: 448, s_y: 331, HB: 131,
        s_at: 117, s_ac: 586,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 1.0,
        notes: 'Low carbon, general purpose. Good machinability.'
    },
    {
        id: 'SAE_1040',
        name: 'SAE 1040 Steel',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 1',
        s_ut: 586, s_y: 414, HB: 170,
        s_at: 152, s_ac: 669,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 1.1,
        notes: 'Medium carbon, moderate strength.'
    },
    {
        id: 'SAE_1045_HR',
        name: 'SAE 1045 HR Steel',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 1',
        s_ut: 627, s_y: 345, HB: 179,
        s_at: 161, s_ac: 690,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 1.12,
        notes: 'Hot rolled, medium carbon.'
    },
    {
        id: 'SAE_1045_CD',
        name: 'SAE 1045 CD Steel',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 1',
        s_ut: 689, s_y: 586, HB: 197,
        s_at: 179, s_ac: 724,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 1.2,
        notes: 'Cold drawn, higher strength than HR.'
    },
    {
        id: 'SAE_4130_WQT400',
        name: 'SAE 4130 WQT 400',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 2',
        s_ut: 1282, s_y: 1172, HB: 371,
        s_at: 310, s_ac: 1034,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 2.0,
        notes: 'Chrome-moly, excellent toughness. WQ&T 400°F.'
    },
    {
        id: 'SAE_4140_OQT1000',
        name: 'SAE 4140 OQT 1000',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 2',
        s_ut: 1020, s_y: 896, HB: 302,
        s_at: 262, s_ac: 917,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 1.8,
        notes: 'Chrome-moly, high strength. OQ&T 1000°F.'
    },
    {
        id: 'SAE_4140_OQT400',
        name: 'SAE 4140 OQT 400',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 2',
        s_ut: 1641, s_y: 1503, HB: 461,
        s_at: 379, s_ac: 1172,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 2.2,
        notes: 'Chrome-moly, very high strength. OQ&T 400°F.'
    },
    {
        id: 'SAE_4340_OQT1000',
        name: 'SAE 4340 OQT 1000',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 2',
        s_ut: 1110, s_y: 1000, HB: 331,
        s_at: 283, s_ac: 965,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 2.5,
        notes: 'Ni-Cr-Mo, premium aircraft quality.'
    },
    {
        id: 'SAE_4340_OQT800',
        name: 'SAE 4340 OQT 800',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 2',
        s_ut: 1282, s_y: 1172, HB: 380,
        s_at: 317, s_ac: 1048,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 2.7,
        notes: 'Ni-Cr-Mo, very high strength. OQ&T 800°F.'
    },
    {
        id: 'SAE_2340_OQT1000',
        name: 'SAE 2340 OQT 1000',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 2',
        s_ut: 999, s_y: 848, HB: 285,
        s_at: 241, s_ac: 889,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 2.0,
        notes: 'Nickel steel, good toughness.'
    },
    {
        id: 'SAE_6150_OQT1000',
        name: 'SAE 6150 OQT 1000',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 2',
        s_ut: 1020, s_y: 862, HB: 302,
        s_at: 262, s_ac: 917,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 1.9,
        notes: 'Chrome-vanadium, excellent fatigue resistance.'
    },
    {
        id: 'SAE_8650_OQT1000',
        name: 'SAE 8650 OQT 1000',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 2',
        s_ut: 1034, s_y: 931, HB: 302,
        s_at: 262, s_ac: 917,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 2.1,
        notes: 'Ni-Cr-Mo, heavy-duty applications.'
    },

    // =============== Case-Hardened Steels (Table 9-9) ===============
    {
        id: 'SAE_8620_CASE',
        name: 'SAE 8620 Case-Hardened',
        category: MATERIAL_CATEGORIES.STEEL_CASE_HARDENED,
        grade: 'Grade 2',
        s_ut: 655, s_y: 517, HB: 580,
        s_at: 379, s_ac: 1345,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 2.8,
        notes: 'Carburized to 58-62 HRC surface. Case depth 0.75-1.5mm.'
    },
    {
        id: 'SAE_4320_CASE',
        name: 'SAE 4320 Case-Hardened',
        category: MATERIAL_CATEGORIES.STEEL_CASE_HARDENED,
        grade: 'Grade 2',
        s_ut: 793, s_y: 655, HB: 580,
        s_at: 379, s_ac: 1380,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 3.0,
        notes: 'Carburized Ni-Cr-Mo, high core toughness.'
    },
    {
        id: 'SAE_9310_CASE',
        name: 'SAE 9310 Case-Hardened',
        category: MATERIAL_CATEGORIES.STEEL_CASE_HARDENED,
        grade: 'Grade 3',
        s_ut: 931, s_y: 793, HB: 600,
        s_at: 414, s_ac: 1490,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 4.0,
        notes: 'Premium aerospace carburized steel. 60 HRC surface.'
    },
    {
        id: 'SAE_4620_CASE',
        name: 'SAE 4620 Case-Hardened',
        category: MATERIAL_CATEGORIES.STEEL_CASE_HARDENED,
        grade: 'Grade 2',
        s_ut: 620, s_y: 483, HB: 580,
        s_at: 366, s_ac: 1310,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 2.6,
        notes: 'Nickel-moly carburized steel.'
    },

    // ============ Flame/Induction Hardened Steels ============
    {
        id: 'SAE_1045_FLAME',
        name: 'SAE 1045 Flame Hardened',
        category: MATERIAL_CATEGORIES.STEEL_FLAME_INDUCTION,
        grade: 'Grade 1',
        s_ut: 627, s_y: 345, HB: 500,
        s_at: 310, s_ac: 1170,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 1.5,
        notes: 'Surface hardened to 50-54 HRC. Economical.'
    },
    {
        id: 'SAE_4140_FLAME',
        name: 'SAE 4140 Flame Hardened',
        category: MATERIAL_CATEGORIES.STEEL_FLAME_INDUCTION,
        grade: 'Grade 2',
        s_ut: 1020, s_y: 896, HB: 540,
        s_at: 345, s_ac: 1240,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 2.3,
        notes: 'Chrome-moly flame hardened. 52-56 HRC surface.'
    },
    {
        id: 'SAE_4340_INDUCTION',
        name: 'SAE 4340 Induction Hardened',
        category: MATERIAL_CATEGORIES.STEEL_FLAME_INDUCTION,
        grade: 'Grade 2',
        s_ut: 1110, s_y: 1000, HB: 560,
        s_at: 359, s_ac: 1280,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 3.0,
        notes: 'Ni-Cr-Mo induction hardened. 54-58 HRC surface.'
    },

    // =============== Nitrided Steels ===============
    {
        id: 'NITRALLOY_135M',
        name: 'Nitralloy 135M',
        category: MATERIAL_CATEGORIES.STEEL_NITRIDED,
        grade: 'Grade 2',
        s_ut: 931, s_y: 793, HB: 650,
        s_at: 379, s_ac: 1310,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 3.5,
        notes: 'Purpose-designed nitriding steel. 62-70 HRC case.'
    },
    {
        id: 'SAE_4140_NITRIDED',
        name: 'SAE 4140 Nitrided',
        category: MATERIAL_CATEGORIES.STEEL_NITRIDED,
        grade: 'Grade 2',
        s_ut: 1020, s_y: 896, HB: 600,
        s_at: 345, s_ac: 1240,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 2.8,
        notes: 'Chrome-moly nitrided. Excellent wear resistance.'
    },
    {
        id: 'SAE_4340_NITRIDED',
        name: 'SAE 4340 Nitrided',
        category: MATERIAL_CATEGORIES.STEEL_NITRIDED,
        grade: 'Grade 2',
        s_ut: 1110, s_y: 1000, HB: 620,
        s_at: 362, s_ac: 1280,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 3.2,
        notes: 'Ni-Cr-Mo nitrided. Premium quality.'
    },

    // =============== Cast Irons (Appendix 6) ===============
    {
        id: 'ASTM_20_GRAY',
        name: 'ASTM Class 20 Gray Iron',
        category: MATERIAL_CATEGORIES.CAST_IRON,
        grade: 'Grade 1',
        s_ut: 152, s_y: 97, HB: 156,
        s_at: 34, s_ac: 345,
        density: 7150, E: 100, poisson: 0.26,
        costFactor: 0.6,
        notes: 'Low strength gray iron, damping applications.'
    },
    {
        id: 'ASTM_30_GRAY',
        name: 'ASTM Class 30 Gray Iron',
        category: MATERIAL_CATEGORIES.CAST_IRON,
        grade: 'Grade 1',
        s_ut: 214, s_y: 138, HB: 210,
        s_at: 52, s_ac: 414,
        density: 7150, E: 110, poisson: 0.26,
        costFactor: 0.65,
        notes: 'Medium strength gray iron, general purpose.'
    },
    {
        id: 'ASTM_40_GRAY',
        name: 'ASTM Class 40 Gray Iron',
        category: MATERIAL_CATEGORIES.CAST_IRON,
        grade: 'Grade 1',
        s_ut: 293, s_y: 179, HB: 235,
        s_at: 69, s_ac: 483,
        density: 7150, E: 125, poisson: 0.26,
        costFactor: 0.7,
        notes: 'Higher strength gray iron, good damping.'
    },
    {
        id: 'ASTM_60_GRAY',
        name: 'ASTM Class 60 Gray Iron',
        category: MATERIAL_CATEGORIES.CAST_IRON,
        grade: 'Grade 1',
        s_ut: 431, s_y: 276, HB: 293,
        s_at: 96, s_ac: 565,
        density: 7200, E: 138, poisson: 0.26,
        costFactor: 0.8,
        notes: 'High strength gray iron.'
    },
    {
        id: 'ASTM_80_55_06_DUCTILE',
        name: 'ASTM 80-55-06 Ductile Iron',
        category: MATERIAL_CATEGORIES.CAST_IRON,
        grade: 'Grade 1',
        s_ut: 552, s_y: 379, HB: 228,
        s_at: 124, s_ac: 586,
        density: 7100, E: 170, poisson: 0.28,
        costFactor: 0.85,
        notes: 'Moderate ductility, good strength.'
    },
    {
        id: 'ASTM_100_70_03_DUCTILE',
        name: 'ASTM 100-70-03 Ductile Iron',
        category: MATERIAL_CATEGORIES.CAST_IRON,
        grade: 'Grade 1',
        s_ut: 689, s_y: 483, HB: 269,
        s_at: 152, s_ac: 669,
        density: 7100, E: 170, poisson: 0.28,
        costFactor: 1.0,
        notes: 'High strength ductile iron.'
    },
    {
        id: 'ASTM_120_90_02_DUCTILE',
        name: 'ASTM 120-90-02 Ductile Iron',
        category: MATERIAL_CATEGORIES.CAST_IRON,
        grade: 'Grade 1',
        s_ut: 827, s_y: 621, HB: 302,
        s_at: 179, s_ac: 724,
        density: 7100, E: 170, poisson: 0.28,
        costFactor: 1.1,
        notes: 'Very high strength ductile iron.'
    },

    // =============== Bronzes (Appendix 9 - Worm Gears) ===============
    {
        id: 'SAE_65_BRONZE',
        name: 'SAE 65 Gear Bronze',
        category: MATERIAL_CATEGORIES.BRONZE,
        grade: 'Grade 1',
        s_ut: 276, s_y: 117, HB: 65,
        s_at: 55, s_ac: 414,
        density: 8800, E: 103, poisson: 0.34,
        costFactor: 3.0,
        notes: 'Tin bronze (Cu-Sn), standard worm gear material.'
    },
    {
        id: 'PHOSPHOR_BRONZE_C',
        name: 'Phosphor Bronze C (C52400)',
        category: MATERIAL_CATEGORIES.BRONZE,
        grade: 'Grade 1',
        s_ut: 448, s_y: 207, HB: 80,
        s_at: 69, s_ac: 490,
        density: 8860, E: 103, poisson: 0.34,
        costFactor: 3.5,
        notes: 'Phosphor bronze, excellent wear. Spring-quality.'
    },
    {
        id: 'MANGANESE_BRONZE',
        name: 'Manganese Bronze (C86500)',
        category: MATERIAL_CATEGORIES.BRONZE,
        grade: 'Grade 1',
        s_ut: 490, s_y: 193, HB: 95,
        s_at: 76, s_ac: 517,
        density: 8500, E: 100, poisson: 0.33,
        costFactor: 2.8,
        notes: 'High strength bronze, good machinability.'
    },
    {
        id: 'ALUMINUM_BRONZE',
        name: 'Aluminum Bronze (C95400)',
        category: MATERIAL_CATEGORIES.BRONZE,
        grade: 'Grade 1',
        s_ut: 586, s_y: 241, HB: 170,
        s_at: 103, s_ac: 586,
        density: 7500, E: 110, poisson: 0.33,
        costFactor: 3.2,
        notes: 'High strength, corrosion resistant.'
    },
    {
        id: 'SILICON_BRONZE',
        name: 'Silicon Bronze (C65500)',
        category: MATERIAL_CATEGORIES.BRONZE,
        grade: 'Grade 1',
        s_ut: 552, s_y: 234, HB: 100,
        s_at: 83, s_ac: 538,
        density: 8530, E: 103, poisson: 0.34,
        costFactor: 3.0,
        notes: 'Good corrosion resistance, worm gears.'
    },

    // =============== Aluminum Alloys (Appendix 8) ===============
    {
        id: 'AL_2024_T4',
        name: 'Aluminum 2024-T4',
        category: MATERIAL_CATEGORIES.ALUMINUM,
        grade: 'Grade 1',
        s_ut: 469, s_y: 324, HB: 120,
        s_at: 41, s_ac: 345,
        density: 2780, E: 73, poisson: 0.33,
        costFactor: 2.0,
        notes: 'High strength aerospace aluminum.'
    },
    {
        id: 'AL_6061_T6',
        name: 'Aluminum 6061-T6',
        category: MATERIAL_CATEGORIES.ALUMINUM,
        grade: 'Grade 1',
        s_ut: 310, s_y: 276, HB: 95,
        s_at: 34, s_ac: 310,
        density: 2710, E: 69, poisson: 0.33,
        costFactor: 1.5,
        notes: 'General purpose structural aluminum.'
    },
    {
        id: 'AL_7075_T6',
        name: 'Aluminum 7075-T6',
        category: MATERIAL_CATEGORIES.ALUMINUM,
        grade: 'Grade 1',
        s_ut: 572, s_y: 503, HB: 150,
        s_at: 52, s_ac: 379,
        density: 2810, E: 72, poisson: 0.33,
        costFactor: 3.5,
        notes: 'Very high strength aerospace aluminum.'
    },

    // =============== Stainless Steels ===============
    {
        id: 'SS_303',
        name: 'Stainless 303 (Annealed)',
        category: MATERIAL_CATEGORIES.STAINLESS,
        grade: 'Grade 1',
        s_ut: 586, s_y: 241, HB: 160,
        s_at: 117, s_ac: 621,
        density: 8000, E: 193, poisson: 0.27,
        costFactor: 3.5,
        notes: 'Free-machining austenitic stainless.'
    },
    {
        id: 'SS_304',
        name: 'Stainless 304 (Annealed)',
        category: MATERIAL_CATEGORIES.STAINLESS,
        grade: 'Grade 1',
        s_ut: 517, s_y: 207, HB: 150,
        s_at: 103, s_ac: 586,
        density: 8000, E: 193, poisson: 0.27,
        costFactor: 3.0,
        notes: 'Most common austenitic stainless.'
    },
    {
        id: 'SS_316',
        name: 'Stainless 316 (Annealed)',
        category: MATERIAL_CATEGORIES.STAINLESS,
        grade: 'Grade 1',
        s_ut: 517, s_y: 207, HB: 150,
        s_at: 103, s_ac: 586,
        density: 8000, E: 193, poisson: 0.27,
        costFactor: 4.0,
        notes: 'Marine grade, superior corrosion resistance.'
    },
    {
        id: 'SS_17_4PH',
        name: 'Stainless 17-4PH (H1025)',
        category: MATERIAL_CATEGORIES.STAINLESS,
        grade: 'Grade 2',
        s_ut: 1069, s_y: 1000, HB: 331,
        s_at: 241, s_ac: 862,
        density: 7810, E: 197, poisson: 0.27,
        costFactor: 5.0,
        notes: 'Precipitation hardened, high strength.'
    },
    {
        id: 'SS_440C',
        name: 'Stainless 440C (Hardened)',
        category: MATERIAL_CATEGORIES.STAINLESS,
        grade: 'Grade 2',
        s_ut: 1896, s_y: 1751, HB: 580,
        s_at: 310, s_ac: 1103,
        density: 7650, E: 200, poisson: 0.27,
        costFactor: 5.5,
        notes: 'Martensitic stainless, highest hardness.'
    },

    // =============== Polymers / Nylon ===============
    {
        id: 'NYLON_6_6',
        name: 'Nylon 6/6 (Dry)',
        category: MATERIAL_CATEGORIES.POLYMER,
        grade: 'Grade 1',
        s_ut: 83, s_y: 69, HB: 15,
        s_at: 14, s_ac: 55,
        density: 1140, E: 2.8, poisson: 0.40,
        costFactor: 0.5,
        notes: 'Lightweight, quiet operation, non-lubricated.'
    },
    {
        id: 'NYLON_6_6_GF30',
        name: 'Nylon 6/6 30% GF',
        category: MATERIAL_CATEGORIES.POLYMER,
        grade: 'Grade 1',
        s_ut: 179, s_y: 131, HB: 25,
        s_at: 28, s_ac: 97,
        density: 1370, E: 9.6, poisson: 0.38,
        costFactor: 0.8,
        notes: 'Glass-filled nylon, improved strength.'
    },
    {
        id: 'ACETAL_DELRIN',
        name: 'Acetal (Delrin)',
        category: MATERIAL_CATEGORIES.POLYMER,
        grade: 'Grade 1',
        s_ut: 69, s_y: 62, HB: 12,
        s_at: 12, s_ac: 48,
        density: 1420, E: 3.1, poisson: 0.35,
        costFactor: 0.7,
        notes: 'Excellent dimensional stability, low friction.'
    },
    {
        id: 'PEEK',
        name: 'PEEK (Polyether Ether Ketone)',
        category: MATERIAL_CATEGORIES.POLYMER,
        grade: 'Grade 1',
        s_ut: 100, s_y: 91, HB: 30,
        s_at: 21, s_ac: 69,
        density: 1310, E: 3.6, poisson: 0.38,
        costFactor: 8.0,
        notes: 'Premium polymer, high temp capability to 250°C.'
    },

    // =============== Additional Steels ===============
    {
        id: 'SAE_1060_HR',
        name: 'SAE 1060 HR Steel',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 1',
        s_ut: 676, s_y: 372, HB: 201,
        s_at: 183, s_ac: 731,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 1.15,
        notes: 'High carbon hot rolled.'
    },
    {
        id: 'SAE_1144_OQT',
        name: 'SAE 1144 OQT Steel',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 1',
        s_ut: 896, s_y: 779, HB: 262,
        s_at: 228, s_ac: 852,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 1.6,
        notes: 'Free-machining resulfurized steel.'
    },
    {
        id: 'SAE_3140_OQT1000',
        name: 'SAE 3140 OQT 1000',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 2',
        s_ut: 889, s_y: 772, HB: 262,
        s_at: 228, s_ac: 852,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 2.3,
        notes: 'Nickel-chrome steel, good toughness.'
    },
    {
        id: 'SAE_5160_OQT1000',
        name: 'SAE 5160 OQT 1000',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 2',
        s_ut: 1034, s_y: 862, HB: 302,
        s_at: 262, s_ac: 917,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 1.9,
        notes: 'Spring steel, excellent fatigue.'
    },
    {
        id: 'SAE_8620_THRU',
        name: 'SAE 8620 Through-Hardened',
        category: MATERIAL_CATEGORIES.STEEL_THROUGH_HARDENED,
        grade: 'Grade 1',
        s_ut: 655, s_y: 517, HB: 192,
        s_at: 172, s_ac: 710,
        density: 7850, E: 207, poisson: 0.29,
        costFactor: 1.8,
        notes: 'Nickel-chrome-moly, commonly case-hardened.'
    },
];

/**
 * Get materials by category
 */
export function getMaterialsByCategory(category) {
    return materials.filter(m => m.category === category);
}

/**
 * Find material by ID
 */
export function getMaterialById(id) {
    return materials.find(m => m.id === id);
}

/**
 * Get all unique categories
 */
export function getCategories() {
    return Object.values(MATERIAL_CATEGORIES);
}

/**
 * Get elastic coefficient C_p for material pair (Table 9-8)
 * For pinion/gear material combinations
 */
export function getElasticCoefficient(mat1, mat2) {
    const e1 = mat1.E * 1000; // GPa -> MPa
    const e2 = mat2.E * 1000;
    const v1 = mat1.poisson;
    const v2 = mat2.poisson;

    // AGMA Eq 9-24: C_p = sqrt(1 / (π * ((1-v1²)/E1 + (1-v2²)/E2)))
    const denom = Math.PI * ((1 - v1 * v1) / e1 + (1 - v2 * v2) / e2);
    return Math.sqrt(1 / denom);
}

export default materials;
