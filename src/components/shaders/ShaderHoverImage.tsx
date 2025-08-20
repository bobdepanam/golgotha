'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Props = {
    /** URL de l'image à sampler par le shader */
    src: string;
    /** classes optionnelles sur le wrapper (le parent doit être position:relative) */
    className?: string;
    /** activer sur devices tactiles (par défaut false) */
    enableOnTouch?: boolean;
    /** DPR max pour limiter le coût GPU */
    maxDpr?: number;
    /** intensité de l’effet [0..1] */
    strength?: number;
};

const FRAG = /* glsl */`
precision highp float;

uniform vec2  u_resolution;   // pixels * DPR
uniform vec2  u_mouse;        // pixels (dans le rect du conteneur)
uniform float u_pixelRatio;   // DPR
uniform float u_strength;     // 0..1
uniform sampler2D u_image;

varying vec2 vUv;

void main(){
  vec2 uv = vUv;

  // mouse en UV (0..1) à partir de pixels
  vec2 m = u_mouse / u_resolution;

  // distance radiale au pointeur
  float d = distance(uv, m);

  // déformation douce, localisée (réglable via strength)
  float s = 0.22 * u_strength;
  vec2 dir = normalize(uv - m + 1e-4);
  uv -= dir * s * exp(-10.0 * d);

  // léger glow autour du curseur
  float glow = 0.08 * exp(-18.0 * d);
  vec3 col = texture2D(u_image, uv).rgb + glow;

  // vignette discrète
  float vig = smoothstep(1.1, 0.7, distance(uv, vec2(0.5)));
  col *= mix(0.98, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function ShaderHoverImage({
    src,
    className,
    enableOnTouch = false,
    maxDpr = 1.75,
    strength = 0.8,
}: Props) {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const canHover = enableOnTouch || window.matchMedia('(hover: hover)').matches;

        // WebGL dispo ?
        const glOk = (() => {
            try {
                const c = document.createElement('canvas');
                return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
            } catch { return false; }
        })();
        if (!glOk) return;

        const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        renderer.setClearAlpha(0);
        // important : le canvas ne doit pas bloquer les clics (on écoute window)
        renderer.domElement.style.pointerEvents = 'none';
        el.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        let w = 1, h = 1;
        const cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 10);
        cam.position.z = 1;

        const u_resolution = new THREE.Vector2();
        const u_mouse = new THREE.Vector2();
        const uniforms: Record<string, any> = {
            u_resolution: { value: u_resolution },
            u_mouse: { value: u_mouse },
            u_pixelRatio: { value: 1.0 },
            u_strength: { value: THREE.MathUtils.clamp(strength, 0.0, 1.0) },
            u_image: { value: null },
        };

        // texture image
        let disposed = false;
        const loader = new THREE.TextureLoader();
        loader.load(
            src,
            (tex) => {
                if (disposed) return;
                tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.LinearFilter;
                tex.generateMipmaps = false;
                uniforms.u_image.value = tex;
            },
            undefined,
            () => { /* ignore si fail */ }
        );

        const material = new THREE.ShaderMaterial({
            vertexShader: /* glsl */`
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
            fragmentShader: FRAG,
            uniforms,
            transparent: true,
        });

        const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
        scene.add(quad);

        // Resize → s'adapte au conteneur
        const resize = () => {
            w = el.clientWidth || 1;
            h = el.clientHeight || 1;

            const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
            renderer.setSize(w, h);
            renderer.setPixelRatio(dpr);

            cam.left = -w / 2; cam.right = w / 2;
            cam.top = h / 2; cam.bottom = -h / 2;
            cam.updateProjectionMatrix();

            quad.scale.set(w, h, 1);
            u_resolution.set(w, h).multiplyScalar(dpr);
            uniforms.u_pixelRatio.value = dpr;
        };
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        resize();

        // Souris : relative au rect du conteneur (on écoute window pour pointer-events none)
        let dampX = 0, dampY = 0;
        let last = performance.now();
        const onMove = (e: PointerEvent | MouseEvent) => {
            if (!canHover) return;
            const r = el.getBoundingClientRect();
            u_mouse.set(e.clientX - r.left, e.clientY - r.top);
        };
        window.addEventListener('pointermove', onMove);

        // RAF
        let raf = 0;
        const tick = () => {
            raf = requestAnimationFrame(tick);
            const now = performance.now();
            const dt = (now - last) / 1000; last = now;

            // damping pour un mouvement fluide
            dampX = THREE.MathUtils.damp(dampX, u_mouse.x, 8, dt);
            dampY = THREE.MathUtils.damp(dampY, u_mouse.y, 8, dt);
            uniforms.u_mouse.value.set(dampX, dampY);

            renderer.render(scene, cam);
        };
        tick();

        return () => {
            disposed = true;
            cancelAnimationFrame(raf);
            window.removeEventListener('pointermove', onMove);
            ro.disconnect();
            material.dispose();
            (quad.geometry as THREE.BufferGeometry).dispose();
            renderer.dispose();
            el.removeChild(renderer.domElement);
        };
    }, [src, enableOnTouch, maxDpr, strength]);

    // IMPORTANT : le parent doit être position:relative
    return <div ref={ref} className={className} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
}
