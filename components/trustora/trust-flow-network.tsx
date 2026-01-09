"use client";

import { useEffect, useRef } from "react";

const CLIENT_COUNT = 60;
const PROFESSIONAL_COUNT = 60;
const MAX_CONNECTIONS = 12;
const PARTICLES_PER_CONNECTION = 8;
const BOUNDS = 4.2;

const loadThree = () =>
    new Promise<any>((resolve, reject) => {
        if (typeof window === "undefined") {
            reject(new Error("Window not available"));
            return;
        }
        if ((window as typeof window & { THREE?: unknown }).THREE) {
            resolve((window as typeof window & { THREE?: unknown }).THREE);
            return;
        }
        const existingScript = document.querySelector<HTMLScriptElement>("script[data-three]");
        if (existingScript) {
            existingScript.addEventListener("load", () => {
                resolve((window as typeof window & { THREE?: unknown }).THREE);
            });
            return;
        }
        const script = document.createElement("script");
        script.src = "https://unpkg.com/three@0.168.0/build/three.min.js";
        script.async = true;
        script.dataset.three = "true";
        script.addEventListener("load", () => {
            resolve((window as typeof window & { THREE?: unknown }).THREE);
        });
        script.addEventListener("error", () => {
            reject(new Error("Failed to load Three.js"));
        });
        document.head.appendChild(script);
    });

const createLockTexture = (THREE: any) => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(32, 26, 14, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(18, 28, 28, 24);
    ctx.clearRect(28, 38, 8, 8);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
};

export function TrustFlowNetwork() {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let isMounted = true;
        const container = containerRef.current;
        if (!container) {
            return undefined;
        }

        let cleanup: (() => void) | undefined;

        loadThree()
            .then((THREE) => {
                if (!isMounted) {
                    return;
                }
                const lockTexture = createLockTexture(THREE);
                if (!lockTexture) {
                    return;
                }

                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
                camera.position.set(0, 1.2, 9);

                const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                renderer.setClearColor(0x000000, 0);
                renderer.setSize(container.clientWidth, container.clientHeight);
                container.appendChild(renderer.domElement);

                const ambient = new THREE.AmbientLight(0xffffff, 0.8);
                const directional = new THREE.DirectionalLight(0xffffff, 0.8);
                directional.position.set(4, 6, 5);
                scene.add(ambient, directional);

                const clientGeometry = new THREE.IcosahedronGeometry(0.085, 1);
                const proGeometry = new THREE.IcosahedronGeometry(0.095, 1);
                const clientMaterial = new THREE.MeshStandardMaterial({
                    color: new THREE.Color("#2E80FF"),
                    emissive: new THREE.Color("#173C85"),
                    emissiveIntensity: 0.6,
                    roughness: 0.3,
                });
                const proMaterial = new THREE.MeshStandardMaterial({
                    color: new THREE.Color("#1BC47D"),
                    emissive: new THREE.Color("#0B6142"),
                    emissiveIntensity: 0.7,
                    roughness: 0.2,
                });

                const clientsMesh = new THREE.InstancedMesh(clientGeometry, clientMaterial, CLIENT_COUNT);
                const prosMesh = new THREE.InstancedMesh(proGeometry, proMaterial, PROFESSIONAL_COUNT);
                clientsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                prosMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                scene.add(clientsMesh, prosMesh);

                const contractGeometry = new THREE.BoxGeometry(0.22, 0.22, 0.22);
                const contractMaterial = new THREE.MeshStandardMaterial({
                    color: new THREE.Color("#FFFFFF"),
                    emissive: new THREE.Color("#DDF7FF"),
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.9,
                    roughness: 0.3,
                });
                const contractsMesh = new THREE.InstancedMesh(contractGeometry, contractMaterial, MAX_CONNECTIONS);
                contractsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                scene.add(contractsMesh);

                const lockSprites = Array.from({ length: MAX_CONNECTIONS }, () => {
                    const material = new THREE.SpriteMaterial({
                        map: lockTexture,
                        transparent: true,
                        opacity: 0,
                        depthWrite: false,
                        blending: THREE.AdditiveBlending,
                    });
                    const sprite = new THREE.Sprite(material);
                    sprite.scale.set(0.5, 0.5, 0.5);
                    scene.add(sprite);
                    return sprite;
                });

                const linePositions = new Float32Array(MAX_CONNECTIONS * 4 * 3);
                const lineGeometry = new THREE.BufferGeometry();
                lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
                const lineMaterial = new THREE.ShaderMaterial({
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending,
                    uniforms: {
                        color: { value: new THREE.Color("#1BC47D") },
                        opacity: { value: 0.6 },
                    },
                    vertexShader: `
                        varying float vIntensity;
                        void main() {
                            vIntensity = 1.0;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform vec3 color;
                        uniform float opacity;
                        varying float vIntensity;
                        void main() {
                            gl_FragColor = vec4(color, opacity * vIntensity);
                        }
                    `,
                });
                const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
                scene.add(lines);

                const particleCount = MAX_CONNECTIONS * PARTICLES_PER_CONNECTION;
                const particlePositions = new Float32Array(particleCount * 3);
                const particleGeometry = new THREE.BufferGeometry();
                particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
                const particleMaterial = new THREE.PointsMaterial({
                    color: new THREE.Color("#26F59A"),
                    size: 0.06,
                    transparent: true,
                    opacity: 0.9,
                    blending: THREE.AdditiveBlending,
                });
                const particles = new THREE.Points(particleGeometry, particleMaterial);
                scene.add(particles);

                const clientPositions = new Array<any>(CLIENT_COUNT);
                const clientVelocities = new Array<any>(CLIENT_COUNT);
                const proPositions = new Array<any>(PROFESSIONAL_COUNT);
                const proVelocities = new Array<any>(PROFESSIONAL_COUNT);
                const tempObject = new THREE.Object3D();

                for (let i = 0; i < CLIENT_COUNT; i += 1) {
                    clientPositions[i] = new THREE.Vector3(
                        (Math.random() - 0.5) * BOUNDS,
                        (Math.random() - 0.5) * BOUNDS,
                        (Math.random() - 0.5) * BOUNDS,
                    );
                    clientVelocities[i] = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.06,
                        (Math.random() - 0.5) * 0.06,
                        (Math.random() - 0.5) * 0.06,
                    );
                    tempObject.position.copy(clientPositions[i]);
                    tempObject.updateMatrix();
                    clientsMesh.setMatrixAt(i, tempObject.matrix);
                }

                for (let i = 0; i < PROFESSIONAL_COUNT; i += 1) {
                    proPositions[i] = new THREE.Vector3(
                        (Math.random() - 0.5) * BOUNDS,
                        (Math.random() - 0.5) * BOUNDS,
                        (Math.random() - 0.5) * BOUNDS,
                    );
                    proVelocities[i] = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.05,
                        (Math.random() - 0.5) * 0.05,
                        (Math.random() - 0.5) * 0.05,
                    );
                    tempObject.position.copy(proPositions[i]);
                    tempObject.updateMatrix();
                    prosMesh.setMatrixAt(i, tempObject.matrix);
                }

                clientsMesh.instanceMatrix.needsUpdate = true;
                prosMesh.instanceMatrix.needsUpdate = true;

                type Connection = {
                    clientIndex: number;
                    proIndex: number;
                    age: number;
                    duration: number;
                };

                const connections: Connection[] = [];
                const particleMeta: { connectionIndex: number; progress: number; speed: number }[] = [];

                const buildConnections = () => {
                    connections.length = 0;
                    particleMeta.length = 0;
                    for (let i = 0; i < MAX_CONNECTIONS; i += 1) {
                        connections.push({
                            clientIndex: Math.floor(Math.random() * CLIENT_COUNT),
                            proIndex: Math.floor(Math.random() * PROFESSIONAL_COUNT),
                            age: Math.random() * 3,
                            duration: 10 + Math.random() * 5,
                        });
                        for (let j = 0; j < PARTICLES_PER_CONNECTION; j += 1) {
                            particleMeta.push({
                                connectionIndex: i,
                                progress: Math.random(),
                                speed: 0.08 + Math.random() * 0.08,
                            });
                        }
                    }
                };

                buildConnections();

                const handleResize = () => {
                    const { clientWidth, clientHeight } = container;
                    camera.aspect = clientWidth / clientHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(clientWidth, clientHeight);
                };
                window.addEventListener("resize", handleResize);

                let animationFrameId = 0;
                let lastTime = performance.now();
                const updateScene = (time: number) => {
                    const delta = Math.min(0.033, (time - lastTime) / 1000);
                    lastTime = time;

                    for (let i = 0; i < CLIENT_COUNT; i += 1) {
                        const position = clientPositions[i];
                        position.addScaledVector(clientVelocities[i], delta);
                        if (position.length() > BOUNDS) {
                            position.setLength(BOUNDS);
                            clientVelocities[i].multiplyScalar(-1);
                        }
                        tempObject.position.copy(position);
                        tempObject.updateMatrix();
                        clientsMesh.setMatrixAt(i, tempObject.matrix);
                    }

                    for (let i = 0; i < PROFESSIONAL_COUNT; i += 1) {
                        const position = proPositions[i];
                        position.addScaledVector(proVelocities[i], delta);
                        if (position.length() > BOUNDS) {
                            position.setLength(BOUNDS);
                            proVelocities[i].multiplyScalar(-1);
                        }
                        tempObject.position.copy(position);
                        tempObject.updateMatrix();
                        prosMesh.setMatrixAt(i, tempObject.matrix);
                    }

                    clientsMesh.instanceMatrix.needsUpdate = true;
                    prosMesh.instanceMatrix.needsUpdate = true;

                    const timeSeconds = time * 0.0003;
                    camera.position.x = Math.sin(timeSeconds) * 7.5;
                    camera.position.z = Math.cos(timeSeconds) * 7.5;
                    camera.position.y = Math.sin(timeSeconds * 0.7) * 1.4 + 1.2;
                    camera.lookAt(0, 0, 0);

                    let lineOffset = 0;
                    for (let i = 0; i < connections.length; i += 1) {
                        const connection = connections[i];
                        connection.age += delta;
                        const client = clientPositions[connection.clientIndex];
                        const pro = proPositions[connection.proIndex];
                        const escrowX = (client.x + pro.x) * 0.5;
                        const escrowY = (client.y + pro.y) * 0.5 + 0.25;
                        const escrowZ = (client.z + pro.z) * 0.5;

                        linePositions[lineOffset] = client.x;
                        linePositions[lineOffset + 1] = client.y;
                        linePositions[lineOffset + 2] = client.z;
                        linePositions[lineOffset + 3] = escrowX;
                        linePositions[lineOffset + 4] = escrowY;
                        linePositions[lineOffset + 5] = escrowZ;
                        linePositions[lineOffset + 6] = escrowX;
                        linePositions[lineOffset + 7] = escrowY;
                        linePositions[lineOffset + 8] = escrowZ;
                        linePositions[lineOffset + 9] = pro.x;
                        linePositions[lineOffset + 10] = pro.y;
                        linePositions[lineOffset + 11] = pro.z;
                        lineOffset += 12;

                        const pulse = Math.sin(Math.min(connection.age / 1.2, 1) * Math.PI);
                        const scale = 1 + pulse * 0.35;
                        tempObject.position.set(escrowX, escrowY, escrowZ);
                        tempObject.scale.set(scale, scale, scale);
                        tempObject.updateMatrix();
                        contractsMesh.setMatrixAt(i, tempObject.matrix);

                        const lock = lockSprites[i];
                        lock.position.set(escrowX, escrowY + 0.25, escrowZ);
                        const lockOpacity = Math.min(Math.max((connection.age - 1.4) / 1.4, 0), 1);
                        lock.material.opacity = lockOpacity;

                        if (connection.age > connection.duration) {
                            connection.age = 0;
                            connection.duration = 10 + Math.random() * 5;
                            connection.clientIndex = Math.floor(Math.random() * CLIENT_COUNT);
                            connection.proIndex = Math.floor(Math.random() * PROFESSIONAL_COUNT);
                        }
                    }

                    contractsMesh.instanceMatrix.needsUpdate = true;
                    lineGeometry.attributes.position.needsUpdate = true;

                    for (let i = 0; i < particleMeta.length; i += 1) {
                        const meta = particleMeta[i];
                        const connection = connections[meta.connectionIndex];
                        const client = clientPositions[connection.clientIndex];
                        const pro = proPositions[connection.proIndex];
                        const escrowX = (client.x + pro.x) * 0.5;
                        const escrowY = (client.y + pro.y) * 0.5 + 0.25;
                        const escrowZ = (client.z + pro.z) * 0.5;

                        const lockBoost = connection.age > 1.4 ? 1.4 : 1;
                        meta.progress = (meta.progress + delta * meta.speed * lockBoost) % 1;
                        const segmentProgress = meta.progress < 0.5 ? meta.progress * 2 : (meta.progress - 0.5) * 2;

                        let x = 0;
                        let y = 0;
                        let z = 0;

                        if (meta.progress < 0.5) {
                            x = client.x + (escrowX - client.x) * segmentProgress;
                            y = client.y + (escrowY - client.y) * segmentProgress;
                            z = client.z + (escrowZ - client.z) * segmentProgress;
                        } else {
                            x = escrowX + (pro.x - escrowX) * segmentProgress;
                            y = escrowY + (pro.y - escrowY) * segmentProgress;
                            z = escrowZ + (pro.z - escrowZ) * segmentProgress;
                        }

                        const particleOffset = i * 3;
                        particlePositions[particleOffset] = x;
                        particlePositions[particleOffset + 1] = y;
                        particlePositions[particleOffset + 2] = z;
                    }

                    particleGeometry.attributes.position.needsUpdate = true;

                    renderer.render(scene, camera);
                    animationFrameId = requestAnimationFrame(updateScene);
                };

                animationFrameId = requestAnimationFrame(updateScene);

                cleanup = () => {
                    cancelAnimationFrame(animationFrameId);
                    window.removeEventListener("resize", handleResize);
                    renderer.dispose();
                    clientGeometry.dispose();
                    proGeometry.dispose();
                    contractGeometry.dispose();
                    lineGeometry.dispose();
                    particleGeometry.dispose();
                    clientMaterial.dispose();
                    proMaterial.dispose();
                    contractMaterial.dispose();
                    lineMaterial.dispose();
                    particleMaterial.dispose();
                    lockTexture.dispose();
                    lockSprites.forEach((sprite) => {
                        sprite.material.dispose();
                        scene.remove(sprite);
                    });
                    container.removeChild(renderer.domElement);
                };
            })
            .catch(() => {
                // Silent fail if Three.js cannot load.
            });

        return () => {
            isMounted = false;
            if (cleanup) {
                cleanup();
            }
        };
    }, []);

    return <div ref={containerRef} className="h-full w-full" aria-hidden="true" />;
}
