"use client";

import styles from "@/styles/projects/ProjectCard.module.scss";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type Props = {
  title: string;
  slug: string;
  coverUrl?: string | null;
  category?: string;
  index?: number; // permet de prioriser les premières images
  onCaptionHover?: (hovering: boolean) => void;
};

/** Wrap d’URL externes via proxy local (évite CORS WebGL) */
function proxify(src: string): string {
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const u = new URL(src, base);
    if (u.origin === base) return u.toString();
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
  index = 0,
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

  const [imgError, setImgError] = useState(false);
  const hasImage = !!coverUrl && !imgError;

  // Mobile detection: on coupe le canvas en mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Shaders (déformation légère)
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

  // Initialisation WebGL (desktop only + image ok)
  useEffect(() => {
    if (isMobile) return;                // pas de WebGL en mobile
    if (!hasImage || !coverUrl) return;  // sans image => inutile
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    } catch (err) {
      console.warn("WebGL init error → fallback image only.", err);
      return;
    }
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
    camera.position.z = 1;
    cameraRef.current = camera;

    const geo = new THREE.PlaneGeometry(2, 2);
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

    const renderOnce = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      (mat.uniforms.uTime as THREE.IUniform<number>).value = timeRef.current;
      (mat.uniforms.uHover as THREE.IUniform<number>).value = hoverRef.current;
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    // Texture via proxy (CORS safe)
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
      renderer!.setSize(rect.width, rect.height, false);
      renderer!.setPixelRatio(dpr);
      renderOnce();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // RAF contrôlé par intersection
    const animate = (t: number) => {
      timeRef.current = t * 0.001;
      (mat.uniforms.uTime as THREE.IUniform<number>).value = timeRef.current;
      (mat.uniforms.uHover as THREE.IUniform<number>).value = hoverRef.current;
      renderer!.render(scene, camera);
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
      renderer?.dispose();
    };
  }, [isMobile, hasImage, coverUrl, vertexShader, fragmentShader]);

  // Souris normalisée (desktop only)
  const onMove = (e: React.MouseEvent) => {
    if (isMobile) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    mouseRef.current.set(
      (e.clientX - rect.left) / rect.width,
      1 - (e.clientY - rect.top) / rect.height
    );
  };
  const onOver = () => { if (!isMobile) hoverRef.current = 1; };
  const onOut = () => { if (!isMobile) hoverRef.current = 0; };

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
        {/* Fallback image (toujours rendue) */}
        {hasImage ? (
          <Image
            src={coverUrl as string}
            alt={title}
            fill
            className={styles.fallback}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={index < 4}
            loading={index < 4 ? "eager" : "lazy"}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.mediaPlaceholder} aria-hidden="true" />
        )}

        {/* Canvas uniquement desktop */}
        {!isMobile && hasImage ? <canvas ref={canvasRef} className={styles.canvas} /> : null}
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
