import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

/* ============================================================
   Gear profile geometry helpers
   ============================================================ */
function createGearShape(numTeeth, module, pressureAngle = 20) {
    const r_pitch = (numTeeth * module) / 2;
    const r_outer = r_pitch + module;
    const r_root = r_pitch - 1.25 * module;
    const r_base = r_pitch * Math.cos((pressureAngle * Math.PI) / 180);
    const shape = new THREE.Shape();

    const toothAngle = (2 * Math.PI) / numTeeth;
    const toothWidth = toothAngle * 0.35;

    for (let i = 0; i < numTeeth; i++) {
        const a = i * toothAngle;
        const a1 = a - toothWidth;
        const a2 = a + toothWidth;
        const aNext = (i + 1) * toothAngle - toothWidth;

        if (i === 0) {
            shape.moveTo(Math.cos(a1) * r_root, Math.sin(a1) * r_root);
        }
        // tooth rise
        shape.lineTo(Math.cos(a1) * r_base, Math.sin(a1) * r_base);
        shape.lineTo(Math.cos(a - toothWidth * 0.5) * r_outer, Math.sin(a - toothWidth * 0.5) * r_outer);
        shape.lineTo(Math.cos(a + toothWidth * 0.5) * r_outer, Math.sin(a + toothWidth * 0.5) * r_outer);
        shape.lineTo(Math.cos(a2) * r_base, Math.sin(a2) * r_base);
        // root
        shape.lineTo(Math.cos(a2) * r_root, Math.sin(a2) * r_root);
        // curve around root to next tooth
        const rootSteps = 3;
        for (let s = 1; s <= rootSteps; s++) {
            const ra = a2 + (aNext - a2) * (s / rootSteps);
            shape.lineTo(Math.cos(ra) * r_root, Math.sin(ra) * r_root);
        }
    }
    shape.closePath();

    // bore hole
    const boreRadius = r_root * 0.3;
    const borePath = new THREE.Path();
    borePath.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
    shape.holes.push(borePath);

    // Key-way slot
    const keyWidth = boreRadius * 0.4;
    const keyDepth = boreRadius * 0.2;
    const keySlot = new THREE.Path();
    keySlot.moveTo(-keyWidth / 2, boreRadius);
    keySlot.lineTo(-keyWidth / 2, boreRadius + keyDepth);
    keySlot.lineTo(keyWidth / 2, boreRadius + keyDepth);
    keySlot.lineTo(keyWidth / 2, boreRadius);
    shape.holes.push(keySlot);

    return { shape, r_pitch, r_outer, r_root };
}

/* ============================================================
   Animated Spur/Helical Gear Component
   ============================================================ */
function SpurGear({ numTeeth, module, faceWidth, position, color, rotationRef, helixAngle = 0, label }) {
    const meshRef = useRef();
    const { shape, r_pitch, r_outer } = useMemo(() => createGearShape(numTeeth, module), [numTeeth, module]);

    const fw = faceWidth || module * 10;
    const extrudeSettings = {
        depth: fw,
        bevelEnabled: true,
        bevelThickness: module * 0.2,
        bevelSize: module * 0.15,
        bevelSegments: 2,
        curveSegments: numTeeth * 4,
    };

    useFrame(() => {
        if (meshRef.current && rotationRef.current !== undefined) {
            meshRef.current.rotation.z = rotationRef.current;
            if (helixAngle !== 0) {
                // Slight twist for helical
                meshRef.current.rotation.x = Math.sin(rotationRef.current * 0.3) * 0.02;
            }
        }
    });

    return (
        <group position={position}>
            {/* Gear body */}
            <mesh ref={meshRef} castShadow receiveShadow position={[0, 0, -fw / 2]}>
                <extrudeGeometry args={[shape, extrudeSettings]} />
                <meshStandardMaterial
                    color={color}
                    metalness={0.85}
                    roughness={0.2}
                    envMapIntensity={1.2}
                />
            </mesh>
            {/* Pitch circle indicator */}
            <mesh rotation={[0, 0, 0]}>
                <ringGeometry args={[r_pitch - 0.1, r_pitch + 0.1, 64]} />
                <meshBasicMaterial color="#60a5fa" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
            {/* Label */}
            {label && (
                <Text position={[0, -r_outer - module * 2, 0]} fontSize={module * 1.8} color="#94a3b8"
                    anchorX="center" anchorY="middle" font={undefined}>
                    {label}
                </Text>
            )}
        </group>
    );
}

/* ============================================================
   Shaft Component
   ============================================================ */
function Shaft({ start, end, radius, color = '#4a5568' }) {
    const length = Math.sqrt(
        (end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2 + (end[2] - start[2]) ** 2
    );
    const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2];

    return (
        <mesh position={mid} castShadow>
            <cylinderGeometry args={[radius, radius, length, 32]} />
            <meshStandardMaterial color={color} metalness={0.9} roughness={0.15} />
        </mesh>
    );
}

/* ============================================================
   Bearing Component
   ============================================================ */
function Bearing({ position, innerRadius, outerRadius }) {
    return (
        <group position={position}>
            <mesh castShadow>
                <torusGeometry args={[(innerRadius + outerRadius) / 2, (outerRadius - innerRadius) / 2, 16, 48]} />
                <meshStandardMaterial color="#c0c0c0" metalness={0.95} roughness={0.1} />
            </mesh>
        </group>
    );
}

/* ============================================================
   Housing/Gearbox Shell Component
   ============================================================ */
function GearboxHousing({ width, height, depth, position = [0, 0, 0] }) {
    return (
        <group position={position}>
            <mesh receiveShadow>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial
                    color="#1a1a2e"
                    metalness={0.3}
                    roughness={0.6}
                    transparent
                    opacity={0.2}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {/* Housing edges */}
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
                <lineBasicMaterial color="#3b82f6" transparent opacity={0.4} />
            </lineSegments>
        </group>
    );
}

/* ============================================================
   Bevel Gear (cone-like)
   ============================================================ */
function BevelGear({ numTeeth, module, position, color, rotationRef, coneAngle = 45, label, rotAxis = 'z' }) {
    const meshRef = useRef();
    const { r_pitch } = useMemo(() => createGearShape(numTeeth, module), [numTeeth, module]);
    const r_outer = r_pitch + module;

    useFrame(() => {
        if (meshRef.current && rotationRef.current !== undefined) {
            if (rotAxis === 'z') meshRef.current.rotation.z = rotationRef.current;
            else if (rotAxis === 'x') meshRef.current.rotation.x = rotationRef.current;
            else meshRef.current.rotation.y = rotationRef.current;
        }
    });

    return (
        <group position={position}>
            <mesh ref={meshRef} castShadow receiveShadow>
                <coneGeometry args={[r_outer, r_outer * 0.6, numTeeth * 2, 1]} />
                <meshStandardMaterial color={color} metalness={0.85} roughness={0.2} />
            </mesh>
            {label && (
                <Text position={[0, -r_outer - module * 2, 0]} fontSize={module * 1.8} color="#94a3b8"
                    anchorX="center" anchorY="middle">
                    {label}
                </Text>
            )}
        </group>
    );
}

/* ============================================================
   Worm Drive Components
   ============================================================ */
function WormScrew({ length, radius, position, rotationRef, color }) {
    const meshRef = useRef();

    useFrame(() => {
        if (meshRef.current && rotationRef.current !== undefined) {
            meshRef.current.rotation.y = rotationRef.current;
        }
    });

    return (
        <group position={position} rotation={[0, 0, Math.PI / 2]}>
            <mesh ref={meshRef} castShadow>
                <cylinderGeometry args={[radius, radius, length, 32]} />
                <meshStandardMaterial color={color} metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Thread spiral indication */}
            <mesh ref={meshRef} castShadow>
                <torusGeometry args={[radius * 1.3, radius * 0.15, 8, 64, Math.PI * 6]} />
                <meshStandardMaterial color={color} metalness={0.85} roughness={0.2} />
            </mesh>
        </group>
    );
}

/* ============================================================
   Assembly Scene
   ============================================================ */
function AssemblyScene({ results, animating, speed }) {
    const pinionRef = useRef(0);
    const gearRef = useRef(0);

    const gearType = results?.gearType || 'spur';
    const geometry = results?.geometry || {};

    // Extract parameters with sensible defaults
    const N_p = geometry.N_p || geometry.N_w || 18;
    const N_g = geometry.N_g || 68;
    const mod = geometry.m || geometry.m_t || geometry.mod || 2;
    const fw = geometry.F || mod * 10;
    const m_G = geometry.m_G || N_g / N_p;

    const r_p = (N_p * mod) / 2;
    const r_g = (N_g * mod) / 2;
    const centerDist = r_p + r_g;

    // Scale factor to fit the scene nicely
    const maxR = Math.max(r_g + mod * 2, centerDist);
    const scaleFactor = 12 / maxR;

    const shaftRadius = r_p * 0.25 * scaleFactor;
    const shaftLen = fw * scaleFactor * 3;

    useFrame((_, delta) => {
        if (animating) {
            pinionRef.current += delta * speed * 1.5;
            gearRef.current -= (delta * speed * 1.5) / m_G;
        }
    });

    if (gearType === 'bevel') {
        const bevelScale = scaleFactor;
        return (
            <group scale={[bevelScale, bevelScale, bevelScale]}>
                {/* Pinion - vertical axis */}
                <BevelGear
                    numTeeth={N_p} module={mod}
                    position={[0, r_p * 0.3, 0]}
                    color="#4e7cff" rotationRef={pinionRef}
                    rotAxis="z" label={`Pinion ${N_p}T`}
                />
                {/* Gear - horizontal axis */}
                <group rotation={[Math.PI / 2, 0, 0]}>
                    <BevelGear
                        numTeeth={N_g} module={mod}
                        position={[0, -r_g * 0.3, 0]}
                        color="#ff4e6a" rotationRef={gearRef}
                        rotAxis="z" label={`Gear ${N_g}T`}
                    />
                </group>
                {/* Shafts */}
                <Shaft start={[0, -r_p * 2, 0]} end={[0, r_p * 2, 0]} radius={shaftRadius} />
                <Shaft start={[-r_g * 2, 0, 0]} end={[r_g * 2, 0, 0]} radius={shaftRadius} />
                {/* Housing */}
                <GearboxHousing width={centerDist * 2.5} height={centerDist * 2.5} depth={fw * 2} />
            </group>
        );
    }

    if (gearType === 'worm') {
        const wormScale = scaleFactor;
        const wormR = r_p * 0.8;
        return (
            <group scale={[wormScale, wormScale, wormScale]}>
                {/* Worm screw — rotates on horizontal axis */}
                <WormScrew
                    length={fw * 3} radius={wormR}
                    position={[0, r_g + wormR * 1.2, 0]}
                    rotationRef={pinionRef} color="#4e7cff"
                />
                {/* Worm gear */}
                <SpurGear
                    numTeeth={N_g} module={mod} faceWidth={fw}
                    position={[0, 0, 0]}
                    color="#ff4e6a" rotationRef={gearRef}
                    label={`Gear ${N_g}T`}
                />
                {/* Shafts */}
                <Shaft start={[0, r_g + wormR * 1.2, -fw * 2]} end={[0, r_g + wormR * 1.2, fw * 2]} radius={shaftRadius} />
                <Shaft start={[0, -r_g * 1.5, 0]} end={[0, r_g * 0.5, 0]} radius={shaftRadius} />
                {/* Housing */}
                <GearboxHousing width={r_g * 3} height={(r_g + wormR) * 3} depth={fw * 4} />
            </group>
        );
    }

    // Spur / Helical (default)
    const helixAngle = gearType === 'helical' ? (geometry.helixAngle || 25) : 0;

    return (
        <group scale={[scaleFactor, scaleFactor, scaleFactor]}>
            {/* Pinion */}
            <SpurGear
                numTeeth={N_p} module={mod} faceWidth={fw}
                position={[-centerDist / 2, 0, 0]}
                color="#4e7cff" rotationRef={pinionRef}
                helixAngle={helixAngle}
                label={`Pinion ${N_p}T`}
            />
            {/* Gear */}
            <SpurGear
                numTeeth={N_g} module={mod} faceWidth={fw}
                position={[centerDist / 2, 0, 0]}
                color="#ff4e6a" rotationRef={gearRef}
                helixAngle={helixAngle}
                label={`Gear ${N_g}T`}
            />

            {/* Input Shaft */}
            <Shaft
                start={[-centerDist / 2, 0, -shaftLen]}
                end={[-centerDist / 2, 0, shaftLen]}
                radius={shaftRadius}
            />
            {/* Output Shaft */}
            <Shaft
                start={[centerDist / 2, 0, -shaftLen]}
                end={[centerDist / 2, 0, shaftLen]}
                radius={shaftRadius}
            />

            {/* Bearings */}
            <Bearing
                position={[-centerDist / 2, 0, fw * 0.8]}
                innerRadius={shaftRadius * 0.8}
                outerRadius={shaftRadius * 2}
            />
            <Bearing
                position={[-centerDist / 2, 0, -fw * 0.8]}
                innerRadius={shaftRadius * 0.8}
                outerRadius={shaftRadius * 2}
            />
            <Bearing
                position={[centerDist / 2, 0, fw * 0.8]}
                innerRadius={shaftRadius * 0.8}
                outerRadius={shaftRadius * 2}
            />
            <Bearing
                position={[centerDist / 2, 0, -fw * 0.8]}
                innerRadius={shaftRadius * 0.8}
                outerRadius={shaftRadius * 2}
            />

            {/* Gearbox Housing (transparent) */}
            <GearboxHousing
                width={centerDist + r_g * 2 + mod * 4}
                height={r_g * 2 + mod * 6}
                depth={fw * 3}
            />
        </group>
    );
}

/* ============================================================
   Info HUD overlay
   ============================================================ */
function InfoHUD({ results }) {
    if (!results) return null;
    const g = results.geometry || {};
    const p = results.performance || {};
    const sf = results.safetyFactors || {};

    const items = [];
    if (g.m_G) items.push(`Ratio: ${g.m_G.toFixed(2)}:1`);
    if (g.N_p || g.N_w) items.push(`Teeth: ${g.N_p || g.N_w} / ${g.N_g}`);
    if (g.C) items.push(`CD: ${g.C.toFixed(1)} mm`);
    if (p.efficiency) items.push(`η: ${(p.efficiency * 100).toFixed(1)}%`);
    if (sf.overall_pass !== undefined) items.push(sf.overall_pass ? '✅ PASS' : '❌ FAIL');

    return (
        <div style={{
            position: 'absolute', top: 12, right: 12, zIndex: 20,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
            borderRadius: 10, padding: '10px 14px',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 12, color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace',
            display: 'flex', flexDirection: 'column', gap: 3
        }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#60a5fa', marginBottom: 4 }}>
                ⚙️ {(results.gearType || 'spur').charAt(0).toUpperCase() + (results.gearType || 'spur').slice(1)} Assembly
            </div>
            {items.map((item, i) => <div key={i}>{item}</div>)}
        </div>
    );
}

/* ============================================================
   Main GearVisualizer Component
   ============================================================ */
export default function GearVisualizer({ results }) {
    const [animating, setAnimating] = useState(true);
    const [speed, setSpeed] = useState(1.0);
    const [viewMode, setViewMode] = useState('assembly'); // assembly | exploded

    const gearType = results?.gearType || 'spur';

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 80px)', position: 'relative' }}>
            <InfoHUD results={results} />

            <Canvas shadows style={{ width: '100%', height: '100%', borderRadius: 12, background: '#0a0e1a' }}>
                <PerspectiveCamera makeDefault position={[0, 8, 25]} fov={45} />
                <ambientLight intensity={0.35} />
                <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow shadow-mapSize={2048} />
                <directionalLight position={[-8, 10, -5]} intensity={0.4} />
                <pointLight position={[0, 10, 0]} intensity={0.3} color="#60a5fa" />

                <AssemblyScene results={results} animating={animating} speed={speed} />

                <ContactShadows position={[0, -8, 0]} scale={40} blur={2} opacity={0.4} />
                <gridHelper args={[40, 40, '#1e293b', '#0f172a']} position={[0, -8, 0]} />

                <OrbitControls
                    enablePan enableZoom enableRotate
                    minDistance={5} maxDistance={80}
                    autoRotate={!animating ? true : false}
                    autoRotateSpeed={0.5}
                />
                <Environment preset="city" />
            </Canvas>

            {/* Controls Bar */}
            <div style={{
                position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 8, padding: '10px 16px',
                background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(16px)',
                borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', zIndex: 10,
                alignItems: 'center'
            }}>
                <button onClick={() => setAnimating(!animating)}
                    style={btnStyle(animating)}>
                    {animating ? '⏸ Pause' : '▶ Play'}
                </button>
                <button onClick={() => setSpeed(Math.max(0.1, speed - 0.3))} style={btnStyle()}>🐢 Slower</button>
                <button onClick={() => setSpeed(Math.min(5, speed + 0.3))} style={btnStyle()}>🐇 Faster</button>
                <button onClick={() => { setSpeed(1); setAnimating(true); }} style={btnStyle()}>🔄 Reset</button>
                <div style={{
                    color: '#94a3b8', fontSize: 12, fontFamily: 'JetBrains Mono',
                    padding: '0 8px', borderLeft: '1px solid rgba(255,255,255,0.1)'
                }}>
                    Speed: {speed.toFixed(1)}×
                </div>
                <div style={{
                    color: '#60a5fa', fontSize: 12, fontWeight: 600,
                    padding: '0 8px', borderLeft: '1px solid rgba(255,255,255,0.1)'
                }}>
                    {gearType.toUpperCase()}
                </div>
            </div>
        </div>
    );
}

function btnStyle(active = false) {
    return {
        padding: '6px 14px', border: 'none',
        background: active ? '#3b82f6' : 'rgba(255,255,255,0.06)',
        color: active ? '#fff' : '#94a3b8',
        borderRadius: 6, cursor: 'pointer',
        fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
        transition: 'all 0.15s ease',
    };
}
