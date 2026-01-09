"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const NODE_COUNT = 140;
const ACTIVE_CONNECTIONS = 10;
const PARTICLE_COUNT = 120;
const CLIENT_RATIO = 0.55;
const DRIFT_SPEED = 0.08;
const CONNECTION_MIN_DURATION = 10;
const CONNECTION_MAX_DURATION = 15;
const PARTICLE_SPEED = 0.18;
const FADE_TIME = 0.2;
const CAMERA_SPEED = 0.08;
const NODE_SIZE = 0.055;
const CONTRACT_SIZE = 0.08;
const PARTICLE_SIZE = 0.03;
const BOUNDS = { x: 3.1, y: 2.1, z: 2.4 };

const CLIENT_COLOR = new THREE.Color("#4CA3FF");
const PRO_COLOR = new THREE.Color("#1BC47D");
const CONTRACT_COLOR = new THREE.Color("#FFFFFF");
const PARTICLE_COLOR = new THREE.Color("#37E58F");
const LINE_COLOR = new THREE.Color("#E9F4FF");

const randomInRange = (min: number, max: number) => min + Math.random() * (max - min);

type NodeData = {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    isClient: boolean;
};

type Connection = {
    a: number;
    b: number;
    start: number;
    duration: number;
    midpoint: THREE.Vector3;
    intensity: number;
};

type Particle = {
    connectionIndex: number;
    progress: number;
    speed: number;
    jitter: number;
};

function createConnections(clientIndices: number[], proIndices: number[]) {
    return Array.from({ length: ACTIVE_CONNECTIONS }, () => {
        const a = clientIndices[Math.floor(Math.random() * clientIndices.length)];
        const b = proIndices[Math.floor(Math.random() * proIndices.length)];
        return {
            a,
            b,
            start: 0,
            duration: randomInRange(CONNECTION_MIN_DURATION, CONNECTION_MAX_DURATION),
            midpoint: new THREE.Vector3(),
            intensity: 0,
        } as Connection;
    });
}

function NetworkScene({ reducedMotion }: { reducedMotion: boolean }) {
    const nodeMeshRef = useRef<THREE.InstancedMesh>(null);
    const contractMeshRef = useRef<THREE.InstancedMesh>(null);
    const lockBodyMeshRef = useRef<THREE.InstancedMesh>(null);
    const lockShackleMeshRef = useRef<THREE.InstancedMesh>(null);
    const particleMeshRef = useRef<THREE.InstancedMesh>(null);
    const lineRef = useRef<THREE.LineSegments>(null);
    const { camera } = useThree();

    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);
    const tempVecA = useMemo(() => new THREE.Vector3(), []);
    const tempVecB = useMemo(() => new THREE.Vector3(), []);

    const { nodes, clientIndices, proIndices } = useMemo(() => {
        const entries: NodeData[] = [];
        const clients: number[] = [];
        const pros: number[] = [];
        for (let i = 0; i < NODE_COUNT; i += 1) {
            const isClient = i < Math.floor(NODE_COUNT * CLIENT_RATIO);
            const position = new THREE.Vector3(
                randomInRange(-BOUNDS.x, BOUNDS.x),
                randomInRange(-BOUNDS.y, BOUNDS.y),
                randomInRange(-BOUNDS.z, BOUNDS.z),
            );
            const velocity = new THREE.Vector3(
                randomInRange(-1, 1),
                randomInRange(-1, 1),
                randomInRange(-1, 1),
            ).normalize();
            entries.push({ position, velocity, isClient });
            if (isClient) {
                clients.push(i);
            } else {
                pros.push(i);
            }
        }
        return { nodes: entries, clientIndices: clients, proIndices: pros };
    }, []);

    const connectionsRef = useRef<Connection[]>(createConnections(clientIndices, proIndices));
    const particlesRef = useRef<Particle[]>(
        Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
            connectionIndex: index % ACTIVE_CONNECTIONS,
            progress: Math.random(),
            speed: PARTICLE_SPEED * randomInRange(0.7, 1.2),
            jitter: randomInRange(-0.08, 0.08),
        })),
    );

    const lineGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(ACTIVE_CONNECTIONS * 2 * 3);
        const colors = new Float32Array(ACTIVE_CONNECTIONS * 2 * 3);
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        return geometry;
    }, []);

    useEffect(() => {
        if (!nodeMeshRef.current) return;
        nodes.forEach((node, index) => {
            tempObject.position.copy(node.position);
            tempObject.scale.setScalar(NODE_SIZE);
            tempObject.updateMatrix();
            nodeMeshRef.current?.setMatrixAt(index, tempObject.matrix);
            tempColor.copy(node.isClient ? CLIENT_COLOR : PRO_COLOR);
            nodeMeshRef.current?.setColorAt(index, tempColor);
        });
        nodeMeshRef.current.instanceMatrix.needsUpdate = true;
        if (nodeMeshRef.current.instanceColor) {
            nodeMeshRef.current.instanceColor.needsUpdate = true;
        }

        const linePositions = lineGeometry.attributes.position.array as Float32Array;
        const lineColors = lineGeometry.attributes.color.array as Float32Array;

        connectionsRef.current.forEach((connection, index) => {
            const nodeA = nodes[connection.a].position;
            const nodeB = nodes[connection.b].position;
            connection.midpoint.copy(nodeA).add(nodeB).multiplyScalar(0.5);
            connection.intensity = 1;

            const lineOffset = index * 6;
            linePositions[lineOffset] = nodeA.x;
            linePositions[lineOffset + 1] = nodeA.y;
            linePositions[lineOffset + 2] = nodeA.z;
            linePositions[lineOffset + 3] = nodeB.x;
            linePositions[lineOffset + 4] = nodeB.y;
            linePositions[lineOffset + 5] = nodeB.z;

            tempColor.copy(LINE_COLOR).multiplyScalar(0.9);
            lineColors[lineOffset] = tempColor.r;
            lineColors[lineOffset + 1] = tempColor.g;
            lineColors[lineOffset + 2] = tempColor.b;
            lineColors[lineOffset + 3] = tempColor.r;
            lineColors[lineOffset + 4] = tempColor.g;
            lineColors[lineOffset + 5] = tempColor.b;

            tempObject.position.copy(connection.midpoint);
            tempObject.scale.setScalar(CONTRACT_SIZE);
            tempObject.updateMatrix();
            contractMeshRef.current?.setMatrixAt(index, tempObject.matrix);
            contractMeshRef.current?.setColorAt(index, CONTRACT_COLOR);

            tempObject.position.copy(connection.midpoint);
            tempObject.position.y += 0.1;
            tempObject.scale.setScalar(0.9);
            tempObject.updateMatrix();
            lockBodyMeshRef.current?.setMatrixAt(index, tempObject.matrix);
            lockBodyMeshRef.current?.setColorAt(index, CONTRACT_COLOR);

            tempObject.position.copy(connection.midpoint);
            tempObject.position.y += 0.2;
            tempObject.scale.setScalar(0.8);
            tempObject.updateMatrix();
            lockShackleMeshRef.current?.setMatrixAt(index, tempObject.matrix);
            lockShackleMeshRef.current?.setColorAt(index, CONTRACT_COLOR);
        });

        lineGeometry.attributes.position.needsUpdate = true;
        lineGeometry.attributes.color.needsUpdate = true;
        if (contractMeshRef.current?.instanceMatrix) {
            contractMeshRef.current.instanceMatrix.needsUpdate = true;
            if (contractMeshRef.current.instanceColor) {
                contractMeshRef.current.instanceColor.needsUpdate = true;
            }
        }
        if (lockBodyMeshRef.current?.instanceMatrix) {
            lockBodyMeshRef.current.instanceMatrix.needsUpdate = true;
            if (lockBodyMeshRef.current.instanceColor) {
                lockBodyMeshRef.current.instanceColor.needsUpdate = true;
            }
        }
        if (lockShackleMeshRef.current?.instanceMatrix) {
            lockShackleMeshRef.current.instanceMatrix.needsUpdate = true;
            if (lockShackleMeshRef.current.instanceColor) {
                lockShackleMeshRef.current.instanceColor.needsUpdate = true;
            }
        }

        particlesRef.current.forEach((particle, index) => {
            const connection = connectionsRef.current[particle.connectionIndex];
            const start = nodes[connection.a].position;
            const end = nodes[connection.b].position;
            const midpoint = connection.midpoint;

            if (particle.progress < 0.5) {
                tempVecA.copy(start);
                tempVecB.copy(midpoint);
                tempVecA.lerp(tempVecB, particle.progress / 0.5);
            } else {
                tempVecA.copy(midpoint);
                tempVecB.copy(end);
                tempVecA.lerp(tempVecB, (particle.progress - 0.5) / 0.5);
            }

            tempObject.position.copy(tempVecA);
            tempObject.scale.setScalar(PARTICLE_SIZE);
            tempObject.updateMatrix();
            particleMeshRef.current?.setMatrixAt(index, tempObject.matrix);
            particleMeshRef.current?.setColorAt(index, PARTICLE_COLOR);
        });

        if (particleMeshRef.current?.instanceMatrix) {
            particleMeshRef.current.instanceMatrix.needsUpdate = true;
            if (particleMeshRef.current.instanceColor) {
                particleMeshRef.current.instanceColor.needsUpdate = true;
            }
        }
    }, [lineGeometry, nodes, tempColor, tempObject, tempVecA, tempVecB]);

    useFrame((state, delta) => {
        const time = state.clock.elapsedTime;

        if (!reducedMotion) {
            camera.position.x = Math.sin(time * CAMERA_SPEED) * 0.35;
            camera.position.y = 0.1 + Math.cos(time * CAMERA_SPEED) * 0.2;
            camera.lookAt(0, 0, 0);
        }

        if (reducedMotion) {
            return;
        }

        nodes.forEach((node, index) => {
            node.position.x += node.velocity.x * delta * DRIFT_SPEED;
            node.position.y += node.velocity.y * delta * DRIFT_SPEED;
            node.position.z += node.velocity.z * delta * DRIFT_SPEED;

            if (Math.abs(node.position.x) > BOUNDS.x) {
                node.velocity.x *= -1;
            }
            if (Math.abs(node.position.y) > BOUNDS.y) {
                node.velocity.y *= -1;
            }
            if (Math.abs(node.position.z) > BOUNDS.z) {
                node.velocity.z *= -1;
            }

            tempObject.position.copy(node.position);
            tempObject.scale.setScalar(NODE_SIZE);
            tempObject.updateMatrix();
            nodeMeshRef.current?.setMatrixAt(index, tempObject.matrix);
        });
        if (nodeMeshRef.current) {
            nodeMeshRef.current.instanceMatrix.needsUpdate = true;
        }

        const linePositions = lineGeometry.attributes.position.array as Float32Array;
        const lineColors = lineGeometry.attributes.color.array as Float32Array;

        connectionsRef.current.forEach((connection, index) => {
            const elapsed = time - connection.start;
            if (elapsed > connection.duration) {
                const a = clientIndices[Math.floor(Math.random() * clientIndices.length)];
                const b = proIndices[Math.floor(Math.random() * proIndices.length)];
                connection.a = a;
                connection.b = b;
                connection.start = time;
                connection.duration = randomInRange(CONNECTION_MIN_DURATION, CONNECTION_MAX_DURATION);
            }

            const life = (time - connection.start) / connection.duration;
            const fade =
                life < FADE_TIME
                    ? life / FADE_TIME
                    : life > 1 - FADE_TIME
                    ? (1 - life) / FADE_TIME
                    : 1;

            const intensity = THREE.MathUtils.clamp(fade, 0, 1);
            connection.intensity = intensity;

            const nodeA = nodes[connection.a].position;
            const nodeB = nodes[connection.b].position;
            connection.midpoint.copy(nodeA).add(nodeB).multiplyScalar(0.5);

            const lineOffset = index * 6;
            linePositions[lineOffset] = nodeA.x;
            linePositions[lineOffset + 1] = nodeA.y;
            linePositions[lineOffset + 2] = nodeA.z;
            linePositions[lineOffset + 3] = nodeB.x;
            linePositions[lineOffset + 4] = nodeB.y;
            linePositions[lineOffset + 5] = nodeB.z;

            const colorIntensity = 0.35 + intensity * 0.75;
            tempColor.copy(LINE_COLOR).multiplyScalar(colorIntensity);
            lineColors[lineOffset] = tempColor.r;
            lineColors[lineOffset + 1] = tempColor.g;
            lineColors[lineOffset + 2] = tempColor.b;
            lineColors[lineOffset + 3] = tempColor.r;
            lineColors[lineOffset + 4] = tempColor.g;
            lineColors[lineOffset + 5] = tempColor.b;
        });

        lineGeometry.attributes.position.needsUpdate = true;
        lineGeometry.attributes.color.needsUpdate = true;

        connectionsRef.current.forEach((connection, index) => {
            const pulseWindow = Math.min(0.2, connection.duration * 0.2);
            const pulse =
                time - connection.start < pulseWindow
                    ? 1 + Math.sin(((time - connection.start) / pulseWindow) * Math.PI) * 0.3
                    : 1;

            tempObject.position.copy(connection.midpoint);
            tempObject.scale.setScalar(CONTRACT_SIZE * pulse);
            tempObject.updateMatrix();
            contractMeshRef.current?.setMatrixAt(index, tempObject.matrix);
            tempColor.copy(CONTRACT_COLOR).multiplyScalar(0.7 + connection.intensity * 0.6);
            contractMeshRef.current?.setColorAt(index, tempColor);

            tempObject.position.copy(connection.midpoint);
            tempObject.position.y += 0.1;
            tempObject.scale.setScalar(0.9 + connection.intensity * 0.2);
            tempObject.updateMatrix();
            lockBodyMeshRef.current?.setMatrixAt(index, tempObject.matrix);

            tempObject.position.copy(connection.midpoint);
            tempObject.position.y += 0.2;
            tempObject.scale.setScalar(0.8 + connection.intensity * 0.2);
            tempObject.updateMatrix();
            lockShackleMeshRef.current?.setMatrixAt(index, tempObject.matrix);
            tempColor.copy(CONTRACT_COLOR).multiplyScalar(0.5 + connection.intensity * 0.6);
            lockBodyMeshRef.current?.setColorAt(index, tempColor);
            lockShackleMeshRef.current?.setColorAt(index, tempColor);
        });

        if (contractMeshRef.current?.instanceMatrix) {
            contractMeshRef.current.instanceMatrix.needsUpdate = true;
            if (contractMeshRef.current.instanceColor) {
                contractMeshRef.current.instanceColor.needsUpdate = true;
            }
        }
        if (lockBodyMeshRef.current?.instanceMatrix) {
            lockBodyMeshRef.current.instanceMatrix.needsUpdate = true;
            if (lockBodyMeshRef.current.instanceColor) {
                lockBodyMeshRef.current.instanceColor.needsUpdate = true;
            }
        }
        if (lockShackleMeshRef.current?.instanceMatrix) {
            lockShackleMeshRef.current.instanceMatrix.needsUpdate = true;
            if (lockShackleMeshRef.current.instanceColor) {
                lockShackleMeshRef.current.instanceColor.needsUpdate = true;
            }
        }

        particlesRef.current.forEach((particle, index) => {
            particle.progress += delta * particle.speed;
            if (particle.progress > 1) {
                particle.progress = Math.random() * 0.2;
            }

            const connection = connectionsRef.current[particle.connectionIndex];
            const start = nodes[connection.a].position;
            const end = nodes[connection.b].position;
            const midpoint = connection.midpoint;

            if (particle.progress < 0.5) {
                tempVecA.copy(start);
                tempVecB.copy(midpoint).addScalar(particle.jitter);
                tempVecA.lerp(tempVecB, particle.progress / 0.5);
            } else {
                tempVecA.copy(midpoint).addScalar(particle.jitter);
                tempVecB.copy(end);
                tempVecA.lerp(tempVecB, (particle.progress - 0.5) / 0.5);
            }

            tempObject.position.copy(tempVecA);
            tempObject.scale.setScalar(PARTICLE_SIZE * (0.7 + connection.intensity * 0.6));
            tempObject.updateMatrix();
            particleMeshRef.current?.setMatrixAt(index, tempObject.matrix);
            tempColor.copy(PARTICLE_COLOR).multiplyScalar(0.4 + connection.intensity * 0.8);
            particleMeshRef.current?.setColorAt(index, tempColor);
        });

        if (particleMeshRef.current?.instanceMatrix) {
            particleMeshRef.current.instanceMatrix.needsUpdate = true;
            if (particleMeshRef.current.instanceColor) {
                particleMeshRef.current.instanceColor.needsUpdate = true;
            }
        }
    });

    return (
        <group>
            <lineSegments ref={lineRef} geometry={lineGeometry}>
                <lineBasicMaterial vertexColors transparent opacity={0.6} />
            </lineSegments>
            <instancedMesh ref={nodeMeshRef} args={[undefined, undefined, NODE_COUNT]}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshStandardMaterial
                    transparent
                    opacity={0.9}
                    emissiveIntensity={0.4}
                    vertexColors
                />
            </instancedMesh>
            <instancedMesh ref={contractMeshRef} args={[undefined, undefined, ACTIVE_CONNECTIONS]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    transparent
                    opacity={0.95}
                    emissiveIntensity={0.7}
                    vertexColors
                />
            </instancedMesh>
            <instancedMesh ref={lockBodyMeshRef} args={[undefined, undefined, ACTIVE_CONNECTIONS]}>
                <boxGeometry args={[0.5, 0.6, 0.25]} />
                <meshStandardMaterial
                    transparent
                    opacity={0.7}
                    emissiveIntensity={0.5}
                    vertexColors
                />
            </instancedMesh>
            <instancedMesh ref={lockShackleMeshRef} args={[undefined, undefined, ACTIVE_CONNECTIONS]}>
                <torusGeometry args={[0.35, 0.12, 8, 20, Math.PI]} />
                <meshStandardMaterial
                    transparent
                    opacity={0.7}
                    emissiveIntensity={0.5}
                    vertexColors
                />
            </instancedMesh>
            <instancedMesh ref={particleMeshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
                <sphereGeometry args={[1, 8, 8]} />
                <meshBasicMaterial transparent opacity={0.85} vertexColors />
            </instancedMesh>
        </group>
    );
}

export default function TrustFlowNetwork({ className = "" }: { className?: string }) {
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updatePreference = () => setReducedMotion(mediaQuery.matches);
        updatePreference();

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", updatePreference);
            return () => mediaQuery.removeEventListener("change", updatePreference);
        }

        mediaQuery.addListener(updatePreference);
        return () => mediaQuery.removeListener(updatePreference);
    }, []);

    return (
        <div className={`pointer-events-none ${className}`}>
            <Canvas
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                camera={{ position: [0, 0, 5], fov: 50 }}
            >
                <ambientLight intensity={0.55} color={"#9cc8ff"} />
                <pointLight position={[2.5, 2.5, 2.5]} intensity={1.2} color={"#1BC47D"} />
                <pointLight position={[-2.5, -1.5, 3]} intensity={0.6} color={"#5fa9ff"} />
                <NetworkScene reducedMotion={reducedMotion} />
            </Canvas>
        </div>
    );
}
