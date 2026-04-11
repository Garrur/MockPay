"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sphere, Line, MeshDistortMaterial, GradientTexture, Environment, Stars } from "@react-three/drei";
import * as THREE from "three";

// ── Pulsing Node ─────────────────────────────────────────────
function PaymentNode({
  position,
  color,
  size = 0.12,
  pulseSpeed = 1,
  active = false,
}: {
  position: [number, number, number];
  color: string;
  size?: number;
  pulseSpeed?: number;
  active?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.5 * pulseSpeed;
      const s = 1 + Math.sin(t * pulseSpeed * 2) * 0.06;
      meshRef.current.scale.setScalar(s);
    }
    if (outerRef.current) {
      const s2 = 1 + Math.sin(t * pulseSpeed * 2 + 1) * 0.15;
      outerRef.current.scale.setScalar(s2);
      (outerRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.1 + Math.sin(t * pulseSpeed * 2) * 0.06;
    }
  });

  return (
    <group position={position}>
      {/* Outer glow ring */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[size * 2.5, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>
      {/* Core sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 24, 24]} />
        <MeshDistortMaterial
          color={color}
          envMapIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0}
          metalness={0.2}
          roughness={0.05}
          distort={active ? 0.3 : 0.1}
          speed={active ? 2 : 0.8}
        />
      </mesh>
    </group>
  );
}

// ── Animated Connection Line ─────────────────────────────────
function FlowLine({
  start,
  end,
  color,
  progress = 1,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  progress?: number;
}) {
  const lineRef = useRef<any>(null);

  const points = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = s.clone().lerp(e, 0.5);
    mid.y += 0.3;
    const curve = new THREE.QuadraticBezierCurve3(s, mid, e);
    return curve.getPoints(32);
  }, [start, end]);

  useFrame(({ clock }) => {
    if (lineRef.current) {
      const t = (clock.getElapsedTime() * 0.4) % 1;
      lineRef.current.material.dashOffset = -t * 2;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      lineWidth={1.5}
      transparent
      opacity={0.6}
      dashed
      dashSize={0.15}
      gapSize={0.1}
    />
  );
}

// ── Floating Data Particle ───────────────────────────────────
function DataParticle({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  const speed = useMemo(() => 0.3 + Math.random() * 0.5, []);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();
      ref.current.position.y = position[1] + Math.sin(t * speed + offset) * 0.2;
      ref.current.position.x = position[0] + Math.cos(t * speed * 0.7 + offset) * 0.1;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[0.025, 0.025, 0.025]} />
      <meshBasicMaterial color="#8b5cf6" transparent opacity={0.6} />
    </mesh>
  );
}

// ── Camera Motion ────────────────────────────────────────────
function CameraRig({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const { camera } = useThree();

  useFrame(() => {
    camera.position.x += (mouse.current.x * 0.4 - camera.position.x) * 0.05;
    camera.position.y += (mouse.current.y * 0.2 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ── Background Grid Plane ───────────────────────────────────
function GridPlane() {
  const size = 14;
  const divisions = 18;
  return (
    <gridHelper
      args={[size, divisions, "#d6d3d1", "#e7e5e4"]}
      position={[0, -1.8, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

// ── Main Scene ───────────────────────────────────────────────
function Scene({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  // Node layout: Created → Processing → Success
  const nodes: Array<{ pos: [number, number, number]; color: string; label: string; active: boolean }> = [
    { pos: [-2.2, 0, 0], color: "#60a5fa", label: "Created", active: false },
    { pos: [0, 0.4, 0], color: "#a78bfa", label: "Processing", active: true },
    { pos: [2.2, 0, 0], color: "#34d399", label: "Success", active: false },
  ];

  const particles: [number, number, number][] = useMemo(
    () =>
      Array.from({ length: 30 }, () => [
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4 - 1,
      ] as [number, number, number]),
    []
  );

  return (
    <>
      <CameraRig mouse={mouse} />
      <GridPlane />
      
      {/* Ambient + Directional lighting */}
      <ambientLight intensity={0.8} />
      <pointLight position={[-2.2, 2, 1]} intensity={5} color="#60a5fa" distance={6} decay={2} />
      <pointLight position={[0, 3, 0]} intensity={6} color="#c084fc" distance={8} decay={2} />
      <pointLight position={[2.2, 2, 1]} intensity={5} color="#34d399" distance={6} decay={2} />

      {/* Connection Lines */}
      <FlowLine start={[-2.2, 0, 0]} end={[0, 0.4, 0]} color="#7c3aed" />
      <FlowLine start={[0, 0.4, 0]} end={[2.2, 0, 0]} color="#34d399" />

      {/* Payment flow nodes */}
      {nodes.map((n, i) => (
        <Float key={i} speed={1.4} rotationIntensity={0.2} floatIntensity={n.active ? 0.5 : 0.3}>
          <PaymentNode
            position={n.pos}
            color={n.color}
            size={i === 1 ? 0.18 : 0.12}
            pulseSpeed={i === 1 ? 1.5 : 1}
            active={n.active}
          />
        </Float>
      ))}

      {/* Background floating particles */}
      {particles.map((pos, i) => (
        <DataParticle key={i} position={pos} />
      ))}
    </>
  );
}

// ── Exported Component ────────────────────────────────────────
export function PaymentFlowScene({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Scene mouse={mouse} />
        </Suspense>
      </Canvas>
    </div>
  );
}
