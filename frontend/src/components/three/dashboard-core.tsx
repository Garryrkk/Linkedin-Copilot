"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SceneCanvas } from "./scene-canvas";

function buildRingParticles() {
  const count = 220;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const radius = 2.6 + Math.random() * 0.6;
    const angle = Math.random() * Math.PI * 2;
    const tilt = (Math.random() - 0.5) * 0.6;
    arr[i * 3] = Math.cos(angle) * radius;
    arr[i * 3 + 1] = tilt * radius;
    arr[i * 3 + 2] = Math.sin(angle) * radius;
  }
  return arr;
}

const RING_PARTICLES = buildRingParticles();

function CoreScene() {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const particles = RING_PARTICLES;

  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.18;
      coreRef.current.rotation.x += delta * 0.05;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.04;
      coreRef.current.scale.setScalar(pulse);
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.3;
    }
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 0.04;
      ringRef.current.rotation.z += delta * 0.012;
    }
  });

  return (
    <>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshBasicMaterial color="#5eead4" wireframe transparent opacity={0.55} />
      </mesh>
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.9, 0]} />
        <meshBasicMaterial color="#7c3aed" wireframe transparent opacity={0.4} />
      </mesh>
      <group ref={ringRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[particles, 3]} />
          </bufferGeometry>
          <pointsMaterial color="#3b82f6" size={0.045} transparent opacity={0.8} />
        </points>
      </group>
      <ambientLight intensity={0.7} />
      <pointLight position={[3, 3, 5]} intensity={30} color="#5eead4" />
    </>
  );
}

export function DashboardCoreScene({ className }: { className?: string }) {
  return (
    <SceneCanvas className={className} cameraPosition={[0, 0, 7]} fov={42}>
      <CoreScene />
    </SceneCanvas>
  );
}
