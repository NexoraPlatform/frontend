"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const NODE_COUNT = 120;
const ACTIVE_CONNECTIONS = 18;
const PARTICLES_PER_CONNECTION = 14;
const BASE_SPEED = 0.12;
const BOOST_SPEED = 0.2;
const FADE_DURATION = 2.4;
const LOOP_DURATION = 12;
const CONTRACT_SCALE = 0.22;
const MOBILE_MAX_NODES = 60;
const MOBILE_CONNECTIONS = 8;
const MOBILE_PARTICLES = 8;

const BACKGROUND = "#0B1C2D";
const CLIENT_COLOR = new THREE.Color("#2E8BFF");
const PRO_COLOR = new THREE.Color("#1BC47D");
const CONTRACT_COLOR = new THREE.Color("#FFFFFF");
const LINE_COLOR = new THREE.Color("#E6F4FF");

const reduceMotionQuery = "(prefers-reduced-motion: reduce)";

type Connection = {
    a: number;
    b: number;
    start: THREE.Vector3;
    end: THREE.Vector3;
    midpoint: THREE.Vector3;
    createdAt: number;
    contractPhase: number;
    active: boolean;
};

type NodeData = {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    type: "client" | "pro";
};

function useReducedMotion() {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const media = window.matchMedia(reduceMotionQuery);
        const update = () => setReduced(media.matches);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);

    return reduced;
}

function useIsMobile() {
    const [mobile, setMobile] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const update = () => setMobile(window.innerWidth < 768);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    return mobile;
}

function TrustFlowScene() {
    const reducedMotion = useReducedMotion();
    const isMobile = useIsMobile();

    const nodeCount = isMobile ? MOBILE_MAX_NODES : NODE_COUNT;
    const connectionCount = isMobile ? MOBILE_CONNECTIONS : ACTIVE_CONNECTIONS;
    const particlesPerConnection = isMobile ? MOBILE_PARTICLES : PARTICLES_PER_CONNECTION;

    const nodes = useMemo<NodeData[]>(() => {
        const items: NodeData[] = [];
        for (let i = 0; i < nodeCount; i += 1) {
            const radius = 4 + Math.random() * 4;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const position = new THREE.Vector3(
                Math.cos(theta) * Math.sin(phi) * radius,
                Math.sin(theta) * Math.sin(phi) * radius * 0.65,
                Math.cos(phi) * radius,
            );
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.02,
            );
            items.push({
                position,
                velocity,
                type: i % 2 === 0 ? "client" : "pro",
            });
        }
        return items;
    }, [nodeCount]);

    const connections = useMemo<Connection[]>(() => {
        const items: Connection[] = [];
        for (let i = 0; i < connectionCount; i += 1) {
            items.push({
                a: 0,
                b: 1,
                start: new THREE.Vector3(),
                end: new THREE.Vector3(),
                midpoint: new THREE.Vector3(),
                createdAt: 0,
                contractPhase: 0,
                active: false,
            });
        }
        return items;
    }, [connectionCount]);

    const lineGeometryRef = useRef<THREE.BufferGeometry>(null);
    const lineMaterialRef = useRef<THREE.ShaderMaterial>(null);
    const nodesRef = useRef<THREE.InstancedMesh>(null);
    const contractRef = useRef<THREE.InstancedMesh>(null);
    const lockRef = useRef<THREE.InstancedMesh>(null);
    const particleRef = useRef<THREE.InstancedMesh>(null);
    const clockRef = useRef(0);
    const opacityRef = useRef(Float32Array.from({ length: connectionCount }, () => 0));
    const particleProgress = useRef(Float32Array.from({ length: connectionCount * particlesPerConnection }, () => Math.random()));

    const nodeColors = useMemo(() => {
        const colors = new Float32Array(nodeCount * 3);
        nodes.forEach((node, index) => {
            const color = node.type === "client" ? CLIENT_COLOR : PRO_COLOR;
            colors[index * 3] = color.r;
            colors[index * 3 + 1] = color.g;
            colors[index * 3 + 2] = color.b;
        });
        return colors;
    }, [nodes, nodeCount]);

    const particleMatrices = useMemo(() => new THREE.Matrix4(), []);
    const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
    const tempVector = useMemo(() => new THREE.Vector3(), []);
    const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
    const tempScale = useMemo(() => new THREE.Vector3(), []);

    const linePositions = useMemo(() => new Float32Array(connectionCount * 2 * 3), [connectionCount]);

    const lockGeometry = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(-0.2, -0.1);
        shape.lineTo(0.2, -0.1);
        shape.lineTo(0.2, 0.2);
        shape.lineTo(-0.2, 0.2);
        shape.lineTo(-0.2, -0.1);
        const hole = new THREE.Path();
        hole.absellipse(0, 0.1, 0.12, 0.14, 0, Math.PI, false);
        shape.holes.push(hole);
        const geometry = new THREE.ShapeGeometry(shape);
        geometry.center();
        return geometry;
    }, []);

    const updateConnections = (time: number) => {
        const cycleTime = time % LOOP_DURATION;
        const progress = cycleTime / LOOP_DURATION;
        if (progress < 0.02) {
            const clients = nodes
                .map((node, index) => ({ node, index }))
                .filter((item) => item.node.type === "client");
            const pros = nodes
                .map((node, index) => ({ node, index }))
                .filter((item) => item.node.type === "pro");

            for (let i = 0; i < connections.length; i += 1) {
                const client = clients[Math.floor(Math.random() * clients.length)];
                const pro = pros[Math.floor(Math.random() * pros.length)];
                const connection = connections[i];
                connection.a = client.index;
                connection.b = pro.index;
                connection.start.copy(client.node.position);
                connection.end.copy(pro.node.position);
                connection.midpoint.copy(connection.start).lerp(connection.end, 0.5);
                connection.createdAt = time;
                connection.contractPhase = 0;
                connection.active = true;
                opacityRef.current[i] = 0;
            }
        }
    };

    useFrame((state, delta) => {
        if (reducedMotion) return;
        clockRef.current += delta;
        const time = clockRef.current;

        updateConnections(time);

        const linePositionsArray = linePositions;
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            node.position.addScaledVector(node.velocity, delta * 0.6);
            const limit = 6;
            if (Math.abs(node.position.x) > limit) node.velocity.x *= -1;
            if (Math.abs(node.position.y) > limit * 0.5) node.velocity.y *= -1;
            if (Math.abs(node.position.z) > limit) node.velocity.z *= -1;
            if (nodesRef.current) {
                tempMatrix.compose(node.position, tempQuaternion, tempScale.setScalar(0.12));
                nodesRef.current.setMatrixAt(i, tempMatrix);
            }
        }
        if (nodesRef.current) nodesRef.current.instanceMatrix.needsUpdate = true;

        for (let i = 0; i < connections.length; i += 1) {
            const connection = connections[i];
            if (!connection.active) continue;
            connection.start.copy(nodes[connection.a].position);
            connection.end.copy(nodes[connection.b].position);
            connection.midpoint.copy(connection.start).lerp(connection.end, 0.5);

            const fadeIn = Math.min((time - connection.createdAt) / FADE_DURATION, 1);
            const cycle = (time - connection.createdAt) / LOOP_DURATION;
            const fadeOut = Math.max(0, 1 - (cycle - 0.7) / 0.3);
            opacityRef.current[i] = Math.min(fadeIn, fadeOut);
            connection.contractPhase = Math.min((time - connection.createdAt) / 1.6, 1);

            const lineIndex = i * 6;
            linePositionsArray[lineIndex] = connection.start.x;
            linePositionsArray[lineIndex + 1] = connection.start.y;
            linePositionsArray[lineIndex + 2] = connection.start.z;
            linePositionsArray[lineIndex + 3] = connection.end.x;
            linePositionsArray[lineIndex + 4] = connection.end.y;
            linePositionsArray[lineIndex + 5] = connection.end.z;
        }

        if (lineGeometryRef.current) {
            lineGeometryRef.current.attributes.position.needsUpdate = true;
        }
        if (lineMaterialRef.current) {
            lineMaterialRef.current.uniforms.uTime.value = time;
        }

        if (contractRef.current && lockRef.current) {
            for (let i = 0; i < connections.length; i += 1) {
                const connection = connections[i];
                const opacity = opacityRef.current[i];
                const pulse = 1 + Math.sin(Math.min(connection.contractPhase, 1) * Math.PI) * 0.35;
                tempMatrix.compose(
                    connection.midpoint,
                    tempQuaternion,
                    tempScale.setScalar(CONTRACT_SCALE * pulse * opacity),
                );
                contractRef.current.setMatrixAt(i, tempMatrix);

                const lockOffset = tempVector.copy(connection.midpoint).add(new THREE.Vector3(0, 0.28, 0));
                tempMatrix.compose(lockOffset, tempQuaternion, tempScale.setScalar(0.3 * opacity));
                lockRef.current.setMatrixAt(i, tempMatrix);
            }
            contractRef.current.instanceMatrix.needsUpdate = true;
            lockRef.current.instanceMatrix.needsUpdate = true;
        }

        if (particleRef.current) {
            const totalParticles = connectionCount * particlesPerConnection;
            for (let i = 0; i < totalParticles; i += 1) {
                const connectionIndex = Math.floor(i / particlesPerConnection);
                const connection = connections[connectionIndex];
                const localIndex = i % particlesPerConnection;
                const speedBoost = connection.contractPhase > 0.9 ? BOOST_SPEED : BASE_SPEED;
                const speed = speedBoost + localIndex * 0.002;
                particleProgress.current[i] = (particleProgress.current[i] + delta * speed) % 1;
                const progress = particleProgress.current[i];
                if (progress < 0.5) {
                    tempVector.copy(connection.start).lerp(connection.midpoint, progress * 2);
                } else {
                    tempVector.copy(connection.midpoint).lerp(connection.end, (progress - 0.5) * 2);
                }
                const particleScale = 0.06 * opacityRef.current[connectionIndex];
                particleMatrices.compose(tempVector, tempQuaternion, tempScale.setScalar(particleScale));
                particleRef.current.setMatrixAt(i, particleMatrices);
            }
            particleRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    const lineOpacityAttribute = useMemo(() => new Float32Array(connectionCount * 2), [connectionCount]);

    useFrame(() => {
        for (let i = 0; i < connectionCount; i += 1) {
            lineOpacityAttribute[i * 2] = opacityRef.current[i];
            lineOpacityAttribute[i * 2 + 1] = opacityRef.current[i];
        }
        if (lineGeometryRef.current) {
            const attribute = lineGeometryRef.current.attributes.opacity as THREE.BufferAttribute;
            attribute.needsUpdate = true;
        }
        if (contractRef.current) {
            const contractMaterial = contractRef.current.material as THREE.MeshStandardMaterial;
            contractMaterial.opacity = 0.8;
        }
    });

    return (
        <>
            <instancedMesh ref={nodesRef} args={[undefined, undefined, nodeCount]}>
                <sphereGeometry args={[0.15, 18, 18]}>
                    <instancedBufferAttribute attach="attributes-color" args={[nodeColors, 3]} />
                </sphereGeometry>
                <meshStandardMaterial vertexColors emissiveIntensity={0.6} emissive="#1BC47D" />
            </instancedMesh>

            <lineSegments>
                <bufferGeometry ref={lineGeometryRef}>
                    <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
                    <bufferAttribute attach="attributes-opacity" args={[lineOpacityAttribute, 1]} />
                </bufferGeometry>
                <shaderMaterial
                    ref={lineMaterialRef}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    uniforms={{
                        uTime: { value: 0 },
                        uColor: { value: LINE_COLOR },
                    }}
                    vertexShader={`
                        attribute float opacity;
                        varying float vOpacity;
                        void main() {
                            vOpacity = opacity;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `}
                    fragmentShader={`
                        uniform vec3 uColor;
                        varying float vOpacity;
                        void main() {
                            float glow = smoothstep(0.0, 1.0, vOpacity);
                            gl_FragColor = vec4(uColor, glow * 0.8);
                        }
                    `}
                />
            </lineSegments>

            <instancedMesh ref={contractRef} args={[undefined, undefined, connectionCount]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color={CONTRACT_COLOR}
                    emissive={CONTRACT_COLOR}
                    emissiveIntensity={0.7}
                    transparent
                    opacity={0.8}
                />
            </instancedMesh>

            <instancedMesh ref={lockRef} args={[lockGeometry, undefined, connectionCount]}>
                <meshStandardMaterial color="#E6F4FF" emissive="#E6F4FF" emissiveIntensity={0.5} transparent opacity={0.7} />
            </instancedMesh>

            <instancedMesh ref={particleRef} args={[undefined, undefined, connectionCount * particlesPerConnection]}>
                <sphereGeometry args={[0.06, 10, 10]} />
                <meshStandardMaterial color="#22F3A5" emissive="#22F3A5" emissiveIntensity={1} />
            </instancedMesh>

            <ambientLight intensity={0.4} />
            <directionalLight position={[4, 6, 6]} intensity={1.2} color="#E6F4FF" />
        </>
    );
}

export default function TrustFlowNetwork() {
    const reducedMotion = useReducedMotion();
    const isMobile = useIsMobile();

    if (reducedMotion || isMobile) {
        return (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0B1C2D] via-[#0B1C2D]/90 to-[#081427]" />
        );
    }

    return (
        <div className="absolute inset-0 pointer-events-none">
            <Canvas
                dpr={[1, 1.5]}
                camera={{ position: [0, 0, 9], fov: 50 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: BACKGROUND }}
            >
                <TrustFlowScene />
            </Canvas>
        </div>
    );
}
