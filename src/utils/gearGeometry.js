/**
 * GearOptix Involute Gear Geometry Generator
 * Generates tooth profiles for 3D visualization
 * Based on involute curve theory (Section 8-3)
 */

/**
 * Generate involute curve points
 * Involute equation: x = r_b(cos θ + θ sin θ), y = r_b(sin θ - θ cos θ)
 * where r_b = base circle radius, θ = involute roll angle
 */
export function generateInvolutePoints(baseRadius, startAngle, endAngle, numPoints = 30) {
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
        const t = startAngle + (endAngle - startAngle) * (i / numPoints);
        points.push({
            x: baseRadius * (Math.cos(t) + t * Math.sin(t)),
            y: baseRadius * (Math.sin(t) - t * Math.cos(t))
        });
    }
    return points;
}

/**
 * Generate a complete gear tooth profile (2D)
 * Returns array of {x, y} points describing one tooth
 */
export function generateToothProfile(params) {
    const {
        numTeeth,
        module: mod, // mm
        pressureAngle = 20,
        addendumFactor = 1.0,
        dedendumFactor = 1.25
    } = params;

    const phi = (pressureAngle * Math.PI) / 180;
    const pitchRadius = (numTeeth * mod) / 2;
    const baseRadius = pitchRadius * Math.cos(phi);
    const addendum = addendumFactor * mod;
    const dedendum = dedendumFactor * mod;
    const outsideRadius = pitchRadius + addendum;
    const rootRadius = pitchRadius - dedendum;

    // Angular tooth thickness at pitch circle
    const toothThickAngle = Math.PI / numTeeth; // half tooth at pitch

    // Involute angle at pitch circle
    const invPhi = Math.tan(phi) - phi; // involute function at pitch

    // Involute angle at outside circle
    const phiO = Math.acos(baseRadius / outsideRadius);
    const invPhiO = Math.tan(phiO) - phiO;

    const points = [];

    // Generate one side of the tooth (involute curve)
    const maxAngle = Math.sqrt((outsideRadius / baseRadius) * (outsideRadius / baseRadius) - 1);
    const numInvolutePoints = 20;

    for (let i = 0; i <= numInvolutePoints; i++) {
        const t = (maxAngle * i) / numInvolutePoints;
        const r = baseRadius * Math.sqrt(1 + t * t);
        if (r > outsideRadius) break;

        const angle = t - Math.atan(t) + toothThickAngle / 2 + invPhi;
        points.push({
            x: r * Math.cos(angle),
            y: r * Math.sin(angle)
        });
    }

    // Top land (arc at outside radius)
    const topAngle = toothThickAngle * 0.2; // approximate
    const lastPoint = points[points.length - 1];
    const topStartAngle = Math.atan2(lastPoint.y, lastPoint.x);

    // Mirror side (reverse the involute)
    const mirrorPoints = [];
    for (let i = 0; i <= numInvolutePoints; i++) {
        const t = (maxAngle * i) / numInvolutePoints;
        const r = baseRadius * Math.sqrt(1 + t * t);
        if (r > outsideRadius) break;

        const angle = -(t - Math.atan(t)) - toothThickAngle / 2 - invPhi;
        mirrorPoints.push({
            x: r * Math.cos(angle),
            y: r * Math.sin(angle)
        });
    }
    mirrorPoints.reverse();

    // Root fillet (simplified arc)
    const rootPoints = [];
    const filletRadius = 0.35 * mod;
    const rootStartAngle = Math.atan2(mirrorPoints[0].y, mirrorPoints[0].x);
    const rootEndAngle = rootStartAngle - (2 * Math.PI / numTeeth - 2 * toothThickAngle);

    for (let i = 0; i <= 5; i++) {
        const angle = rootStartAngle - (rootStartAngle - rootEndAngle) * (i / 5);
        rootPoints.push({
            x: rootRadius * Math.cos(angle),
            y: rootRadius * Math.sin(angle)
        });
    }

    return {
        involute: points,
        mirror: mirrorPoints,
        root: rootPoints,
        circles: {
            pitch: pitchRadius,
            base: baseRadius,
            outside: outsideRadius,
            root: rootRadius
        }
    };
}

/**
 * Generate complete gear outline for Three.js Shape
 * Returns array of [x, y] points forming a closed contour
 */
export function generateGearOutline(numTeeth, mod, pressureAngle = 20) {
    const phi = (pressureAngle * Math.PI) / 180;
    const pitchRadius = (numTeeth * mod) / 2;
    const baseRadius = pitchRadius * Math.cos(phi);
    const outsideRadius = pitchRadius + mod;
    const rootRadius = pitchRadius - 1.25 * mod;

    const toothAngle = (2 * Math.PI) / numTeeth;
    const toothThickAngle = toothAngle / 2;

    const outline = [];
    const involuteSteps = 12;

    for (let tooth = 0; tooth < numTeeth; tooth++) {
        const baseAngle = tooth * toothAngle;

        // Root start
        const rootStart = baseAngle - toothAngle * 0.45;
        outline.push([
            rootRadius * Math.cos(rootStart),
            rootRadius * Math.sin(rootStart)
        ]);

        // Fillet up to involute
        const filletAngle = baseAngle - toothThickAngle * 0.6;
        outline.push([
            (rootRadius + 0.3 * mod) * Math.cos(filletAngle),
            (rootRadius + 0.3 * mod) * Math.sin(filletAngle)
        ]);

        // Left involute (driving side)
        const maxRollAngle = Math.sqrt(Math.max(0, (outsideRadius * outsideRadius) / (baseRadius * baseRadius) - 1));
        for (let i = 0; i <= involuteSteps; i++) {
            const t = (maxRollAngle * i) / involuteSteps;
            const r = baseRadius * Math.sqrt(1 + t * t);
            if (r > outsideRadius) break;
            if (r < rootRadius + 0.3 * mod) continue;

            const invAngle = baseAngle - (t - Math.atan(t));
            outline.push([r * Math.cos(invAngle), r * Math.sin(invAngle)]);
        }

        // Tooth tip
        const tipAngle = baseAngle;
        outline.push([
            outsideRadius * Math.cos(tipAngle),
            outsideRadius * Math.sin(tipAngle)
        ]);

        // Right involute (coast side)
        for (let i = involuteSteps; i >= 0; i--) {
            const t = (maxRollAngle * i) / involuteSteps;
            const r = baseRadius * Math.sqrt(1 + t * t);
            if (r > outsideRadius) continue;
            if (r < rootRadius + 0.3 * mod) break;

            const invAngle = baseAngle + (t - Math.atan(t)) + toothThickAngle * 0.1;
            outline.push([r * Math.cos(invAngle), r * Math.sin(invAngle)]);
        }

        // Fillet down to root
        const filletAngle2 = baseAngle + toothThickAngle * 0.6;
        outline.push([
            (rootRadius + 0.3 * mod) * Math.cos(filletAngle2),
            (rootRadius + 0.3 * mod) * Math.sin(filletAngle2)
        ]);

        // Root land
        const rootEnd = baseAngle + toothAngle * 0.45;
        outline.push([
            rootRadius * Math.cos(rootEnd),
            rootRadius * Math.sin(rootEnd)
        ]);
    }

    return outline;
}

/**
 * Generate 3D gear mesh data (vertices, indices)
 * For use with Three.js BufferGeometry
 */
export function generateGear3DVertices(numTeeth, mod, faceWidth, pressureAngle = 20) {
    const outline = generateGearOutline(numTeeth, mod, pressureAngle);
    const halfWidth = faceWidth / 2;

    const vertices = [];
    const indices = [];

    // Create front face vertices
    for (const [x, y] of outline) {
        vertices.push(x, y, halfWidth);
    }

    // Create back face vertices
    for (const [x, y] of outline) {
        vertices.push(x, y, -halfWidth);
    }

    const n = outline.length;

    // Side faces (connect front to back)
    for (let i = 0; i < n; i++) {
        const next = (i + 1) % n;
        // Two triangles per quad
        indices.push(i, next, i + n);
        indices.push(next, next + n, i + n);
    }

    return { vertices: new Float32Array(vertices), indices: new Uint32Array(indices), outlinePoints: outline };
}

export default {
    generateInvolutePoints,
    generateToothProfile,
    generateGearOutline,
    generateGear3DVertices
};
