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
import { setFocusedMedia } from '../transition/simpleMorph';
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

/** Rayon d'angle des vignettes, en unités du monde (≈ 3 px au dézoom, ≈ 6–8 px au focus). */
const TILE_RADIUS = 0.045;

/**
 * Rectangle unité (-0.5…0.5) aux angles arrondis, pour une tuile de w × h unités du monde :
 * rayons elliptiques en espace unité (r / w, r / h), circulaires après mise à l'échelle.
 * UV recalculées sur l'étendue 0…1 (texture inchangée).
 */
function roundedUnitRect(w: number, h: number, r: number) {
  const rx = Math.min(0.5, r / w);
  const ry = Math.min(0.5, r / h);
  const shape = new THREE.Shape();
  const seg = 6;
  const corner = (cx: number, cy: number, a0: number) => {
    for (let k = 0; k <= seg; k++) {
      const a = a0 + (k / seg) * (Math.PI / 2);
      const x = cx + Math.cos(a) * rx;
      const y = cy + Math.sin(a) * ry;
      if (k === 0 && cx === 0.5 - rx && cy === -0.5 + ry) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
  };
  corner(0.5 - rx, -0.5 + ry, -Math.PI / 2); // bas droite
  corner(0.5 - rx, 0.5 - ry, 0); // haut droite
  corner(-0.5 + rx, 0.5 - ry, Math.PI / 2); // haut gauche
  corner(-0.5 + rx, -0.5 + ry, Math.PI); // bas gauche
  const g = new THREE.ShapeGeometry(shape);
  const pos = g.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let k = 0; k < pos.count; k++) {
    uv[k * 2] = pos.getX(k) + 0.5;
    uv[k * 2 + 1] = pos.getY(k) + 0.5;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

/**
 * `category` : filtre courant (Simple, filterState) — la composition ne change pas ; les
 * produits hors catégorie sont atténués (opacité 0.12), sans survol ni clic ; transition
 * douce par l'interpolation d'opacité existante ; « All » rétablit l'opacité normale.
 */
export function Tiles({ items, category }: { items: SpatialItem[]; category: string }) {
  const s = useSpatialState();
  const { size, gl } = useThree();
  const n = items.length;
  // Filtre lu dans la boucle d'animation sans re-rendu (comme filterState dans Simple)
  const categoryRef = useRef(category);
  categoryRef.current = category;
  const dimmedByFilter = (idx: number) => categoryRef.current !== 'all' && items[idx]?.category !== categoryRef.current;

  const urls = useMemo(() => items.map((it) => it.thumb), [items]);
  const textures = useTexture(urls) as THREE.Texture[];
  useMemo(() => textures.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace)), [textures]);
  const sizes = useMemo(() => items.map(containSize), [items]);
  const stride = useMemo(() => pickStride(n), [n]);

  // Une géométrie pour toutes les tuiles (dimensions par mesh.scale)
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  // Vignettes très légèrement arrondies (7.0.10) : une géométrie par produit, à ses propres
  // proportions, pour que l'angle reste circulaire une fois la tuile mise à l'échelle
  const rounded = useMemo(() => sizes.map((sz) => roundedUnitRect(sz.w, sz.h, TILE_RADIUS)), [sizes]);
  useEffect(() => () => rounded.forEach((g) => g.dispose()), [rounded]);

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
      for (let a = 0; a < cols; a++)
        list.push({ a, b, i: NaN, j: NaN, idx: -1, hovered: false, scale: new THREE.Vector3(1, 1, 1) });
    const ca = (cols - 1) / 2;
    const cb = (rows - 1) / 2;
    return list.sort((p, q) => Math.hypot(p.a - ca, p.b - cb) - Math.hypot(q.a - ca, q.b - cb));
  }, [cols, rows]);

  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const tmpA = useMemo(() => new THREE.Vector3(), []);
  const tmpB = useMemo(() => new THREE.Vector3(), []);
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
    let focusedMesh: { mesh: THREE.Mesh; idx: number } | null = null;

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
        mesh.geometry = rounded[slot.idx] ?? geometry;
      }

      const worldX = i * SPACING_X + offX;
      const worldY = -j * SPACING_Y + offY;
      mesh.position.x = worldX;
      mesh.position.y = worldY;

      const z0 = baseDepth(i, j);
      const active = !!focus && focus.i === i && focus.j === j;
      const dimmedByFocus = !!focus && !active;
      const filtered = dimmedByFilter(slot.idx);
      const dimmed = dimmedByFocus || filtered;
      const hov = slot.hovered && !focus && !filtered;

      let proximity = 0;
      if (!hov && !dimmed && !focus) {
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
          : dimmedByFocus
            ? z0 - 0.3
            : z0 + (hov ? GRID_CONFIG.hoverDepth : 0) + GRID_CONFIG.proximityDepth * proximity) + curvZ;
      const targetRotX = -ny * GRID_CONFIG.curvatureTiltMax * curvT;
      const targetRotY = nx * GRID_CONFIG.curvatureTiltMax * curvT;
      const targetScale = active ? 1.4 : dimmedByFocus ? 0.6 : hov ? GRID_CONFIG.hoverScale : 1 + GRID_CONFIG.proximityScale * proximity;
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
      if (active) focusedMesh = { mesh, idx: slot.idx };
    }

    // Transition interne (7.0.10) : rectangle écran du visuel focalisé, point de départ
    // du morphing « Open » (équivalent de rigState.activeScreenRect dans Simple)
    if (focusedMesh && focus) {
      const { mesh, idx } = focusedMesh;
      const box = gl.domElement.getBoundingClientRect();
      const hx = mesh.scale.x / 2;
      const hy = mesh.scale.y / 2;
      const a = tmpA.set(mesh.position.x - hx, mesh.position.y + hy, mesh.position.z).project(camera);
      const left = box.left + ((a.x + 1) / 2) * box.width;
      const top = box.top + ((1 - a.y) / 2) * box.height;
      const b = tmpB.set(mesh.position.x + hx, mesh.position.y - hy, mesh.position.z).project(camera);
      const right = box.left + ((b.x + 1) / 2) * box.width;
      const bottom = box.top + ((1 - b.y) / 2) * box.height;
      setFocusedMedia({ slug: focus.slug, src: items[idx]?.thumb ?? '', rect: { left, top, width: right - left, height: bottom - top } });
    } else {
      setFocusedMedia(null);
    }
  });
  useEffect(() => () => setFocusedMedia(null), []);

  // Interactions (Simple) : clic = focus centré ; re-clic = sortie ; survol hors focus
  const onUp = (k: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (s.isDragging) return; // anti faux clic : la fin d'un drag n'est pas un clic
    const slot = slots[k];
    if (slot.idx < 0 || dimmedByFilter(slot.idx)) return; // produit hors filtre : inactif (Simple)
    if (s.focus && s.focus.i === slot.i && s.focus.j === slot.j) s.setFocus(null);
    else s.setFocus({ i: slot.i, j: slot.j, slug: items[slot.idx].slug });
  };
  const onEnter = (k: number) => () => {
    if (s.isDragging) return;
    const slot = slots[k];
    if (dimmedByFilter(slot.idx)) return;
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
