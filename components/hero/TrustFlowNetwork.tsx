"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const COLORS = {
    background: 0x0b1c2d,
    emerald: 0x1bc47d,
    clientBlue: 0x3b82f6,
    contractWhite: 0xe6edf3,
};

interface NodeData {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    type: "client" | "professional" | "contract";
    mesh?: THREE.Mesh;
    baseScale: number;
}

interface PayloadData {
    mesh: THREE.Mesh;
    progress: number;
    speed: number;
}

interface Connection {
    from: number;
    to: number;
    curve: THREE.CatmullRomCurve3;
    tube?: THREE.Mesh;
    active: boolean;
    progress: number;
    contractMesh?: THREE.Mesh;
    lockMesh?: THREE.Group;
    payloads: PayloadData[];
}

export default function TrustFlowNetwork() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const prefersReducedMotion = useMemo(() => {
        if (typeof window !== "undefined") {
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        }
        return false;
    }, []);

    useEffect(() => {
        setIsClient(true);
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        if (prefersReducedMotion || isMobile) return;
        const container = containerRef.current;
        if (!container) return;

        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(COLORS.background, 10, 40);
        scene.background = new THREE.Color(COLORS.background);

        const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.set(0, 0, 20);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        container.appendChild(renderer.domElement);

        const sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        scene.add(new THREE.AmbientLight(0xffffff, 0.3));
        const primaryLight = new THREE.DirectionalLight(0xffffff, 0.8);
        primaryLight.position.set(10, 10, 5);
        scene.add(primaryLight);
        const accentLight = new THREE.DirectionalLight(COLORS.emerald, 0.3);
        accentLight.position.set(-10, -5, -5);
        scene.add(accentLight);

        const nodes: NodeData[] = [];
        const spreadX = 25;
        const spreadY = 15;
        const spreadZ = 20;

        for (let i = 0; i < 150; i += 1) {
            const type = i < 60 ? "client" : i < 120 ? "professional" : "contract";
            nodes.push({
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * spreadX,
                    (Math.random() - 0.5) * spreadY,
                    (Math.random() - 0.5) * spreadZ
                ),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02
                ),
                type,
                baseScale: 0.15 + Math.random() * 0.1,
            });
        }

        nodes.forEach((node) => {
            let geometry: THREE.BufferGeometry;
            let material: THREE.MeshStandardMaterial;

            if (node.type === "client") {
                geometry = new THREE.IcosahedronGeometry(node.baseScale, 0);
                material = new THREE.MeshStandardMaterial({
                    color: COLORS.clientBlue,
                    emissive: COLORS.clientBlue,
                    emissiveIntensity: 0.2,
                    metalness: 0.6,
                    roughness: 0.3,
                });
            } else if (node.type === "professional") {
                geometry = new THREE.CapsuleGeometry(node.baseScale * 0.6, node.baseScale * 1.2, 4, 8);
                material = new THREE.MeshStandardMaterial({
                    color: COLORS.emerald,
                    emissive: COLORS.emerald,
                    emissiveIntensity: 0.3,
                    metalness: 0.5,
                    roughness: 0.2,
                });
            } else {
                geometry = new THREE.BoxGeometry(node.baseScale * 1.5, node.baseScale * 1.5, node.baseScale * 1.5);
                material = new THREE.MeshStandardMaterial({
                    color: COLORS.contractWhite,
                    emissive: COLORS.contractWhite,
                    emissiveIntensity: 0.15,
                    metalness: 0.8,
                    roughness: 0.1,
                });
            }

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(node.position);
            node.mesh = mesh;
            sceneGroup.add(mesh);
        });

        const payloadPool: THREE.Mesh[] = [];
        const payloadGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const payloadMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.emerald,
            emissive: COLORS.emerald,
            emissiveIntensity: 0.8,
            metalness: 0.3,
            roughness: 0.2,
        });

        for (let i = 0; i < 80; i += 1) {
            const mesh = new THREE.Mesh(payloadGeometry, payloadMaterial);
            mesh.visible = false;
            payloadPool.push(mesh);
            sceneGroup.add(mesh);
        }

        const connections: Connection[] = [];
        const numConnections = 20;

        const createTube = (conn: Connection) => {
            const geometry = new THREE.TubeGeometry(conn.curve, 32, 0.02, 8, false);
            const material = new THREE.MeshStandardMaterial({
                color: COLORS.clientBlue,
                emissive: COLORS.emerald,
                emissiveIntensity: 0.3,
                metalness: 0.7,
                roughness: 0.2,
                transparent: true,
                opacity: 0,
            });

            conn.tube = new THREE.Mesh(geometry, material);
            sceneGroup.add(conn.tube);
        };

        const activateConnection = (conn: Connection) => {
            const mid = conn.curve.getPoint(0.5);

            const contractGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3, 2, 2, 2);
            const contractMaterial = new THREE.MeshStandardMaterial({
                color: COLORS.contractWhite,
                emissive: COLORS.contractWhite,
                emissiveIntensity: 0.5,
                metalness: 0.9,
                roughness: 0.1,
            });
            conn.contractMesh = new THREE.Mesh(contractGeometry, contractMaterial);
            conn.contractMesh.position.copy(mid);
            conn.contractMesh.scale.setScalar(0.01);
            sceneGroup.add(conn.contractMesh);

            const lockGroup = new THREE.Group();
            const lockBodyGeometry = new THREE.BoxGeometry(0.15, 0.2, 0.1, 1, 1, 1);
            const lockBodyMaterial = new THREE.MeshStandardMaterial({
                color: COLORS.emerald,
                emissive: COLORS.emerald,
                emissiveIntensity: 0.6,
                metalness: 0.8,
                roughness: 0.2,
            });
            const lockBody = new THREE.Mesh(lockBodyGeometry, lockBodyMaterial);
            lockGroup.add(lockBody);

            const shackleGeometry = new THREE.TorusGeometry(0.08, 0.025, 8, 12, Math.PI);
            const shackle = new THREE.Mesh(shackleGeometry, lockBodyMaterial);
            shackle.position.y = 0.15;
            shackle.rotation.x = Math.PI;
            lockGroup.add(shackle);

            lockGroup.position.copy(mid);
            lockGroup.position.y += 0.5;
            lockGroup.scale.setScalar(0.01);
            conn.lockMesh = lockGroup;
            sceneGroup.add(lockGroup);

            const numPayloads = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < numPayloads; i += 1) {
                const availableMesh = payloadPool.find((mesh) => !mesh.visible);
                if (availableMesh) {
                    availableMesh.visible = true;
                    conn.payloads.push({
                        mesh: availableMesh,
                        progress: i / numPayloads,
                        speed: 0.003 + Math.random() * 0.002,
                    });
                }
            }
        };

        const deactivateConnection = (conn: Connection) => {
            conn.active = false;

            if (conn.tube) {
                sceneGroup.remove(conn.tube);
                conn.tube.geometry.dispose();
                (conn.tube.material as THREE.Material).dispose();
                conn.tube = undefined;
            }

            if (conn.contractMesh) {
                sceneGroup.remove(conn.contractMesh);
                conn.contractMesh.geometry.dispose();
                (conn.contractMesh.material as THREE.Material).dispose();
                conn.contractMesh = undefined;
            }

            if (conn.lockMesh) {
                sceneGroup.remove(conn.lockMesh);
                conn.lockMesh.children.forEach((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.geometry.dispose();
                        (child.material as THREE.Material).dispose();
                    }
                });
                conn.lockMesh = undefined;
            }

            conn.payloads.forEach((payload) => {
                payload.mesh.visible = false;
            });
            conn.payloads = [];
            conn.progress = 0;
        };

        for (let i = 0; i < numConnections; i += 1) {
            const clientIdx = Math.floor(Math.random() * 60);
            const proIdx = 60 + Math.floor(Math.random() * 60);

            const from = nodes[clientIdx].position;
            const to = nodes[proIdx].position;
            const mid = from.clone().lerp(to, 0.5);
            mid.y += (Math.random() - 0.5) * 2;

            const curve = new THREE.CatmullRomCurve3([from.clone(), mid, to.clone()]);

            connections.push({
                from: clientIdx,
                to: proIdx,
                curve,
                active: i < 12,
                progress: 0,
                payloads: [],
            });
        }

        connections.forEach((conn) => {
            if (conn.active) {
                createTube(conn);
                activateConnection(conn);
            }
        });

        const clock = new THREE.Clock();
        let nextConnectionChange = 12;
        let rafId = 0;

        const animate = () => {
            rafId = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const elapsed = clock.getElapsedTime();

            nodes.forEach((node) => {
                if (!node.mesh) return;

                node.position.add(node.velocity);

                if (Math.abs(node.position.x) > 15) node.velocity.x *= -1;
                if (Math.abs(node.position.y) > 10) node.velocity.y *= -1;
                if (Math.abs(node.position.z) > 12) node.velocity.z *= -1;

                node.mesh.position.copy(node.position);
                node.mesh.rotation.x += delta * 0.2;
                node.mesh.rotation.y += delta * 0.3;
            });

            connections.forEach((conn) => {
                if (!conn.active) return;

                const from = nodes[conn.from].position;
                const to = nodes[conn.to].position;
                const mid = from.clone().lerp(to, 0.5);
                mid.y += Math.sin(elapsed * 0.5 + conn.from) * 0.5;
                conn.curve.points[0].copy(from);
                conn.curve.points[1].copy(mid);
                conn.curve.points[2].copy(to);

                if (conn.tube) {
                    conn.tube.geometry.dispose();
                    conn.tube.geometry = new THREE.TubeGeometry(conn.curve, 32, 0.02, 8, false);

                    const material = conn.tube.material as THREE.MeshStandardMaterial;
                    if (material.opacity < 0.8) {
                        material.opacity = Math.min(0.8, material.opacity + delta * 0.5);
                    }
                }

                if (conn.contractMesh) {
                    conn.progress += delta * 2;
                    if (conn.progress < 1) {
                        const scale = 0.01 + Math.sin(conn.progress * Math.PI) * 0.99;
                        conn.contractMesh.scale.setScalar(scale);
                        const material = conn.contractMesh.material as THREE.MeshStandardMaterial;
                        material.emissiveIntensity = 0.5 + Math.sin(conn.progress * Math.PI) * 0.5;
                    } else {
                        conn.contractMesh.scale.setScalar(1);
                    }
                    conn.contractMesh.position.copy(conn.curve.getPoint(0.5));
                    conn.contractMesh.rotation.x += delta;
                    conn.contractMesh.rotation.y += delta * 0.7;
                }

                if (conn.lockMesh) {
                    if (conn.progress < 1.2 && conn.progress > 0.3) {
                        const scale = Math.min(1, (conn.progress - 0.3) / 0.5);
                        conn.lockMesh.scale.setScalar(scale);
                    }
                    const lockPos = conn.curve.getPoint(0.5).clone();
                    lockPos.y += 0.5;
                    conn.lockMesh.position.copy(lockPos);
                    conn.lockMesh.rotation.y += delta * 0.5;
                }

                conn.payloads.forEach((payload) => {
                    const speedMultiplier = conn.progress > 1 ? 1.5 : 1;
                    payload.progress += payload.speed * speedMultiplier * delta * 60;

                    if (payload.progress > 1) {
                        payload.progress = 0;
                    }

                    const pos = conn.curve.getPoint(payload.progress);
                    payload.mesh.position.copy(pos);
                    payload.mesh.scale.setScalar(
                        0.8 + Math.sin(elapsed * 3 + payload.progress * 10) * 0.2
                    );
                });
            });

            if (elapsed > nextConnectionChange) {
                nextConnectionChange = elapsed + 12 + Math.random() * 6;

                const activeConnections = connections.filter((connection) => connection.active);
                const toDeactivate = activeConnections.slice(0, 2 + Math.floor(Math.random() * 2));
                toDeactivate.forEach((conn) => deactivateConnection(conn));

                const inactiveConnections = connections.filter((connection) => !connection.active);
                const toActivate = inactiveConnections.slice(0, toDeactivate.length);
                toActivate.forEach((conn) => {
                    conn.active = true;
                    conn.progress = 0;
                    createTube(conn);
                    activateConnection(conn);
                });
            }

            camera.position.x = Math.sin(elapsed * 0.05) * 2;
            camera.position.y = Math.cos(elapsed * 0.07) * 1;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        };
        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener("resize", handleResize);

            nodes.forEach((node) => {
                if (node.mesh) {
                    node.mesh.geometry.dispose();
                    (node.mesh.material as THREE.Material).dispose();
                }
            });

            connections.forEach((conn) => {
                if (conn.tube) {
                    conn.tube.geometry.dispose();
                    (conn.tube.material as THREE.Material).dispose();
                }
                if (conn.contractMesh) {
                    conn.contractMesh.geometry.dispose();
                    (conn.contractMesh.material as THREE.Material).dispose();
                }
                if (conn.lockMesh) {
                    conn.lockMesh.children.forEach((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.geometry.dispose();
                            (child.material as THREE.Material).dispose();
                        }
                    });
                }
            });

            payloadGeometry.dispose();
            payloadMaterial.dispose();
            renderer.dispose();
            container.removeChild(renderer.domElement);
        };
    }, [isMobile, prefersReducedMotion]);

    if (!isClient) {
        return <div className="absolute inset-0 bg-gradient-to-br from-[#0B1C2D] via-[#0F2438] to-[#0B1C2D]" />;
    }

    if (isMobile || prefersReducedMotion) {
        return (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0B1C2D] via-[#0F2438] to-[#0B1C2D]">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#1BC47D] rounded-full blur-[100px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#3B82F6] rounded-full blur-[100px]" />
                </div>
            </div>
        );
    }

    return <div ref={containerRef} className="absolute inset-0" style={{ pointerEvents: "none" }} />;
}
