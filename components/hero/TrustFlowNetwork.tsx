"use client";

import * as THREE from "three";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

type Props = { className?: string };

type Connection = {
    a: number; // client node index
    b: number; // pro node index
    t0: number; // start time
    phase: "fadeIn" | "hold" | "fadeOut";
};

const COLORS = {
    bg: "#0B1C2D",
    emerald: "#1BC47D",
    emerald2: "#21D19F",
    text: "#E6EDF3",
    blue: "#3B82F6",
    white: "#FFFFFF",
};

function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onChange = () => setReduced(mq.matches);
        onChange();
        mq.addEventListener?.("change", onChange);
        return () => mq.removeEventListener?.("change", onChange);
    }, []);
    return reduced;
}

function useIsSmallScreen() {
    const [small, setSmall] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        const onChange = () => setSmall(mq.matches);
        onChange();
        mq.addEventListener?.("change", onChange);
        return () => mq.removeEventListener?.("change", onChange);
    }, []);
    return small;
}

export default function TrustFlowNetwork({ className }: Props) {
    const reducedMotion = usePrefersReducedMotion();
    const small = useIsSmallScreen();

    // Mobile / reduced-motion fallback: no WebGL
    if (reducedMotion || small) {
        return (
            <div
                className={className}
                style={{
                    background:
                        "radial-gradient(1200px 420px at 50% 45%, rgba(27,196,125,0.18), rgba(11,28,45,0.0) 55%), radial-gradient(900px 380px at 20% 40%, rgba(59,130,246,0.12), rgba(11,28,45,0.0) 60%), #0B1C2D",
                }}
            />
        );
    }

    return (
        <div className={className}>
            <Canvas
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                camera={{ position: [0, 0, 10], fov: 45, near: 0.1, far: 100 }}
            >
                <Scene />
            </Canvas>
        </div>
    );
}

function Scene() {
    // TUNING CONSTANTS
    const NODE_COUNT = 150;
    const CLIENT_RATIO = 0.55; // rest are pros
    const ACTIVE_CONNECTIONS = 10;
    const PARTICLES_PER_CONNECTION = 16;

    const LOOP_SECONDS = 12.0; // connections refresh
    const FADE_IN = 1.1;
    const HOLD = 8.4;
    const FADE_OUT = 1.5;

    const DRIFT = 0.12; // node drift speed
    const MONEY_SPEED = 0.55; // base particle speed
    const MONEY_SPEED_LOCKED = 0.78;

    const groupRef = useRef<THREE.Group>(null);

    // Precompute nodes
    const nodes = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        const radius = 6.0;
        for (let i = 0; i < NODE_COUNT; i++) {
            // distribute in a loose sphere
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            const r = radius * (0.35 + Math.random() * 0.65);
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta) * 0.65;
            const z = r * Math.cos(phi) * 0.75;
            pts.push(new THREE.Vector3(x, y, z));
        }

        const clients = Math.floor(NODE_COUNT * CLIENT_RATIO);
        const clientIdx = Array.from({ length: clients }, (_, i) => i);
        const proIdx = Array.from({ length: NODE_COUNT - clients }, (_, i) => i + clients);

        // Add a small velocity for drift
        const vel = pts.map(
            () =>
                new THREE.Vector3(
                    (Math.random() - 0.5) * DRIFT,
                    (Math.random() - 0.5) * DRIFT * 0.7,
                    (Math.random() - 0.5) * DRIFT * 0.8
                )
        );

        return { pts, vel, clientIdx, proIdx };
    }, []);

    // Instanced meshes refs
    const clientNodesRef = useRef<THREE.InstancedMesh>(null);
    const proNodesRef = useRef<THREE.InstancedMesh>(null);
    const linesRef = useRef<THREE.LineSegments>(null);
    const particlesRef = useRef<THREE.InstancedMesh>(null);

    // Contract + lock refs (small count)
    const contractRefs = useRef<THREE.Mesh[]>([]);
    const lockRefs = useRef<THREE.Sprite[]>([]);

    const lockTexture = useMemo(() => makeLockTexture(), []);

    // Connections state (mutable ref for performance)
    const connectionsRef = useRef<Connection[]>([]);
    const timeRef = useRef(0);

    // Create initial connections
    useEffect(() => {
        const mk = () => {
            const list: Connection[] = [];
            for (let i = 0; i < ACTIVE_CONNECTIONS; i++) {
                const a = nodes.clientIdx[Math.floor(Math.random() * nodes.clientIdx.length)];
                const b = nodes.proIdx[Math.floor(Math.random() * nodes.proIdx.length)];
                list.push({ a, b, t0: 0, phase: "fadeIn" });
            }
            return list;
        };
        connectionsRef.current = mk();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Build instancing once
    useEffect(() => {
        // Clients instancing
        if (clientNodesRef.current) {
            const mesh = clientNodesRef.current;
            const dummy = new THREE.Object3D();
            for (let i = 0; i < nodes.clientIdx.length; i++) {
                const idx = nodes.clientIdx[i];
                dummy.position.copy(nodes.pts[idx]);
                dummy.scale.setScalar(0.09);
                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);
            }
            mesh.instanceMatrix.needsUpdate = true;
        }

        // Pros instancing
        if (proNodesRef.current) {
            const mesh = proNodesRef.current;
            const dummy = new THREE.Object3D();
            for (let i = 0; i < nodes.proIdx.length; i++) {
                const idx = nodes.proIdx[i];
                dummy.position.copy(nodes.pts[idx]);
                dummy.scale.setScalar(0.10);
                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);
            }
            mesh.instanceMatrix.needsUpdate = true;
        }

        // Lines geometry placeholder (will be filled per frame)
        if (linesRef.current) {
            const geom = new THREE.BufferGeometry();
            // each connection -> 2 points
            const pos = new Float32Array(ACTIVE_CONNECTIONS * 2 * 3);
            geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
            linesRef.current.geometry = geom;
        }

        // Particles instancing placeholder
        if (particlesRef.current) {
            const total = ACTIVE_CONNECTIONS * PARTICLES_PER_CONNECTION;
            particlesRef.current.count = total;
            particlesRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        }
    }, [nodes]);

    // Helper: re-roll connections
    const rerollConnections = (now: number) => {
        const list: Connection[] = [];
        for (let i = 0; i < ACTIVE_CONNECTIONS; i++) {
            const a = nodes.clientIdx[Math.floor(Math.random() * nodes.clientIdx.length)];
            const b = nodes.proIdx[Math.floor(Math.random() * nodes.proIdx.length)];
            list.push({ a, b, t0: now, phase: "fadeIn" });
        }
        connectionsRef.current = list;
    };

    // Animation loop
    useFrame((state, delta) => {
        timeRef.current += delta;
        const now = timeRef.current;

        // Camera: slow premium orbit
        const cam = state.camera;
        const t = now * 0.08;
        cam.position.x = Math.sin(t) * 0.9;
        cam.position.y = Math.sin(t * 0.7) * 0.35;
        cam.position.z = 10.0 + Math.cos(t) * 0.35;
        cam.lookAt(0, 0, 0);

        // drift nodes a tiny bit inside bounds
        const bounds = 6.2;
        for (let i = 0; i < nodes.pts.length; i++) {
            const p = nodes.pts[i];
            const v = nodes.vel[i];
            p.addScaledVector(v, delta);

            // bounce softly
            if (Math.abs(p.x) > bounds) v.x *= -1;
            if (Math.abs(p.y) > bounds * 0.7) v.y *= -1;
            if (Math.abs(p.z) > bounds * 0.8) v.z *= -1;
        }

        // Update node instance matrices (cheap enough for 150)
        {
            const dummy = new THREE.Object3D();
            if (clientNodesRef.current) {
                const mesh = clientNodesRef.current;
                for (let i = 0; i < nodes.clientIdx.length; i++) {
                    const idx = nodes.clientIdx[i];
                    dummy.position.copy(nodes.pts[idx]);
                    dummy.scale.setScalar(0.09);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(i, dummy.matrix);
                }
                mesh.instanceMatrix.needsUpdate = true;
            }
            if (proNodesRef.current) {
                const mesh = proNodesRef.current;
                for (let i = 0; i < nodes.proIdx.length; i++) {
                    const idx = nodes.proIdx[i];
                    dummy.position.copy(nodes.pts[idx]);
                    dummy.scale.setScalar(0.10);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(i, dummy.matrix);
                }
                mesh.instanceMatrix.needsUpdate = true;
            }
        }

        // Loop: refresh connections every LOOP_SECONDS
        if (now % LOOP_SECONDS < delta) rerollConnections(now);

        const conns = connectionsRef.current;

        // Update connection phases and compute alpha
        const alphas: number[] = [];
        for (let i = 0; i < conns.length; i++) {
            const c = conns[i];
            const age = now - c.t0;

            let alpha = 1;
            if (age < FADE_IN) {
                c.phase = "fadeIn";
                alpha = smooth01(age / FADE_IN);
            } else if (age < FADE_IN + HOLD) {
                c.phase = "hold";
                alpha = 1;
            } else {
                c.phase = "fadeOut";
                alpha = 1 - smooth01((age - (FADE_IN + HOLD)) / FADE_OUT);
            }
            alphas.push(clamp(alpha, 0, 1));
        }

        // Update lines geometry positions + opacity
        if (linesRef.current) {
            const geom = linesRef.current.geometry as THREE.BufferGeometry;
            const attr = geom.getAttribute("position") as THREE.BufferAttribute;

            for (let i = 0; i < conns.length; i++) {
                const { a, b } = conns[i];
                const pa = nodes.pts[a];
                const pb = nodes.pts[b];

                const base = i * 2 * 3;
                attr.array[base + 0] = pa.x;
                attr.array[base + 1] = pa.y;
                attr.array[base + 2] = pa.z;

                attr.array[base + 3] = pb.x;
                attr.array[base + 4] = pb.y;
                attr.array[base + 5] = pb.z;
            }
            attr.needsUpdate = true;

            // line material alpha
            const mat = linesRef.current.material as THREE.LineBasicMaterial;
            mat.opacity = 0.55; // base; per-connection alpha handled visually by contract/particles
        }

        // Update contracts & locks
        for (let i = 0; i < conns.length; i++) {
            const c = conns[i];
            const a = nodes.pts[c.a];
            const b = nodes.pts[c.b];
            const mid = tmpV1.copy(a).lerp(b, 0.5);

            const alpha = alphas[i];

            const cube = contractRefs.current[i];
            const lock = lockRefs.current[i];

            if (cube) {
                cube.position.copy(mid);
                // Pulse once near end of fadeIn
                const age = now - c.t0;
                const pulse = age < 1.6 ? 1 + Math.sin(age * 10) * 0.08 : 1;
                cube.scale.setScalar(0.22 * pulse);
                (cube.material as THREE.MeshStandardMaterial).opacity = 0.85 * alpha;
                cube.visible = alpha > 0.02;
            }

            if (lock) {
                lock.position.copy(tmpV2.copy(mid).add(new THREE.Vector3(0.0, 0.28, 0.0)));
                const age = now - c.t0;
                // lock appears after contract created (slight delay)
                const lockAlpha = alpha * smooth01((age - 0.35) / 0.6);
                (lock.material as THREE.SpriteMaterial).opacity = clamp(lockAlpha, 0, 1);
                lock.visible = lockAlpha > 0.02;
                lock.scale.set(0.55, 0.55, 1);
            }
        }

        // Update particles (instanced)
        if (particlesRef.current) {
            const mesh = particlesRef.current;
            const dummy = new THREE.Object3D();

            let k = 0;
            for (let i = 0; i < conns.length; i++) {
                const c = conns[i];
                const a = nodes.pts[c.a];
                const b = nodes.pts[c.b];
                const alpha = alphas[i];

                const age = now - c.t0;
                const locked = age > 0.35; // after lock starts
                const speed = locked ? MONEY_SPEED_LOCKED : MONEY_SPEED;

                for (let j = 0; j < PARTICLES_PER_CONNECTION; j++) {
                    // Each particle has its own phase offset
                    const phase = (j / PARTICLES_PER_CONNECTION) * 1.0;
                    const prog = (now * speed + phase) % 1.0;

                    // Travel from A->mid->B (ease around midpoint)
                    const p = travelTwoSegment(a, b, prog);

                    // Make them subtle and not too big
                    const s = 0.045;

                    dummy.position.copy(p);
                    dummy.scale.setScalar(s);

                    // Tiny flicker variation
                    dummy.rotation.set(0, 0, (now + j) * 0.6);

                    dummy.updateMatrix();
                    mesh.setMatrixAt(k, dummy.matrix);
                    k++;
                }

                // Fade particle material globally; per-connection alpha in visibility via opacity
                const mat = mesh.material as THREE.MeshBasicMaterial;
                mat.opacity = 0.70 * alpha;
            }

            mesh.instanceMatrix.needsUpdate = true;
        }

        // Subtle group parallax
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(now * 0.05) * 0.08;
            groupRef.current.rotation.x = Math.sin(now * 0.04) * 0.05;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Ambient feel */}
            <ambientLight intensity={0.85} />
            <directionalLight position={[3, 2, 6]} intensity={0.65} />
            <fog attach="fog" args={[COLORS.bg, 8, 18]} />

            {/* Clients nodes (instanced) */}
            <instancedMesh ref={clientNodesRef} args={[undefined, undefined, nodes.clientIdx.length]}>
                <sphereGeometry args={[1, 12, 12]} />
                <meshStandardMaterial
                    color={COLORS.blue}
                    emissive={COLORS.blue}
                    emissiveIntensity={0.35}
                    roughness={0.25}
                    metalness={0.05}
                />
            </instancedMesh>

            {/* Pros nodes (instanced) */}
            <instancedMesh ref={proNodesRef} args={[undefined, undefined, nodes.proIdx.length]}>
                <sphereGeometry args={[1, 12, 12]} />
                <meshStandardMaterial
                    color={COLORS.emerald}
                    emissive={COLORS.emerald}
                    emissiveIntensity={0.55}
                    roughness={0.2}
                    metalness={0.1}
                />
            </instancedMesh>

            {/* Connection lines */}
            <lineSegments ref={linesRef}>
                <lineBasicMaterial color={COLORS.white} transparent opacity={0.55} depthWrite={false} />
            </lineSegments>

            {/* Contract blocks + lock icons (one per connection) */}
            {Array.from({ length: ACTIVE_CONNECTIONS }).map((_, i) => (
                <React.Fragment key={i}>
                    <mesh
                        ref={(el) => {
                            if (el) contractRefs.current[i] = el;
                        }}
                        position={[0, 0, 0]}
                    >
                        <boxGeometry args={[1, 1, 1]} />
                        <meshStandardMaterial
                            color={COLORS.white}
                            emissive={COLORS.white}
                            emissiveIntensity={0.25}
                            transparent
                            opacity={0.85}
                            roughness={0.15}
                            metalness={0.05}
                        />
                    </mesh>

                    <sprite
                        ref={(el) => {
                            if (el) lockRefs.current[i] = el as unknown as THREE.Sprite;
                        }}
                        position={[0, 0, 0]}
                        scale={[0.55, 0.55, 1]}
                    >
                        <spriteMaterial
                            transparent
                            opacity={0}
                            depthWrite={false}
                            map={lockTexture}
                            color={COLORS.emerald2}
                        />
                    </sprite>
                </React.Fragment>
            ))}

            {/* Money particles (instanced) */}
            <instancedMesh
                ref={particlesRef}
                args={[undefined, undefined, ACTIVE_CONNECTIONS * PARTICLES_PER_CONNECTION]}
            >
                <sphereGeometry args={[1, 8, 8]} />
                <meshBasicMaterial color={COLORS.emerald2} transparent opacity={0.7} depthWrite={false} />
            </instancedMesh>
        </group>
    );
}

/* ----------------------------- helpers ----------------------------- */

const tmpV1 = new THREE.Vector3();
const tmpV2 = new THREE.Vector3();

function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v));
}

function smooth01(t: number) {
    const x = clamp(t, 0, 1);
    return x * x * (3 - 2 * x);
}

// Travel A -> midpoint -> B, smoothly
function travelTwoSegment(a: THREE.Vector3, b: THREE.Vector3, t: number) {
    const mid = tmpV1.copy(a).lerp(b, 0.5);
    if (t < 0.5) {
        const tt = smooth01(t / 0.5);
        return tmpV2.copy(a).lerp(mid, tt);
    }
    const tt = smooth01((t - 0.5) / 0.5);
    return tmpV2.copy(mid).lerp(b, tt);
}

// Procedural lock icon texture (no heavy assets)
function makeLockTexture() {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    ctx.clearRect(0, 0, size, size);

    // Draw lock outline
    ctx.lineWidth = 10;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "white";

    // Shackle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2 - 14, 26, Math.PI, 0);
    ctx.stroke();

    // Body
    ctx.beginPath();
    const bodyX = size / 2 - 34;
    const bodyY = size / 2 - 4;
    const bodyW = 68;
    const bodyH = 56;
    roundRect(ctx, bodyX, bodyY, bodyW, bodyH, 16);
    ctx.stroke();

    // Keyhole dot
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2 + 18, 7, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}
