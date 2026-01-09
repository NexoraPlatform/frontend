"use client";

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

export default function TrustFlowNetwork({ className = "" }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [reducedMotion, setReducedMotion] = useState(false);

    const nodes = useMemo(() => {
        const entries: NodeData[] = [];
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
        }
        return entries;
    }, []);

    const clientIndices = useMemo(
        () => nodes.map((node, index) => (node.isClient ? index : -1)).filter((value) => value !== -1),
        [nodes],
    );
    const proIndices = useMemo(
        () => nodes.map((node, index) => (!node.isClient ? index : -1)).filter((value) => value !== -1),
        [nodes],
    );

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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setClearColor(0x000000, 0);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
        camera.position.set(0, 0, 5);

        const ambientLight = new THREE.AmbientLight(0x9cc8ff, 0.55);
        const keyLight = new THREE.PointLight(0x1bc47d, 1.2, 0, 1.3);
        keyLight.position.set(2.5, 2.5, 2.5);
        const fillLight = new THREE.PointLight(0x5fa9ff, 0.6, 0, 1.1);
        fillLight.position.set(-2.5, -1.5, 3);
        scene.add(ambientLight, keyLight, fillLight);

        const tempObject = new THREE.Object3D();
        const tempColor = new THREE.Color();
        const tempVecA = new THREE.Vector3();
        const tempVecB = new THREE.Vector3();

        const nodeGeometry = new THREE.SphereGeometry(1, 16, 16);
        const nodeMaterial = new THREE.MeshStandardMaterial({
            transparent: true,
            opacity: 0.9,
            emissiveIntensity: 0.4,
            vertexColors: true,
        });
        const nodeMesh = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, NODE_COUNT);
        nodeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        nodeMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NODE_COUNT * 3), 3);

        nodes.forEach((node, index) => {
            tempObject.position.copy(node.position);
            tempObject.scale.setScalar(NODE_SIZE);
            tempObject.updateMatrix();
            nodeMesh.setMatrixAt(index, tempObject.matrix);
            tempColor.copy(node.isClient ? CLIENT_COLOR : PRO_COLOR);
            nodeMesh.setColorAt(index, tempColor);
        });
        nodeMesh.instanceMatrix.needsUpdate = true;
        if (nodeMesh.instanceColor) {
            nodeMesh.instanceColor.needsUpdate = true;
        }
        scene.add(nodeMesh);

        const lineGeometry = new THREE.BufferGeometry();
        const linePositions = new Float32Array(ACTIVE_CONNECTIONS * 2 * 3);
        const lineColors = new Float32Array(ACTIVE_CONNECTIONS * 2 * 3);
        lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
        lineGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));
        const lineMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.6, vertexColors: true });
        const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lineSegments);

        const contractGeometry = new THREE.BoxGeometry(1, 1, 1);
        const contractMaterial = new THREE.MeshStandardMaterial({
            transparent: true,
            opacity: 0.95,
            emissiveIntensity: 0.7,
            vertexColors: true,
        });
        const contractMesh = new THREE.InstancedMesh(contractGeometry, contractMaterial, ACTIVE_CONNECTIONS);
        contractMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        contractMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(ACTIVE_CONNECTIONS * 3), 3);
        scene.add(contractMesh);

        const lockBodyGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.25);
        const lockShackleGeometry = new THREE.TorusGeometry(0.35, 0.12, 8, 20, Math.PI);
        const lockMaterial = new THREE.MeshStandardMaterial({
            transparent: true,
            opacity: 0.7,
            emissiveIntensity: 0.5,
            vertexColors: true,
        });
        const lockBodyMesh = new THREE.InstancedMesh(lockBodyGeometry, lockMaterial, ACTIVE_CONNECTIONS);
        const lockShackleMesh = new THREE.InstancedMesh(lockShackleGeometry, lockMaterial, ACTIVE_CONNECTIONS);
        lockBodyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        lockShackleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        lockBodyMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(ACTIVE_CONNECTIONS * 3), 3);
        lockShackleMesh.instanceColor = new THREE.InstancedBufferAttribute(
            new Float32Array(ACTIVE_CONNECTIONS * 3),
            3,
        );
        scene.add(lockBodyMesh, lockShackleMesh);

        const particleGeometry = new THREE.SphereGeometry(1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, vertexColors: true });
        const particleMesh = new THREE.InstancedMesh(particleGeometry, particleMaterial, PARTICLE_COUNT);
        particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        particleMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3);
        scene.add(particleMesh);

        const connections = createConnections(clientIndices, proIndices);
        const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
            connectionIndex: index % ACTIVE_CONNECTIONS,
            progress: Math.random(),
            speed: PARTICLE_SPEED * randomInRange(0.7, 1.2),
            jitter: randomInRange(-0.08, 0.08),
        }));

        const updateStaticLayout = () => {
            connections.forEach((connection, index) => {
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
                contractMesh.setMatrixAt(index, tempObject.matrix);
                contractMesh.setColorAt(index, CONTRACT_COLOR);

                tempObject.position.copy(connection.midpoint);
                tempObject.position.y += 0.1;
                tempObject.scale.setScalar(0.9);
                tempObject.updateMatrix();
                lockBodyMesh.setMatrixAt(index, tempObject.matrix);
                lockBodyMesh.setColorAt(index, CONTRACT_COLOR);

                tempObject.position.copy(connection.midpoint);
                tempObject.position.y += 0.2;
                tempObject.scale.setScalar(0.8);
                tempObject.updateMatrix();
                lockShackleMesh.setMatrixAt(index, tempObject.matrix);
                lockShackleMesh.setColorAt(index, CONTRACT_COLOR);
            });

            lineGeometry.attributes.position.needsUpdate = true;
            lineGeometry.attributes.color.needsUpdate = true;
            contractMesh.instanceMatrix.needsUpdate = true;
            if (contractMesh.instanceColor) {
                contractMesh.instanceColor.needsUpdate = true;
            }
            lockBodyMesh.instanceMatrix.needsUpdate = true;
            lockShackleMesh.instanceMatrix.needsUpdate = true;
            if (lockBodyMesh.instanceColor) {
                lockBodyMesh.instanceColor.needsUpdate = true;
            }
            if (lockShackleMesh.instanceColor) {
                lockShackleMesh.instanceColor.needsUpdate = true;
            }

            particles.forEach((particle, index) => {
                const connection = connections[particle.connectionIndex];
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
                particleMesh.setMatrixAt(index, tempObject.matrix);
                particleMesh.setColorAt(index, PARTICLE_COLOR);
            });

            particleMesh.instanceMatrix.needsUpdate = true;
            if (particleMesh.instanceColor) {
                particleMesh.instanceColor.needsUpdate = true;
            }
        };

        updateStaticLayout();

        let frameId = 0;
        const clock = new THREE.Clock();

        const animate = () => {
            const time = clock.getElapsedTime();
            const delta = clock.getDelta();

            if (!reducedMotion) {
                camera.position.x = Math.sin(time * CAMERA_SPEED) * 0.35;
                camera.position.y = 0.1 + Math.cos(time * CAMERA_SPEED) * 0.2;
                camera.lookAt(0, 0, 0);

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
                    nodeMesh.setMatrixAt(index, tempObject.matrix);
                });
                nodeMesh.instanceMatrix.needsUpdate = true;

                connections.forEach((connection, index) => {
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

                connections.forEach((connection, index) => {
                    const pulseWindow = Math.min(0.2, connection.duration * 0.2);
                    const pulse =
                        time - connection.start < pulseWindow
                            ? 1 + Math.sin(((time - connection.start) / pulseWindow) * Math.PI) * 0.3
                            : 1;

                    tempObject.position.copy(connection.midpoint);
                    tempObject.scale.setScalar(CONTRACT_SIZE * pulse);
                    tempObject.updateMatrix();
                    contractMesh.setMatrixAt(index, tempObject.matrix);
                    tempColor.copy(CONTRACT_COLOR).multiplyScalar(0.7 + connection.intensity * 0.6);
                    contractMesh.setColorAt(index, tempColor);

                    tempObject.position.copy(connection.midpoint);
                    tempObject.position.y += 0.1;
                    tempObject.scale.setScalar(0.9 + connection.intensity * 0.2);
                    tempObject.updateMatrix();
                    lockBodyMesh.setMatrixAt(index, tempObject.matrix);

                    tempObject.position.copy(connection.midpoint);
                    tempObject.position.y += 0.2;
                    tempObject.scale.setScalar(0.8 + connection.intensity * 0.2);
                    tempObject.updateMatrix();
                    lockShackleMesh.setMatrixAt(index, tempObject.matrix);
                    tempColor.copy(CONTRACT_COLOR).multiplyScalar(0.5 + connection.intensity * 0.6);
                    lockBodyMesh.setColorAt(index, tempColor);
                    lockShackleMesh.setColorAt(index, tempColor);
                });

                contractMesh.instanceMatrix.needsUpdate = true;
                if (contractMesh.instanceColor) {
                    contractMesh.instanceColor.needsUpdate = true;
                }
                lockBodyMesh.instanceMatrix.needsUpdate = true;
                lockShackleMesh.instanceMatrix.needsUpdate = true;
                if (lockBodyMesh.instanceColor) {
                    lockBodyMesh.instanceColor.needsUpdate = true;
                }
                if (lockShackleMesh.instanceColor) {
                    lockShackleMesh.instanceColor.needsUpdate = true;
                }

                particles.forEach((particle, index) => {
                    particle.progress += delta * particle.speed;
                    if (particle.progress > 1) {
                        particle.progress = Math.random() * 0.2;
                    }

                    const connection = connections[particle.connectionIndex];
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
                    particleMesh.setMatrixAt(index, tempObject.matrix);
                    tempColor.copy(PARTICLE_COLOR).multiplyScalar(0.4 + connection.intensity * 0.8);
                    particleMesh.setColorAt(index, tempColor);
                });

                particleMesh.instanceMatrix.needsUpdate = true;
                if (particleMesh.instanceColor) {
                    particleMesh.instanceColor.needsUpdate = true;
                }
            }

            renderer.render(scene, camera);
            frameId = window.requestAnimationFrame(animate);
        };

        const resize = () => {
            const { clientWidth, clientHeight } = canvas.parentElement ?? canvas;
            const width = clientWidth || 1;
            const height = clientHeight || 1;
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            renderer.setPixelRatio(dpr);
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };

        resize();
        const resizeObserver = new ResizeObserver(resize);
        if (canvas.parentElement) {
            resizeObserver.observe(canvas.parentElement);
        }

        frameId = window.requestAnimationFrame(animate);

        return () => {
            window.cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
            renderer.dispose();
            nodeGeometry.dispose();
            nodeMaterial.dispose();
            lineGeometry.dispose();
            lineMaterial.dispose();
            contractGeometry.dispose();
            contractMaterial.dispose();
            lockBodyGeometry.dispose();
            lockShackleGeometry.dispose();
            lockMaterial.dispose();
            particleGeometry.dispose();
            particleMaterial.dispose();
        };
    }, [clientIndices, nodes, proIndices, reducedMotion]);

    return (
        <div className={`pointer-events-none ${className}`}>
            <canvas ref={canvasRef} className="h-full w-full" />
        </div>
    );
}
