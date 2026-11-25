'use client';

// Effet List FX de Simple (prototype/list-fx/ListFxPrototype.tsx, PASS 7A), branché sur la
// vraie liste : au survol d'une image, séparation rouge / bleu, dérive et traînée verte selon
// la vitesse du pointeur. Un seul canvas WebGL2 partagé, créé au premier survol, déplacé dans
// le calque de l'image survolée ; boucle rAF active seulement tant que l'effet est non nul.
// Désactivé sous prefers-reduced-motion et sans pointeur fin (la liste reste une liste simple).
// Différence avec le prototype : le parallax est celui de la liste (ScrollGallery), et les
// éléments sont résolus au survol (les cycles ajoutés plus tard sont donc pris en compte).

import { type RefObject, useEffect } from 'react';
import { FRAGMENT_SRC, VERTEX_SRC } from './listFxShader';

// Réglages du prototype (px CSS)
const MAX_SPLIT_PX = 3;
const MAX_SHIFT_PX = 1.5;
const MAX_SMEAR_PX = 3;
const SPEED_FULL = 1.6;
const VEL_SMOOTH = 0.3;
const ATTACK_TAU = 40;
const DECAY_STOP_TAU = 140;
const DECAY_LEAVE_TAU = 220;
const STOP_MS = 70;
const EPS = 0.002;

type Item = { el: HTMLElement; layer: HTMLElement; img: HTMLImageElement; w: number; h: number };
type Gl = {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  uCover: WebGLUniformLocation | null;
  uShift: WebGLUniformLocation | null;
  uSplit: WebGLUniformLocation | null;
  uSmear: WebGLUniformLocation | null;
  texture: WebGLTexture;
  uploadedFrom: HTMLImageElement | null;
};

export function useListFx(rootRef: RefObject<HTMLElement>, canvasClass: string) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (reduce || !finePointer) return;

    const items = new WeakMap<HTMLElement, Item>();
    const itemFor = (el: HTMLElement): Item | null => {
      const known = items.get(el);
      if (known) return known;
      const layer = el.querySelector<HTMLElement>('[data-layer]');
      const img = el.querySelector<HTMLImageElement>('img');
      if (!layer || !img) return null;
      const it = { el, layer, img, w: 0, h: 0 };
      items.set(el, it);
      return it;
    };

    let gl: Gl | null = null;
    let glDisabled = false;

    const compile = (ctx: WebGL2RenderingContext, type: number, src: string) => {
      const sh = ctx.createShader(type);
      if (!sh) throw new Error('createShader failed');
      ctx.shaderSource(sh, src);
      ctx.compileShader(sh);
      if (!ctx.getShaderParameter(sh, ctx.COMPILE_STATUS)) throw new Error(ctx.getShaderInfoLog(sh) ?? 'shader compile');
      return sh;
    };

    const hideCanvas = () => {
      if (gl) gl.canvas.remove();
    };

    const ensureGl = (): Gl | null => {
      if (gl || glDisabled) return gl;
      try {
        const canvas = document.createElement('canvas');
        canvas.className = canvasClass;
        const ctx = canvas.getContext('webgl2', { alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
        if (!ctx) throw new Error('webgl2 unavailable');
        const prog = ctx.createProgram();
        if (!prog) throw new Error('createProgram failed');
        ctx.attachShader(prog, compile(ctx, ctx.VERTEX_SHADER, VERTEX_SRC));
        ctx.attachShader(prog, compile(ctx, ctx.FRAGMENT_SHADER, FRAGMENT_SRC));
        ctx.linkProgram(prog);
        if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) throw new Error(ctx.getProgramInfoLog(prog) ?? 'link');
        ctx.useProgram(prog);
        const texture = ctx.createTexture();
        if (!texture) throw new Error('createTexture failed');
        ctx.bindTexture(ctx.TEXTURE_2D, texture);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
        ctx.uniform1i(ctx.getUniformLocation(prog, 'uTex'), 0);
        canvas.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          glDisabled = true;
          hideCanvas();
          gl = null;
        });
        gl = {
          canvas,
          gl: ctx,
          uCover: ctx.getUniformLocation(prog, 'uCover'),
          uShift: ctx.getUniformLocation(prog, 'uShift'),
          uSplit: ctx.getUniformLocation(prog, 'uSplit'),
          uSmear: ctx.getUniformLocation(prog, 'uSmear'),
          texture,
          uploadedFrom: null,
        };
      } catch {
        glDisabled = true;
        gl = null;
      }
      return gl;
    };

    let active: Item | null = null;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    let vx = 0;
    let vy = 0;
    let target = 0;
    let intensity = 0;
    let leaving = false;
    let lastMoveT = 0;
    let rafId = 0;
    let lastFrameT = 0;

    const activate = (item: Item) => {
      if (!item.img.complete || item.img.naturalWidth === 0) return false;
      const g = ensureGl();
      if (!g) return false;
      const rect = item.layer.getBoundingClientRect();
      item.w = rect.width;
      item.h = rect.height;
      const dpr = window.devicePixelRatio || 1;
      g.canvas.width = Math.max(1, Math.round(item.w * dpr));
      g.canvas.height = Math.max(1, Math.round(item.h * dpr));
      if (g.uploadedFrom !== item.img) {
        g.gl.bindTexture(g.gl.TEXTURE_2D, g.texture);
        g.gl.pixelStorei(g.gl.UNPACK_FLIP_Y_WEBGL, false);
        g.gl.texImage2D(g.gl.TEXTURE_2D, 0, g.gl.RGBA, g.gl.RGBA, g.gl.UNSIGNED_BYTE, item.img);
        g.uploadedFrom = item.img;
      }
      return true;
    };

    const draw = () => {
      if (!active || !gl) return;
      const g = gl;
      const it = active;
      const W = it.w;
      const H = it.h;
      const speed = Math.hypot(vx, vy);
      const ux = speed > 1e-6 ? vx / speed : 0;
      const uy = speed > 1e-6 ? vy / speed : 0;
      const k = intensity;
      const ctx = g.gl;
      const boxA = W / H;
      const imgA = it.img.naturalWidth / it.img.naturalHeight;
      const coverX = boxA > imgA ? 1 : boxA / imgA;
      const coverY = boxA > imgA ? imgA / boxA : 1;
      ctx.viewport(0, 0, g.canvas.width, g.canvas.height);
      ctx.bindTexture(ctx.TEXTURE_2D, g.texture);
      ctx.uniform2f(g.uCover, coverX, coverY);
      ctx.uniform2f(g.uShift, (ux * MAX_SHIFT_PX * k) / W, (uy * MAX_SHIFT_PX * k) / H);
      ctx.uniform2f(g.uSplit, (ux * MAX_SPLIT_PX * k) / W, (uy * MAX_SPLIT_PX * k) / H);
      ctx.uniform2f(g.uSmear, (-ux * MAX_SMEAR_PX * k) / W / 2, (-uy * MAX_SMEAR_PX * k) / H / 2);
      ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
      if (g.canvas.parentElement !== it.layer) it.layer.appendChild(g.canvas);
    };

    const frame = (now: number) => {
      rafId = 0;
      const dt = lastFrameT ? Math.min(64, now - lastFrameT) : 16;
      lastFrameT = now;
      const stopped = now - lastMoveT > STOP_MS;
      if (stopped && !leaving) target = 0;
      const tau = target > intensity ? ATTACK_TAU : leaving ? DECAY_LEAVE_TAU : DECAY_STOP_TAU;
      intensity += (target - intensity) * (1 - Math.exp(-dt / tau));
      if (stopped) {
        const bleed = Math.exp(-dt / DECAY_STOP_TAU);
        vx *= bleed;
        vy *= bleed;
      }
      if (intensity > EPS && active) draw();
      if (intensity <= EPS && target === 0) {
        intensity = 0;
        hideCanvas();
        leaving = false;
        lastFrameT = 0;
        return; // effet retombé : plus aucune frame jusqu'au prochain mouvement
      }
      rafId = requestAnimationFrame(frame);
    };

    const ensureRaf = () => {
      if (rafId) return;
      lastFrameT = 0;
      rafId = requestAnimationFrame(frame);
    };

    const switchTo = (item: Item) => {
      hideCanvas();
      active = item;
      intensity = 0;
      vx = 0;
      vy = 0;
      if (!activate(item)) active = null;
    };

    const onPointerMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.('[data-fx-item]') as HTMLElement | null;
      const item = el ? itemFor(el) : null;
      const now = e.timeStamp;
      if (!item) {
        if (active) {
          target = 0;
          leaving = true;
          lastMoveT = now;
          ensureRaf();
        }
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = now;
        return;
      }
      if (item !== active) {
        switchTo(item);
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = now;
        return; // premier échantillon sur une nouvelle image : pas de pic de vitesse
      }
      const dt = Math.max(1, now - lastT);
      vx += ((e.clientX - lastX) / dt - vx) * VEL_SMOOTH;
      vy += ((e.clientY - lastY) / dt - vy) * VEL_SMOOTH;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;
      target = Math.min(1, Math.hypot(vx, vy) / SPEED_FULL);
      leaving = false;
      lastMoveT = now;
      ensureRaf();
    };

    const onPointerLeaveRoot = () => {
      if (!active) return;
      target = 0;
      leaving = true;
      lastMoveT = performance.now();
      ensureRaf();
    };

    const onResize = () => {
      if (!active) return;
      hideCanvas();
      active = null;
      intensity = 0;
    };

    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerleave', onPointerLeaveRoot);
    window.addEventListener('resize', onResize);
    return () => {
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerleave', onPointerLeaveRoot);
      window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
      hideCanvas();
      if (gl) gl.gl.getExtension('WEBGL_lose_context')?.loseContext();
      gl = null;
    };
  }, [rootRef, canvasClass]);
}
