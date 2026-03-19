"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

// Floating crystal shard
function Shard({
  position,
  rotation,
  color,
  scale,
  speed,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  scale: number;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.x = rotation[0] + t * speed * 0.3;
    ref.current.rotation.y = rotation[1] + t * speed * 0.5;
    ref.current.rotation.z = rotation[2] + t * speed * 0.2;
    ref.current.position.y = position[1] + Math.sin(t * speed + offset) * 0.4;
    ref.current.position.x = position[0] + Math.cos(t * speed * 0.7 + offset) * 0.2;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <octahedronGeometry args={[0.35, 0]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.12}
        wireframe
        roughness={0.3}
        metalness={0.8}
      />
    </mesh>
  );
}

// Glowing sphere at center
function CoreSphere({ status }: { status: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const color = status === "success" ? "#34d399" : status === "failed" ? "#ef4444" : status === "pending" ? "#fbbf24" : "#7c3aed";

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * 0.15;
    ref.current.rotation.x = t * 0.08;
    const s = 1 + Math.sin(t * 0.8) * 0.04;
    ref.current.scale.setScalar(s);
  });

  return (
    <>
      {/* Outer glow shell */}
      <mesh>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.02} side={THREE.BackSide} />
      </mesh>
      {/* Wireframe sphere */}
      <mesh ref={ref}>
        <icosahedronGeometry args={[2, 1]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.07}
          wireframe
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
    </>
  );
}

// Grid plane
function GridFloor() {
  return (
    <gridHelper
      args={[30, 30, "#1a1030", "#0d0820"]}
      position={[0, -3.5, 0]}
    />
  );
}

// Orbiting ring particles
function OrbitRing({ radius, speed, color }: { radius: number; speed: number; color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const count = 24;
  const angles = useMemo(() => Array.from({ length: count }, (_, i) => (i / count) * Math.PI * 2), []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * speed;
      groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {angles.map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ status }: { status: string }) {
  const shards = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        position: [
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 8 - 4,
        ] as [number, number, number],
        rotation: [
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI,
        ] as [number, number, number],
        color: ["#7c3aed", "#4f46e5", "#3b82f6", "#8b5cf6"][Math.floor(Math.random() * 4)],
        scale: 0.4 + Math.random() * 1.2,
        speed: 0.2 + Math.random() * 0.4,
      })),
    []
  );

  const ringColor = status === "success" ? "#34d399" : status === "failed" ? "#ef4444" : status === "pending" ? "#fbbf24" : "#7c3aed";

  return (
    <>
      <Stars radius={60} depth={40} count={800} factor={3} saturation={0} fade speed={0.5} />
      <GridFloor />
      <CoreSphere status={status} />
      <OrbitRing radius={3.5} speed={0.15} color={ringColor} />
      <OrbitRing radius={5} speed={-0.08} color="#4f46e5" />

      {shards.map((s) => <Shard key={s.id} {...s} />)}

      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 2]} intensity={6} color={ringColor} distance={12} decay={2} />
      <pointLight position={[-6, 4, -2]} intensity={4} color="#4f46e5" distance={15} decay={2} />
      <pointLight position={[6, -4, 2]} intensity={3} color="#3b82f6" distance={12} decay={2} />
    </>
  );
}

export function CheckoutScene({ status }: { status: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 55 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        <Scene status={status} />
      </Suspense>
    </Canvas>
  );
}
