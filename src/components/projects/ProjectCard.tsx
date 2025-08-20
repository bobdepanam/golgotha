"use client";

import styles from "@/styles/projects/ProjectCard.module.scss";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type Props = {
  title: string;
  slug: string;
  coverUrl: string;
  category?: string;
  onCaptionHover?: (hovering: boolean) => void; // déclenche la preview fullscreen
};

// Wrap URLs externes via proxy local (évite CORS WebGL)
function proxify(src: string): string {
  try {
    const u = new URL(src, window.location.origin);
    if (u.origin === window.location.origin) return u.toString();
    return `/api/proxy?src=${encodeURIComponent(u.toString())}`;
  } catch {
    return src;
  }
}

export default function ProjectCard({
  title,
  slug,
  coverUrl,
  category,
  onCaptionHover,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const texRef = useRef<THREE.Texture | null>(null);

  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  const hoverRef = useRef(0);
  const mouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  const timeRef = useRef(0);

  // --- Shaders (déformation légère) ---
  const vertexShader = useMemo(
    () => `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    []
  );

  const fragmentShader = useMemo(
    () => `
      precision highp float;
      varying vec2 vUv;

      uniform sampler2D uTexture;
      uniform vec2  uMouse;
      uniform float uHover;
      uniform float uTime;

      vec2 warp(vec2 uv, vec2 center, float strength) {
        vec2 d = uv - center;
        float dist = length(d);
        float w = strength * exp(-6.0 * dist) * (0.6 + 0.4 * sin(uTime*2.0));
        return uv + normalize(d + 1e-6) * w;
      }

      void main() {
        vec2 uv = vUv;
        vec2 deformed = warp(uv, uMouse, 0.18);
        uv = mix(uv, deformed, clamp(uHover, 0.0, 1.0));
        gl_FragColor = texture2D(uTexture, uv);
      }
    `,
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    } catch (err) {
      console.warn("WebGL renderer init error, fallback image.", err);
      return;
    }
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    // Scene / Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
    camera.position.z = 1;
    cameraRef.current = camera;

    // Quad plein cadre
    const geo = new THREE.PlaneGeometry(2, 2);

    // Uniforms
    const uniforms: Record<string, THREE.IUniform<any>> = {
      uTexture: { value: null },
      uMouse: { value: mouseRef.current },
      uHover: { value: hoverRef.current },
      uTime: { value: timeRef.current },
    };

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // rendu 1x
    const renderOnce = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      (mat.uniforms.uTime as THREE.IUniform<number>).value = timeRef.current;
      (mat.uniforms.uHover as THREE.IUniform<number>).value = hoverRef.current;
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    // Texture (proxy + CORS)
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const texUrl = proxify(coverUrl);

    const tex = loader.load(
      texUrl,
      () => {
        (uniforms.uTexture as THREE.IUniform<THREE.Texture>).value = tex;
        renderOnce();
      },
      undefined,
      (e) => console.warn("Texture load error:", e)
    );
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = false;
    texRef.current = tex;

    // Resize
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      renderer.setPixelRatio(dpr);
      renderOnce();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // RAF + visibilité
    const animate = (t: number) => {
      timeRef.current = t * 0.001;
      (mat.uniforms.uTime as THREE.IUniform<number>).value = timeRef.current;
      (mat.uniforms.uHover as THREE.IUniform<number>).value = hoverRef.current;
      renderer.render(scene, camera);
      if (runningRef.current) rafRef.current = requestAnimationFrame(animate);
    };
    const start = () => {
      if (!runningRef.current) {
        runningRef.current = true;
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    const stop = () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { root: null, threshold: 0.1 }
    );
    io.observe(canvas);

    return () => {
      io.disconnect();
      ro.disconnect();
      stop();
      tex.dispose();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, [coverUrl, vertexShader, fragmentShader]);

  // Souris normalisée
  const onMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    mouseRef.current.set(
      (e.clientX - rect.left) / rect.width,
      1 - (e.clientY - rect.top) / rect.height
    );
  };
  const onOver = () => { hoverRef.current = 1; };
  const onOut = () => { hoverRef.current = 0; };

  return (
    <article className={styles.card}>
      {/* zone image + shader */}
      <div
        className={styles.media}
        data-cursor="hover"
        onMouseMove={onMove}
        onMouseEnter={onOver}
        onMouseLeave={onOut}
      >
        <canvas ref={canvasRef} className={styles.canvas} />
        {/* fallback utile si WebGL off */}
        <img src={coverUrl} alt={title} className={styles.fallback} />
      </div>

      {/* caption — lien uniquement sur la typo */}
      <div className={styles.caption}>
        <Link
          href={`/projects/${slug}`}
          className={styles.captionLink}
          data-cursor="hover"
          onMouseEnter={() => onCaptionHover?.(true)}
          onMouseLeave={() => onCaptionHover?.(false)}
          onFocus={() => onCaptionHover?.(true)}
          onBlur={() => onCaptionHover?.(false)}
          aria-label={title}
        >
          <h3>{title}</h3>
          {category ? <p>{category}</p> : null}
        </Link>
      </div>
    </article>
  );
}
