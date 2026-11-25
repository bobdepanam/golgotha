'use client';

// Tuile 3D : texture (miniature), culling, survol, proximité, courbure, focus / atténuation.
// Portage de Simple (spatial/PhotoPlane.tsx), focus par slug, sans filtre ni projection
// écran (morph ViewTransition non repris).

import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { easing } from 'maath';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { GRID_CONFIG } from './config';
import { useSpatialState } from './state';
import type { GridTile } from './types';

type Props = { tile: GridTile; half: { halfW: number; halfH: number } };

export function Plane({ tile, half }: Props) {
  const s = useSpatialState();
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const [hovered, setHovered] = useState(false);
  const texture = useTexture(tile.thumb);
  texture.colorSpace = THREE.SRGBColorSpace;
  const { gl } = useThree();

  // Ajustement « contain » dans la boîte de la tuile (aucune déformation)
  const img = texture.image as HTMLImageElement;
  const ratio = (img.naturalWidth || 600) / (img.naturalHeight || 800);
  const box = GRID_CONFIG.tileWidth / GRID_CONFIG.tileHeight;
  const w = ratio > box ? GRID_CONFIG.tileWidth : GRID_CONFIG.tileHeight * ratio;
  const h = ratio > box ? GRID_CONFIG.tileWidth / ratio : GRID_CONFIG.tileHeight;

  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const worldX = tile.x + s.current.x;
    const worldY = tile.y + s.current.y;

    const cull = GRID_CONFIG.cullingRadius * (s.zoom / GRID_CONFIG.zoomOut);
    const visible = Math.abs(worldX) < cull && Math.abs(worldY) < cull;
    mesh.visible = visible;
    mesh.position.x = worldX;
    mesh.position.y = worldY;
    if (!visible) return;

    const focusMode = s.activeSlug !== null;
    const active = s.activeSlug === tile.slug;
    const dimmed = focusMode && !active;
    const hov = hovered && !focusMode;

    let proximity = 0;
    if (!hov && !focusMode) {
      const d = Math.hypot(worldX - s.pointer.worldX, worldY - s.pointer.worldY);
      const t = Math.max(0, 1 - d / GRID_CONFIG.proximityRadius);
      proximity = t * t;
    }

    const curvT = Math.max(
      0,
      Math.min(1, (s.zoom - GRID_CONFIG.curvatureFadeStart) / (GRID_CONFIG.curvatureFadeEnd - GRID_CONFIG.curvatureFadeStart))
    );
    const curvZ = -GRID_CONFIG.curvatureStrength * (worldX * worldX + worldY * worldY) * curvT;
    const nx = Math.max(-1, Math.min(1, worldX / half.halfW));
    const ny = Math.max(-1, Math.min(1, worldY / half.halfH));

    const targetZ =
      (active
        ? tile.z + 1.5
        : dimmed
          ? tile.z - 0.3
          : tile.z + (hov ? GRID_CONFIG.hoverDepth : 0) + GRID_CONFIG.proximityDepth * proximity) + curvZ;
    const k12 = 1 - Math.exp(-12 * delta);
    mesh.position.z += (targetZ - mesh.position.z) * k12;
    mesh.rotation.x += (-ny * GRID_CONFIG.curvatureTiltMax * curvT - mesh.rotation.x) * k12;
    mesh.rotation.y += (nx * GRID_CONFIG.curvatureTiltMax * curvT - mesh.rotation.y) * k12;

    const targetScale = active ? 1.4 : dimmed ? 0.6 : hov ? GRID_CONFIG.hoverScale : 1 + GRID_CONFIG.proximityScale * proximity;
    easing.damp3(mesh.scale, targetScale, 0.15, delta);

    const mat = matRef.current;
    if (mat) mat.opacity += ((dimmed ? 0.12 : 1) - mat.opacity) * (1 - Math.exp(-8 * delta));
  });

  return (
    <mesh
      ref={ref}
      position={[tile.x, tile.y, tile.z]}
      onPointerUp={(e) => {
        e.stopPropagation();
        if (s.isDragging) return;
        // Re-clic sur la tuile active : sortie du focus ; sinon focus centré
        if (s.activeSlug === tile.slug) s.setFocus(null);
        else s.setFocus(tile.slug, { x: tile.x, y: tile.y });
      }}
      onPointerEnter={() => {
        if (s.isDragging || (s.activeSlug && s.activeSlug !== tile.slug)) return;
        setHovered(true);
        gl.domElement.style.cursor = 'pointer';
      }}
      onPointerLeave={() => {
        setHovered(false);
        gl.domElement.style.cursor = 'grab';
      }}
    >
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial ref={matRef} map={texture} toneMapped={false} transparent opacity={1} />
    </mesh>
  );
}
