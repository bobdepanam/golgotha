'use client';

// Caméra : déplacement infini (drag avec inertie, molette / trackpad), zoom (pincement ou
// Ctrl + molette), tilt proportionnel à la vitesse.
// Portage de Simple (spatial/Rig.tsx) ; différences BSTRDZ : le drag suit le curseur et la
// molette déplace la grille (navigation infinie, 7.0.3a.1), plage de zoom de navigation
// resserrée (le zoom de focus n'est pas borné par elle), état par instance, curseur
// personnalisé de Golgotha au lieu des curseurs natifs.

import { useFrame, useThree } from '@react-three/fiber';
import { easing } from 'maath';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GRID_CONFIG, HALF_TAN } from './config';
import { useSpatialState } from './state';

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
    // Vitesse lissée du pointeur (px/ms), pour l'inertie au relâchement
    let vx = 0;
    let vy = 0;
    let prevX = 0;
    let prevY = 0;
    let prevT = 0;

    canvas.style.touchAction = 'none';

    /** Unités monde par pixel écran au zoom courant : le contenu suit le curseur. */
    const worldPerPx = () => (2 * HALF_TAN * camera.position.z) / Math.max(1, canvas.clientHeight);

    const onDown = (e: PointerEvent) => {
      s.stats.downs += 1;
      isDown = true;
      startX = prevX = e.clientX;
      startY = prevY = e.clientY;
      prevT = e.timeStamp;
      initX = s.target.x;
      initY = s.target.y;
      maxDrag = 0;
      vx = vy = 0;
      s.isDragging = false;
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      ndc.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      if (!isDown) return;
      s.stats.moves += 1;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      maxDrag = Math.max(maxDrag, Math.hypot(dx, dy));
      if (maxDrag > GRID_CONFIG.clickThreshold) {
        s.isDragging = true;
        if (s.focus) s.setFocus(null); // un drag annule le focus (Simple)
      }
      const k = worldPerPx() * GRID_CONFIG.dragFollow;
      s.target.x = initX + dx * k;
      s.target.y = initY - dy * k;
      const dt = Math.max(1, e.timeStamp - prevT);
      vx = vx * 0.6 + ((e.clientX - prevX) / dt) * 0.4;
      vy = vy * 0.6 + ((e.clientY - prevY) / dt) * 0.4;
      prevX = e.clientX;
      prevY = e.clientY;
      prevT = e.timeStamp;
    };

    const onUp = (e: PointerEvent) => {
      if (!isDown) return;
      isDown = false;
      s.isDragging = false;
      // Inertie : lancer dans la direction du geste, amorti par damp3 (pas de lancer si le
      // pointeur était immobile avant le relâchement)
      if (maxDrag > GRID_CONFIG.clickThreshold && e.timeStamp - prevT < 80) {
        const k = worldPerPx() * GRID_CONFIG.dragFollow * GRID_CONFIG.throwTime;
        s.target.x += vx * k;
        s.target.y -= vy * k;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      s.stats.wheels += 1;
      if (e.ctrlKey) {
        // Pincement du trackpad (Ctrl + molette) : zoom de navigation borné ; depuis un focus
        // (zoom 8), la borne basse est le zoom courant : aucun saut.
        const min = Math.min(GRID_CONFIG.navZoomMin, s.zoom);
        s.zoom = Math.max(min, Math.min(GRID_CONFIG.navZoomMax, s.zoom * (1 + e.deltaY * GRID_CONFIG.pinchZoomSpeed)));
        return;
      }
      // Molette / défilement à deux doigts : déplacement dans les deux axes
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.clientHeight : 1;
      const k = worldPerPx() * unit;
      if (s.focus) s.setFocus(null);
      s.target.x -= e.deltaX * k;
      s.target.y += e.deltaY * k;
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
    };
  }, [gl, s, camera]);

  useFrame((_, delta) => {
    const aspect = size.width / size.height;
    s.pointer.worldX = ndc.current.x * HALF_TAN * aspect * camera.position.z;
    s.pointer.worldY = ndc.current.y * HALF_TAN * camera.position.z;

    easing.damp3(s.current, s.target, GRID_CONFIG.dampFactor, delta);
    camera.position.z += (s.zoom - camera.position.z) * (1 - Math.exp(-GRID_CONFIG.zoomDamp * 60 * delta));

    s.velocity.copy(s.current).sub(prevCurrent.current);
    prevCurrent.current.copy(s.current);

    // Tilt atténué au dézoom, suspendu pendant le focus (Simple)
    const zoomRatio = GRID_CONFIG.tiltReferenceZoom / Math.max(s.zoom, GRID_CONFIG.tiltReferenceZoom);
    const tilt = s.focus === null;
    const tiltX = tilt ? s.velocity.y * GRID_CONFIG.tiltFactor * zoomRatio : 0;
    const tiltY = tilt ? -s.velocity.x * GRID_CONFIG.tiltFactor * zoomRatio : 0;
    camera.rotation.x += (tiltX - camera.rotation.x) * (1 - Math.exp(-6 * delta));
    camera.rotation.y += (tiltY - camera.rotation.y) * (1 - Math.exp(-6 * delta));
  });

  return null;
}
