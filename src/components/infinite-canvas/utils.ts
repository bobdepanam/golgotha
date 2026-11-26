import * as THREE from "three";
import { CHUNK_SIZE } from "./constants";
import type { PlaneData } from "./types";

const hashString = (s: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const MAX_PLANE_CACHE = 256;
const planeCache = new Map<string, PlaneData[]>();

const touchPlaneCache = (key: string) => {
  const v = planeCache.get(key);
  if (!v) {
    return;
  }

  planeCache.delete(key);
  planeCache.set(key, v);
};

const evictPlaneCache = () => {
  while (planeCache.size > MAX_PLANE_CACHE) {
    const firstKey = planeCache.keys().next().value as string | undefined;
    if (!firstKey) break;
    planeCache.delete(firstKey);
  }
};

export const getChunkUpdateThrottleMs = (
  isZooming: boolean,
  zoomSpeed: number,
): number => {
  if (zoomSpeed > 1.0) {
    return 500;
  }

  if (isZooming) {
    return 400;
  }

  return 100;
};

export const getMediaDimensions = (media: HTMLImageElement | undefined) => {
  const width =
    media instanceof HTMLImageElement
      ? media.naturalWidth || media.width
      : undefined;
  const height =
    media instanceof HTMLImageElement
      ? media.naturalHeight || media.height
      : undefined;
  return { width, height };
};

const ITEMS_PER_CHUNK = 3;
const SIZE_MIN = 9;
const SIZE_MAX = 25;

/**
 * Plan unité (-0.5…0.5) aux angles très légèrement arrondis (7.1), pour un visuel de rapport
 * `aspect` (mis à l'échelle hauteur × aspect) : rayons elliptiques en espace unité, circulaires
 * à l'écran. Mis en cache par rapport arrondi ; UV recalculées sur 0…1.
 */
const RADIUS = 0.018; // fraction de la hauteur du visuel
const roundedCache = new Map<string, THREE.ShapeGeometry>();
export const getRoundedPlane = (aspect: number): THREE.BufferGeometry => {
  const key = aspect.toFixed(2);
  const hit = roundedCache.get(key);
  if (hit) return hit;
  const ry = RADIUS;
  const rx = Math.min(0.5, RADIUS / Math.max(0.05, aspect));
  const shape = new THREE.Shape();
  const seg = 5;
  const corner = (cx: number, cy: number, a0: number, first: boolean) => {
    for (let k = 0; k <= seg; k++) {
      const a = a0 + (k / seg) * (Math.PI / 2);
      const x = cx + Math.cos(a) * rx;
      const y = cy + Math.sin(a) * ry;
      if (first && k === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
  };
  corner(0.5 - rx, -0.5 + ry, -Math.PI / 2, true);
  corner(0.5 - rx, 0.5 - ry, 0, false);
  corner(-0.5 + rx, 0.5 - ry, Math.PI / 2, false);
  corner(-0.5 + rx, -0.5 + ry, Math.PI, false);
  const g = new THREE.ShapeGeometry(shape);
  const pos = g.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let k = 0; k < pos.count; k++) {
    uv[k * 2] = pos.getX(k) + 0.5;
    uv[k * 2 + 1] = pos.getY(k) + 0.5;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  roundedCache.set(key, g);
  return g;
};

export const generateChunkPlanes = (
  cx: number,
  cy: number,
  cz: number,
): PlaneData[] => {
  const planes: PlaneData[] = [];
  const seed = hashString(`${cx},${cy},${cz}`);

  // 7.1 (Golgotha × ALTAR) : densité réduite (3 visuels par zone, beaucoup de respiration) et
  // tailles plus contrastées mais maîtrisées — majorité de petits formats, quelques grands.
  for (let i = 0; i < ITEMS_PER_CHUNK; i++) {
    const s = seed + i * 1000;
    const r = (n: number) => seededRandom(s + n);
    const size = SIZE_MIN + Math.pow(r(4), 1.6) * (SIZE_MAX - SIZE_MIN);

    planes.push({
      id: `${cx}-${cy}-${cz}-${i}`,
      position: new THREE.Vector3(
        cx * CHUNK_SIZE + r(0) * CHUNK_SIZE,
        cy * CHUNK_SIZE + r(1) * CHUNK_SIZE,
        cz * CHUNK_SIZE + r(2) * CHUNK_SIZE,
      ),
      scale: new THREE.Vector3(size, size, 1),
      mediaIndex: Math.floor(r(5) * 1_000_000),
    });
  }

  return planes;
};

export const generateChunkPlanesCached = (
  cx: number,
  cy: number,
  cz: number,
): PlaneData[] => {
  const key = `${cx},${cy},${cz}`;
  const cached = planeCache.get(key);
  if (cached) {
    touchPlaneCache(key);
    return cached;
  }

  const planes = generateChunkPlanes(cx, cy, cz);
  planeCache.set(key, planes);
  evictPlaneCache();
  return planes;
};

export const shouldThrottleUpdate = (
  lastUpdateTime: number,
  throttleMs: number,
  currentTime: number,
): boolean => {
  return currentTime - lastUpdateTime >= throttleMs;
};
