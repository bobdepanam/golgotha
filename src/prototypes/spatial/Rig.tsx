'use client';

// Caméra : drag / pan avec inertie, zoom molette, tilt lié à la vitesse.
// Portage de Simple (spatial/Rig.tsx) ; état par instance (useSpatialState).
// Écouteurs posés sur le canvas (et pointermove / pointerup sur window pour finir un
// drag hors du canvas), tous retirés au démontage.

import { useFrame, useThree } from '@react-three/fiber';
import { easing } from 'maath';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GRID_CONFIG } from './config';
import { useSpatialState } from './state';

const HALF_TAN = Math.tan((GRID_CONFIG.fov * Math.PI) / 180 / 2);

export function Rig() {
  const s = useSpatialState();
  const { camera, gl, size } = useThree();
  const prevCurrent = useRef(new THREE.Vector3());
  const ndc = useRef({ x: 0, y: -99 });

  useEffect(() => {
    const canvas = gl.domElement;
    let isDown = false;
    let startX = 0;
    let startY = 0;
    let initX = 0;
    let initY = 0;
    let maxDrag = 0;
    let velocityX = 0;
    let velocityY = 0;
    let prevX = 0;
    let prevY = 0;

    canvas.style.cursor = 'grab';
    canvas.style.touchAction = 'none';

    const onDown = (e: PointerEvent) => {
      isDown = true;
      startX = prevX = e.clientX;
      startY = prevY = e.clientY;
      initX = s.target.x;
      initY = s.target.y;
      maxDrag = 0;
      velocityX = velocityY = 0;
      s.isDragging = false;
      canvas.style.cursor = 'grabbing';
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      ndc.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      if (!isDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      maxDrag = Math.max(maxDrag, Math.hypot(dx, dy));
      if (maxDrag > GRID_CONFIG.clickThreshold) {
        s.isDragging = true;
        if (s.activeSlug) s.setFocus(null); // un drag annule le focus
      }
      const sensitivity = GRID_CONFIG.dragSpeed * (s.zoom / GRID_CONFIG.zoomOut);
      s.target.x = initX + dx * sensitivity;
      s.target.y = initY - dy * sensitivity;
      velocityX = e.clientX - prevX;
      velocityY = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onUp = () => {
      if (!isDown) return;
      isDown = false;
      // Inertie : la dernière vitesse devient un décalage de cible, amorti par damp3.
      if (maxDrag > GRID_CONFIG.clickThreshold) {
        const sensitivity = GRID_CONFIG.dragSpeed * (s.zoom / GRID_CONFIG.zoomOut);
        s.target.x += velocityX * sensitivity * 10;
        s.target.y -= velocityY * sensitivity * 10;
      }
      // isDragging retombe après le pointerup des tuiles (anti faux clic)
      requestAnimationFrame(() => {
        s.isDragging = false;
      });
      canvas.style.cursor = 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      s.zoom = Math.max(GRID_CONFIG.zoomIn, Math.min(GRID_CONFIG.zoomMax, s.zoom * (1 + e.deltaY * 0.001)));
    };

    const onLeave = () => {
      ndc.current.x = 0;
      ndc.current.y = -99;
    };

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('pointerleave', onLeave);
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.style.cursor = '';
    };
  }, [gl, s]);

  useFrame((_, delta) => {
    const aspect = size.width / size.height;
    s.pointer.worldX = ndc.current.x * HALF_TAN * aspect * camera.position.z;
    s.pointer.worldY = ndc.current.y * HALF_TAN * camera.position.z;

    easing.damp3(s.current, s.target, GRID_CONFIG.dampFactor, delta);
    camera.position.z += (s.zoom - camera.position.z) * (1 - Math.exp(-GRID_CONFIG.zoomDamp * 60 * delta));

    s.velocity.copy(s.current).sub(prevCurrent.current);
    prevCurrent.current.copy(s.current);

    const zoomRatio = GRID_CONFIG.zoomIn / Math.max(s.zoom, GRID_CONFIG.zoomIn);
    const tilt = s.activeSlug === null;
    const tiltX = tilt ? s.velocity.y * GRID_CONFIG.tiltFactor * zoomRatio : 0;
    const tiltY = tilt ? -s.velocity.x * GRID_CONFIG.tiltFactor * zoomRatio : 0;
    camera.rotation.x += (tiltX - camera.rotation.x) * (1 - Math.exp(-6 * delta));
    camera.rotation.y += (tiltY - camera.rotation.y) * (1 - Math.exp(-6 * delta));
  });

  return null;
}
