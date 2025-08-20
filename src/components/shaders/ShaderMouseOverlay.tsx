'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Props = {
    fragmentUrl?: string;      // /shaders/fragment.glsl
    maxDpr?: number;           // limite le DPR pour la perf
    blending?: 'additive' | 'normal';
    showOnlyOnHover?: boolean; // si true, on gère l’opacité via CSS
};

export default function ShaderMouseOverlay({
    fragmentUrl = '/shaders/fragment.glsl',
    maxDpr = 1.75,
    blending = 'additive',
    showOnlyOnHover = true,
}: Props) {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const host = ref.current;
        if (!host) return;

        const canHover = window.matchMedia('(hover: hover)').matches;
        const glOk = (() => {
            try { const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); }
            catch { return false; }
        })();
        if (!glOk) return;

        let disposed = false;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        renderer.setClearAlpha(0);
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.inset = '0';
        renderer.domElement.style.pointerEvents = 'none';
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        let w = 1, h = 1;
        const cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 10);
        cam.position.z = 1;

        const u_resolution = new THREE.Vector2();
        const u_mouse = new THREE.Vector2(0, 0);
        const u_mouseDamp = new THREE.Vector2(0, 0);

        const uniforms: Record<string, any> = {
            u_resolution: { value: u_resolution },
            u_mouse: { value: u_mouseDamp },
            u_pixelRatio: { value: 1.0 },
        };

        let material: THREE.ShaderMaterial | null = null;
        let quad: THREE.Mesh | null = null;

        const VERT = /* glsl */`
      varying vec2 v_texcoord;
      void main() {
        v_texcoord = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

        const loadShader = async () => {
            const src = await fetch(fragmentUrl).then(r => r.text());
            material = new THREE.ShaderMaterial({
                vertexShader: VERT,
                fragmentShader: src,
                uniforms,
                transparent: true,
                depthTest: false,
                depthWrite: false,
                blending: blending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending,
            });

            quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
            scene.add(quad);
            resize();
        };

        const resize = () => {
            if (!host) return;
            w = host.clientWidth || 1;
            h = host.clientHeight || 1;
            const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

            renderer.setSize(w, h);
            renderer.setPixelRatio(dpr);

            cam.left = -w / 2; cam.right = w / 2;
            cam.top = h / 2; cam.bottom = -h / 2;
            cam.updateProjectionMatrix();

            if (quad) quad.scale.set(w, h, 1);
            u_resolution.set(w, h).multiplyScalar(dpr);
            uniforms.u_pixelRatio.value = dpr;
        };

        const ro = new ResizeObserver(resize);
        ro.observe(host);

        const onMove = (e: PointerEvent) => {
            if (!canHover) return;
            const r = host.getBoundingClientRect();
            u_mouse.set(e.clientX - r.left, e.clientY - r.top);
        };
        window.addEventListener('pointermove', onMove);

        let raf = 0;
        let last = performance.now();
        const tick = () => {
            raf = requestAnimationFrame(tick);
            const now = performance.now();
            const dt = (now - last) / 1000;
            last = now;

            // damping
            u_mouseDamp.x = THREE.MathUtils.damp(u_mouseDamp.x, u_mouse.x, 8, dt);
            u_mouseDamp.y = THREE.MathUtils.damp(u_mouseDamp.y, u_mouse.y, 8, dt);

            renderer.render(scene, cam);
        };

        loadShader().then(() => { if (!disposed) tick(); });

        return () => {
            disposed = true;
            cancelAnimationFrame(raf);
            window.removeEventListener('pointermove', onMove);
            ro.disconnect();

            if (quad) {
                (quad.geometry as THREE.BufferGeometry).dispose();
                scene.remove(quad);
            }
            if (material) material.dispose();
            renderer.dispose();
            if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
        };
    }, [fragmentUrl, maxDpr, blending]);

    return (
        <div
            ref={ref}
            className={showOnlyOnHover ? 'shader-overlay' : undefined}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />
    );
}
