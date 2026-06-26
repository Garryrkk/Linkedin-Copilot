"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SceneCanvas } from "./scene-canvas";

const NODE_COUNT = 56;
const NEIGHBOR_DIST = 2.6;
const PALETTE = ["#5eead4", "#7c3aed", "#3b82f6"];

function buildNetwork() {
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const r = 4.6 * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions.push(
      new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.6,
        r * Math.cos(phi) * 0.7
      )
    );
  }

  const edgePoints: number[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      if (positions[i].distanceTo(positions[j]) < NEIGHBOR_DIST) {
        edgePoints.push(positions[i].x, positions[i].y, positions[i].z);
        edgePoints.push(positions[j].x, positions[j].y, positions[j].z);
      }
    }
  }

  return { positions, edgePoints: new Float32Array(edgePoints) };
}

const NETWORK = buildNetwork();

function NetworkScene() {
  const groupRef = useRef<THREE.Group>(null);
  const { positions, edgePoints } = NETWORK;
  const { pointer } = useThree();

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(edgePoints, 3));
    return geometry;
  }, [edgePoints]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.06;
    const targetX = pointer.y * 0.25;
    const targetY = pointer.x * 0.35;
    groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.04;
    groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.01;
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color="#5eead4" transparent opacity={0.18} />
      </lineSegments>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.045 + (i % 3) * 0.01, 12, 12]} />
          <meshBasicMaterial
            color={PALETTE[i % PALETTE.length]}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
      <ambientLight intensity={0.6} />
      <pointLight position={[4, 4, 4]} intensity={40} color="#5eead4" />
    </group>
  );
}

export function AmbientNetworkScene({ className }: { className?: string }) {
  return (
    <SceneCanvas className={className} cameraPosition={[0, 0, 9]} fov={50}>
      <NetworkScene />
    </SceneCanvas>
  );
}
