"use client";

import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import type { ReactNode } from "react";
import { useCanRender3D } from "@/lib/motion/use-can-render-3d";
import { AnimatedGradientFallback } from "@/components/shared/animated-gradient-fallback";
import { cn } from "@/lib/utils";

interface SceneCanvasProps {
  children: ReactNode;
  className?: string;
  cameraPosition?: [number, number, number];
  fov?: number;
  bloomIntensity?: number;
}

export function SceneCanvas({
  children,
  className,
  cameraPosition = [0, 0, 8],
  fov = 45,
  bloomIntensity = 0.9,
}: SceneCanvasProps) {
  const canRender3D = useCanRender3D();

  if (!canRender3D) {
    return <AnimatedGradientFallback className={cn("absolute inset-0", className)} />;
  }

  return (
    <Canvas
      className={cn("absolute inset-0", className)}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: cameraPosition, fov }}
    >
      {children}
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.35}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
