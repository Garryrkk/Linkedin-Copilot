"use client";

import { useSyncExternalStore } from "react";

let webglSupportCache: boolean | null = null;

function detectWebGL() {
  if (webglSupportCache !== null) return webglSupportCache;
  try {
    const canvas = document.createElement("canvas");
    webglSupportCache = Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    webglSupportCache = false;
  }
  return webglSupportCache;
}

function subscribe(callback: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  return !prefersReducedMotion && detectWebGL();
}

function getServerSnapshot() {
  return false;
}

export function useCanRender3D() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
