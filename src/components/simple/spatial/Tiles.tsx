'use client';

// Grille infinie : pool fixe de tuiles couvrant la zone visible au dézoom maximal (+ marge).
// Chaque tuile occupe une cellule logique (i, j) du plan infini ; quand elle sort d'un bord,
// elle réapparaît au bord opposé (hors champ) avec le produit de sa nouvelle cellule.
// Mêmes textures (une par produit, partagées par toutes ses occurrences), une seule géométrie.
// Effets par tuile repris de Simple (spatial/PhotoPlane.tsx) : profondeur, survol, proximité,
// courbure « fisheye » et micro-orientation, focus (avance + échelle) et atténuation.
// Une seule boucle useFrame pour tout le pool (pas un hook par tuile).

import { useTexture } from '@react-three/drei';
import { type ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { easing } from 'maath';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GRID_CONFIG, HALF_TAN, SPACING_X, SPACING_Y } from './config';
import { setCursorHover } from './cursor';
import { baseDepth, itemIndex, mod, pickStride } from './lattice';
import { useSpatialState } from './state';
import type { SpatialItem } from './types';

type Slot = {
  a: number; // colonne dans le pool
  b: number; // rangée dans le pool
  i: number; // cellule logique courante
  j: number;
  idx: number; // produit affiché (-1 : aucun)
  hovered: boolean;
  scale: THREE.Vector3; // facteur d'échelle animé (survol, proximité, focus)
};

/** Taille « contain » de l'image dans la boîte de tuile de Simple (aucune déformation). */
function containSize(item: SpatialItem) {
  const ratio = item.width && item.height ? item.width / item.height : 0.75;
  const box = GRID_CONFIG.tileWidth / GRID_CONFIG.tileHeight;
  return ratio > box
    ? { w: GRID_CONFIG.tileWidth, h: GRID_CONFIG.tileWidth / ratio }
    : { w: GRID_CONFIG.tileHeight * ratio, h: GRID_CONFIG.tileHeight };
}

export function Tiles({ items }: { items: SpatialItem[] }) {
  const s = useSpatialState();
  const { size, gl } = useThree();
  const n = items.length;

  const urls = useMemo(() => items.map((it) => it.thumb), [items]);
  const textures = useTexture(urls) as THREE.Texture[];
  useMemo(() => textures.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace)), [textures]);
  const sizes = useMemo(() => items.map(containSize), [items]);
  const stride = useMemo(() => pickStride(n), [n]);

  // Une géométrie pour toutes les tuiles (dimensions par mesh.scale)
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Pool : zone visible au dézoom maximal + marge, pour le rapport d'aspect courant
  const aspect = size.width / Math.max(1, size.height);
  const { cols, rows } = useMemo(() => {
    const visH = 2 * HALF_TAN * GRID_CONFIG.navZoomMax;
    const visW = visH * aspect;
    return {
      cols: Math.ceil(visW / SPACING_X) + 2 * GRID_CONFIG.poolMargin,
      rows: Math.ceil(visH / SPACING_Y) + 2 * GRID_CONFIG.poolMargin,
    };
  }, [aspect]);

  // Ordre d'apparition : du centre vers l'extérieur (apparition progressive, comme Simple)
  const slots = useMemo<Slot[]>(() => {
    const list: Slot[] = [];
    for (let b = 0; b < rows; b++)
      for (let a = 0; a < cols; a++) list.push({ a, b, i: NaN, j: NaN, idx: -1, hovered: false, scale: new THREE.Vector3(1, 1, 1) });
    const ca = (cols - 1) / 2;
    const cb = (rows - 1) / 2;
    return list.sort((p, q) => Math.hypot(p.a - ca, p.b - cb) - Math.hypot(q.a - ca, q.b - cb));
  }, [cols, rows]);

  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const revealed = useRef<number>(GRID_CONFIG.initialBatch);

  useFrame(({ camera }, delta) => {
    if (revealed.current < slots.length) revealed.current = Math.min(slots.length, revealed.current + GRID_CONFIG.batchSize);

    const offX = s.current.x;
    const offY = s.current.y;
    // Fenêtre du pool centrée sur la vue
    const iMin = Math.floor((-(cols * SPACING_X) / 2 - offX) / SPACING_X) + 1;
    const jMin = Math.floor((offY - (rows * SPACING_Y) / 2) / SPACING_Y) + 1;

    // Demi-étendue visible (normalisation de la micro-orientation, Sphere V2)
    const visHalfH = HALF_TAN * camera.position.z;
    const visHalfW = visHalfH * aspect;

    const curvT = Math.max(
      0,
      Math.min(1, (s.zoom - GRID_CONFIG.curvatureFadeStart) / (GRID_CONFIG.curvatureFadeEnd - GRID_CONFIG.curvatureFadeStart))
    );
    const focus = s.focus;
    const k12 = 1 - Math.exp(-12 * delta);
    const k8 = 1 - Math.exp(-8 * delta);

    for (let k = 0; k < slots.length; k++) {
      const mesh = meshes.current[k];
      if (!mesh) continue;
      const slot = slots[k];
      mesh.visible = k < revealed.current;
      if (!mesh.visible) continue;

      const i = iMin + mod(slot.a - iMin, cols);
      const j = jMin + mod(slot.b - jMin, rows);
      const wrapped = i !== slot.i || j !== slot.j;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (wrapped) {
        if (!Number.isNaN(slot.i)) s.stats.wraps += 1;
        slot.i = i;
        slot.j = j;
        slot.idx = itemIndex(i, j, n, stride);
        slot.hovered = false;
        mat.map = textures[slot.idx];
      }

      const worldX = i * SPACING_X + offX;
      const worldY = -j * SPACING_Y + offY;
      mesh.position.x = worldX;
      mesh.position.y = worldY;

      const z0 = baseDepth(i, j);
      const active = !!focus && focus.i === i && focus.j === j;
      const dimmed = !!focus && !active;
      const hov = slot.hovered && !focus;

      let proximity = 0;
      if (!hov && !focus) {
        const d = Math.hypot(worldX - s.pointer.worldX, worldY - s.pointer.worldY);
        const t = Math.max(0, 1 - d / GRID_CONFIG.proximityRadius);
        proximity = t * t;
      }

      const curvZ = -GRID_CONFIG.curvatureStrength * (worldX * worldX + worldY * worldY) * curvT;
      const nx = Math.max(-1, Math.min(1, worldX / visHalfW));
      const ny = Math.max(-1, Math.min(1, worldY / visHalfH));

      const targetZ =
        (active
          ? z0 + 1.5
          : dimmed
            ? z0 - 0.3
            : z0 + (hov ? GRID_CONFIG.hoverDepth : 0) + GRID_CONFIG.proximityDepth * proximity) + curvZ;
      const targetRotX = -ny * GRID_CONFIG.curvatureTiltMax * curvT;
      const targetRotY = nx * GRID_CONFIG.curvatureTiltMax * curvT;
      const targetScale = active ? 1.4 : dimmed ? 0.6 : hov ? GRID_CONFIG.hoverScale : 1 + GRID_CONFIG.proximityScale * proximity;
      const targetOpacity = dimmed ? 0.12 : 1;

      if (wrapped) {
        // Réapparition hors champ : état cible immédiat (aucune animation parasite)
        mesh.position.z = targetZ;
        mesh.rotation.set(targetRotX, targetRotY, 0);
        slot.scale.setScalar(targetScale);
        mat.opacity = targetOpacity;
      } else {
        mesh.position.z += (targetZ - mesh.position.z) * k12;
        mesh.rotation.x += (targetRotX - mesh.rotation.x) * k12;
        mesh.rotation.y += (targetRotY - mesh.rotation.y) * k12;
        easing.damp3(slot.scale, targetScale, 0.15, delta);
        mat.opacity += (targetOpacity - mat.opacity) * k8;
      }
      const sz = sizes[slot.idx];
      mesh.scale.set(sz.w * slot.scale.x, sz.h * slot.scale.y, 1);
    }
  });

  // Interactions (Simple) : clic = focus centré ; re-clic = sortie ; survol hors focus
  const onUp = (k: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (s.isDragging) return; // anti faux clic : la fin d'un drag n'est pas un clic
    const slot = slots[k];
    if (slot.idx < 0) return;
    if (s.focus && s.focus.i === slot.i && s.focus.j === slot.j) s.setFocus(null);
    else s.setFocus({ i: slot.i, j: slot.j, slug: items[slot.idx].slug });
  };
  const onEnter = (k: number) => () => {
    if (s.isDragging) return;
    const slot = slots[k];
    if (s.focus && (s.focus.i !== slot.i || s.focus.j !== slot.j)) return;
    slot.hovered = true;
    setCursorHover(gl.domElement, true);
  };
  const onLeave = (k: number) => () => {
    slots[k].hovered = false;
    setCursorHover(gl.domElement, false);
  };

  return (
    <>
      {slots.map((slot, k) => (
        <mesh
          key={`${slot.a}:${slot.b}`}
          ref={(m) => {
            meshes.current[k] = m;
          }}
          geometry={geometry}
          visible={false}
          onPointerUp={onUp(k)}
          onPointerEnter={onEnter(k)}
          onPointerLeave={onLeave(k)}
        >
          <meshBasicMaterial map={textures[0]} toneMapped={false} transparent opacity={1} />
        </mesh>
      ))}
    </>
  );
}
