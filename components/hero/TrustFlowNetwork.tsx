"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const MAX_NODES = 120;
const MAX_CONNECTIONS = 12;
const PARTICLES_PER_CONNECTION = 10;
const BOUNDS = 6;

const CLIENT_COLOR = new THREE.Color("#3B82F6");
const PRO_COLOR = new THREE.Color("#1BC47D");
const CONTRACT_COLOR = new THREE.Color("#FFFFFF");
const LINE_BASE_COLOR = new THREE.Color("#FFFFFF");
const PARTICLE_COLOR = new THREE.Color("#1BC47D");

const createLockTexture = () => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return new THREE.CanvasTexture(canvas);
    }
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(27, 196, 125, 0.95)";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2 - 12, 28, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = "rgba(27, 196, 125, 0.95)";
    ctx.fillRect(size / 2 - 28, size / 2 - 6, 56, 46);
    ctx.clearRect(size / 2 - 16, size / 2 + 10, 32, 22);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
};

type Connection = {
    active: boolean;
    clientIndex: number;
    proIndex: number;
    startTime: number;
    duration: number;
    lockDelay: number;
};

type Particle = {
    connectionIndex: number;
    offset: number;
    speed: number;
};

function TrustFlowScene({ reducedMotion }: { reducedMotion: boolean }) {
    const nodeMesh = useRef<THREE.InstancedMesh>(null);
    const contractMesh = useRef<THREE.InstancedMesh>(null);
    const lineGeometry = useRef<THREE.BufferGeometry>(null);
    const particleGeometry = useRef<THREE.BufferGeometry>(null);
    const lockSprites = useRef<THREE.Sprite[]>([]);

    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const lockTexture = useMemo(() => createLockTexture(), []);
    const lockMaterials = useMemo(
        () =>
            Array.from(
                { length: MAX_CONNECTIONS },
                () =>
                    new THREE.SpriteMaterial({
                        map: lockTexture,
                        color: "#1BC47D",
                        transparent: true,
                        opacity: 0,
                    })
            ),
        [lockTexture]
    );
    const midpoints = useMemo(
        () => Array.from({ length: MAX_CONNECTIONS }, () => new THREE.Vector3()),
        []
    );

    const nodes = useMemo(() => {
        const positions = Array.from({ length: MAX_NODES }, () =>
            new THREE.Vector3(
                THREE.MathUtils.randFloatSpread(BOUNDS * 2),
                THREE.MathUtils.randFloatSpread(BOUNDS * 1.6),
                THREE.MathUtils.randFloatSpread(BOUNDS * 1.2)
            )
        );
        const velocities = positions.map(
            () =>
                new THREE.Vector3(
                    THREE.MathUtils.randFloatSpread(0.02),
                    THREE.MathUtils.randFloatSpread(0.02),
                    THREE.MathUtils.randFloatSpread(0.02)
                )
        );
        const types = positions.map((_, index) => (index < MAX_NODES / 2 ? "client" : "pro"));
        return { positions, velocities, types };
    }, []);

    const connections = useRef<Connection[]>(
        Array.from({ length: MAX_CONNECTIONS }, () => ({
            active: false,
            clientIndex: 0,
            proIndex: 0,
            startTime: 0,
            duration: 0,
            lockDelay: 0,
        }))
    );

    const particles = useMemo<Particle[]>(
        () =>
            Array.from({ length: MAX_CONNECTIONS * PARTICLES_PER_CONNECTION }, (_, index) => ({
                connectionIndex: Math.floor(index / PARTICLES_PER_CONNECTION),
                offset: Math.random(),
                speed: THREE.MathUtils.randFloat(0.08, 0.14),
            })),
        []
    );

    const linePositions = useMemo(
        () => new Float32Array(MAX_CONNECTIONS * 2 * 3),
        []
    );
    const lineColors = useMemo(
        () => new Float32Array(MAX_CONNECTIONS * 2 * 3),
        []
    );
    const particlePositions = useMemo(
        () => new Float32Array(MAX_CONNECTIONS * PARTICLES_PER_CONNECTION * 3),
        []
    );

    const spawnTimer = useRef(0);

    useEffect(() => {
        if (!nodeMesh.current) return;
        nodes.positions.forEach((position, index) => {
            tempObject.position.copy(position);
            tempObject.scale.setScalar(nodes.types[index] === "client" ? 0.18 : 0.22);
            tempObject.updateMatrix();
            nodeMesh.current?.setMatrixAt(index, tempObject.matrix);
            nodeMesh.current?.setColorAt(index, nodes.types[index] === "client" ? CLIENT_COLOR : PRO_COLOR);
        });
        nodeMesh.current.instanceMatrix.needsUpdate = true;
        if (nodeMesh.current.instanceColor) {
            nodeMesh.current.instanceColor.needsUpdate = true;
        }
    }, [nodes, tempObject]);

    useEffect(() => {
        if (!particleGeometry.current) return;
        particleGeometry.current.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    }, [particlePositions]);

    useEffect(() => {
        if (!lineGeometry.current) return;
        lineGeometry.current.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
        lineGeometry.current.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));
    }, [linePositions, lineColors]);

    useFrame(({ clock, camera }) => {
        if (reducedMotion) return;
        const elapsed = clock.getElapsedTime();
        camera.position.x = Math.sin(elapsed * 0.08) * 1.8;
        camera.position.y = Math.sin(elapsed * 0.05) * 1.2;
        camera.position.z = 12;
        camera.lookAt(0, 0, 0);

        nodes.positions.forEach((position, index) => {
            position.add(nodes.velocities[index]);
            ["x", "y", "z"].forEach((axis) => {
                const limit = axis === "y" ? BOUNDS * 0.75 : BOUNDS;
                const value = position[axis as "x" | "y" | "z"];
                if (value > limit || value < -limit) {
                    nodes.velocities[index][axis as "x" | "y" | "z"] *= -1;
                    position[axis as "x" | "y" | "z"] = THREE.MathUtils.clamp(value, -limit, limit);
                }
            });
        });

        nodes.positions.forEach((position, index) => {
            tempObject.position.copy(position);
            tempObject.scale.setScalar(nodes.types[index] === "client" ? 0.18 : 0.22);
            tempObject.updateMatrix();
            nodeMesh.current?.setMatrixAt(index, tempObject.matrix);
        });
        if (nodeMesh.current) {
            nodeMesh.current.instanceMatrix.needsUpdate = true;
        }

        if (elapsed > spawnTimer.current) {
            const available = connections.current.find((connection) => !connection.active);
            if (available) {
                const clientIndex = THREE.MathUtils.randInt(0, MAX_NODES / 2 - 1);
                const proIndex = THREE.MathUtils.randInt(MAX_NODES / 2, MAX_NODES - 1);
                available.active = true;
                available.clientIndex = clientIndex;
                available.proIndex = proIndex;
                available.startTime = elapsed;
                available.duration = THREE.MathUtils.randFloat(10, 15);
                available.lockDelay = THREE.MathUtils.randFloat(1.2, 2.4);
            }
            spawnTimer.current = elapsed + THREE.MathUtils.randFloat(1.5, 2.8);
        }

        const activeConnections = connections.current;

        for (let index = 0; index < MAX_CONNECTIONS; index += 1) {
            const connection = activeConnections[index];
            const lineIndex = index * 6;
            if (!connection.active) {
                linePositions[lineIndex] = 0;
                linePositions[lineIndex + 1] = 0;
                linePositions[lineIndex + 2] = 0;
                linePositions[lineIndex + 3] = 0;
                linePositions[lineIndex + 4] = 0;
                linePositions[lineIndex + 5] = 0;
                lineColors.fill(0, lineIndex, lineIndex + 6);
                if (contractMesh.current) {
                    tempObject.position.set(0, 0, 0);
                    tempObject.scale.setScalar(0.0001);
                    tempObject.updateMatrix();
                    contractMesh.current.setMatrixAt(index, tempObject.matrix);
                }
                if (lockSprites.current[index]) {
                    lockSprites.current[index].material.opacity = 0;
                }
                continue;
            }

            const age = elapsed - connection.startTime;
            if (age > connection.duration) {
                connection.active = false;
                linePositions[lineIndex] = 0;
                linePositions[lineIndex + 1] = 0;
                linePositions[lineIndex + 2] = 0;
                linePositions[lineIndex + 3] = 0;
                linePositions[lineIndex + 4] = 0;
                linePositions[lineIndex + 5] = 0;
                lineColors.fill(0, lineIndex, lineIndex + 6);
                if (contractMesh.current) {
                    tempObject.position.set(0, 0, 0);
                    tempObject.scale.setScalar(0.0001);
                    tempObject.updateMatrix();
                    contractMesh.current.setMatrixAt(index, tempObject.matrix);
                }
                if (lockSprites.current[index]) {
                    lockSprites.current[index].material.opacity = 0;
                }
                continue;
            }

            const fadeIn = THREE.MathUtils.smoothstep(age, 0, 1.2);
            const fadeOut = THREE.MathUtils.smoothstep(connection.duration - age, 0, 1.6);
            const intensity = fadeIn * fadeOut;
            const clientPos = nodes.positions[connection.clientIndex];
            const proPos = nodes.positions[connection.proIndex];
            midpoints[index].copy(clientPos).add(proPos).multiplyScalar(0.5);

            linePositions[lineIndex] = clientPos.x;
            linePositions[lineIndex + 1] = clientPos.y;
            linePositions[lineIndex + 2] = clientPos.z;
            linePositions[lineIndex + 3] = proPos.x;
            linePositions[lineIndex + 4] = proPos.y;
            linePositions[lineIndex + 5] = proPos.z;

            for (let i = 0; i < 2; i += 1) {
                const colorIndex = lineIndex + i * 3;
                lineColors[colorIndex] = LINE_BASE_COLOR.r * intensity;
                lineColors[colorIndex + 1] = LINE_BASE_COLOR.g * intensity;
                lineColors[colorIndex + 2] = LINE_BASE_COLOR.b * intensity;
            }

            if (contractMesh.current) {
                const pulse = age < 1.2 ? 1 + Math.sin(age * Math.PI) * 0.25 : 1;
                tempObject.position.copy(midpoints[index]);
                tempObject.scale.setScalar(0.32 * pulse * intensity);
                tempObject.updateMatrix();
                contractMesh.current.setMatrixAt(index, tempObject.matrix);
            }

            if (lockSprites.current[index]) {
                const lockVisible = age > connection.lockDelay;
                const lockOpacity = lockVisible ? THREE.MathUtils.smoothstep(age - connection.lockDelay, 0, 1) : 0;
                lockSprites.current[index].position.copy(midpoints[index]).add(new THREE.Vector3(0.3, 0.3, 0));
                lockSprites.current[index].material.opacity = lockOpacity * intensity;
            }
        }

        const particleCount = MAX_CONNECTIONS * PARTICLES_PER_CONNECTION;
        for (let i = 0; i < particleCount; i += 1) {
            const particle = particles[i];
            const connection = activeConnections[particle.connectionIndex];
            const baseIndex = i * 3;
            if (!connection.active) {
                particlePositions[baseIndex] = 1000;
                particlePositions[baseIndex + 1] = 1000;
                particlePositions[baseIndex + 2] = 1000;
                continue;
            }
            const age = elapsed - connection.startTime;
            const clientPos = nodes.positions[connection.clientIndex];
            const proPos = nodes.positions[connection.proIndex];
            const midpoint = midpoints[particle.connectionIndex];
            const lockVisible = age > connection.lockDelay;
            const speedMultiplier = lockVisible ? 1.25 : 0.75;
            const progress = (elapsed * particle.speed * speedMultiplier + particle.offset) % 1;
            const segmentProgress = progress < 0.5 ? progress * 2 : (progress - 0.5) * 2;
            if (progress < 0.5) {
                particlePositions[baseIndex] = THREE.MathUtils.lerp(clientPos.x, midpoint.x, segmentProgress);
                particlePositions[baseIndex + 1] = THREE.MathUtils.lerp(clientPos.y, midpoint.y, segmentProgress);
                particlePositions[baseIndex + 2] = THREE.MathUtils.lerp(clientPos.z, midpoint.z, segmentProgress);
            } else {
                particlePositions[baseIndex] = THREE.MathUtils.lerp(midpoint.x, proPos.x, segmentProgress);
                particlePositions[baseIndex + 1] = THREE.MathUtils.lerp(midpoint.y, proPos.y, segmentProgress);
                particlePositions[baseIndex + 2] = THREE.MathUtils.lerp(midpoint.z, proPos.z, segmentProgress);
            }
        }

        if (contractMesh.current) {
            contractMesh.current.instanceMatrix.needsUpdate = true;
        }
        if (lineGeometry.current?.attributes.position) {
            lineGeometry.current.attributes.position.needsUpdate = true;
        }
        if (lineGeometry.current?.attributes.color) {
            lineGeometry.current.attributes.color.needsUpdate = true;
        }
        if (particleGeometry.current?.attributes.position) {
            particleGeometry.current.attributes.position.needsUpdate = true;
        }
    });

    return (
        <group>
            <ambientLight intensity={0.6} />
            <pointLight position={[6, 6, 6]} intensity={0.8} color="#1BC47D" />
            <instancedMesh ref={nodeMesh} args={[undefined, undefined, MAX_NODES]}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial roughness={0.2} metalness={0.3} emissive="#0B1C2D" />
            </instancedMesh>
            <instancedMesh ref={contractMesh} args={[undefined, undefined, MAX_CONNECTIONS]}>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial color={CONTRACT_COLOR} roughness={0.1} metalness={0.2} emissive="#1BC47D" emissiveIntensity={0.2} />
            </instancedMesh>
            <lineSegments>
                <bufferGeometry ref={lineGeometry} />
                <lineBasicMaterial color={LINE_BASE_COLOR} transparent opacity={0.55} vertexColors />
            </lineSegments>
            <points>
                <bufferGeometry ref={particleGeometry} />
                <pointsMaterial size={0.08} color={PARTICLE_COLOR} transparent opacity={0.75} />
            </points>
            {Array.from({ length: MAX_CONNECTIONS }).map((_, index) => (
                <sprite
                    key={`lock-${index}`}
                    ref={(node) => {
                        if (node) lockSprites.current[index] = node;
                    }}
                    material={lockMaterials[index]}
                    scale={[0.5, 0.5, 0.5]}
                />
            ))}
        </group>
    );
}

export default function TrustFlowNetwork() {
    const [reducedMotion, setReducedMotion] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updateMotion = () => setReducedMotion(motionQuery.matches);
        const updateSize = () => setIsMobile(window.innerWidth < 768);
        updateMotion();
        updateSize();
        motionQuery.addEventListener("change", updateMotion);
        window.addEventListener("resize", updateSize);
        return () => {
            motionQuery.removeEventListener("change", updateMotion);
            window.removeEventListener("resize", updateSize);
        };
    }, []);

    if (reducedMotion || isMobile) {
        return (
            <div
                className="w-full h-full bg-[radial-gradient(circle_at_top,_rgba(27,196,125,0.14),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.18),_transparent_55%)]"
                aria-hidden="true"
            />
        );
    }

    return (
        <Canvas
            className="w-full h-full"
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 12], fov: 45 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
            <TrustFlowScene reducedMotion={reducedMotion} />
        </Canvas>
    );
}
