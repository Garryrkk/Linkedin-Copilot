"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { SceneCanvas } from "./scene-canvas";
import { cn } from "@/lib/utils";

export interface ConstellationNode {
  key: string;
  name: string;
  color: string;
}

const LAYOUT: [number, number, number][] = [
  [-2.6, 1.1, 0.4],
  [2.4, 0.6, -0.8],
  [-1.4, -1.4, 0.9],
  [1.8, -1, -0.3],
  [0, 1.8, -0.6],
  [-2.2, -0.4, -1],
  [2.6, -1.2, 0.6],
];

function StrategyNode({
  node,
  position,
  isSelected,
  onSelect,
}: {
  node: ConstellationNode;
  position: [number, number, number];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.position.y =
      position[1] + Math.sin(t * 0.8 + position[0]) * 0.12;
    const targetScale = isSelected ? 1.35 : hovered ? 1.15 : 1;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.12
    );
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <icosahedronGeometry args={[0.5, 1]} />
      <meshBasicMaterial
        color={node.color}
        wireframe={!isSelected}
        transparent
        opacity={isSelected ? 0.9 : 0.55}
      />
      <Html distanceFactor={8} position={[0, -0.9, 0]} center>
        <div
          className={cn(
            "whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md transition-colors",
            isSelected
              ? "border-accent-teal/60 bg-accent-teal/10 text-accent-teal"
              : "border-white/10 bg-black/30 text-highlight/70"
          )}
        >
          {node.name}
        </div>
      </Html>
    </mesh>
  );
}

function ConstellationScene({
  nodes,
  selectedKey,
  onSelect,
}: {
  nodes: ConstellationNode[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const lineGeometry = useMemo(() => {
    const points: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        points.push(...LAYOUT[i % LAYOUT.length], ...LAYOUT[j % LAYOUT.length]);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(points), 3)
    );
    return geometry;
  }, [nodes.length]);

  return (
    <>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color="#5eead4" transparent opacity={0.1} />
      </lineSegments>
      {nodes.map((node, i) => (
        <StrategyNode
          key={node.key}
          node={node}
          position={LAYOUT[i % LAYOUT.length]}
          isSelected={selectedKey === node.key}
          onSelect={() => onSelect(node.key)}
        />
      ))}
      <ambientLight intensity={0.7} />
      <pointLight position={[2, 2, 4]} intensity={25} color="#7c3aed" />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI * 0.65}
        minPolarAngle={Math.PI * 0.35}
      />
    </>
  );
}

export function StrategyConstellationScene({
  nodes,
  selectedKey,
  onSelect,
  className,
}: {
  nodes: ConstellationNode[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  className?: string;
}) {
  return (
    <SceneCanvas className={className} cameraPosition={[0, 0, 7.5]} fov={48}>
      <ConstellationScene nodes={nodes} selectedKey={selectedKey} onSelect={onSelect} />
    </SceneCanvas>
  );
}
