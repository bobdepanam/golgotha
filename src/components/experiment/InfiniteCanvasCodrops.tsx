"use client";

import { KeyboardControls, KeyboardControlsEntry } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { INITIAL_CAMERA_Z } from "@/components/infinite-canvas/constants";
import { InfiniteCanvasSceneContent } from "@/components/infinite-canvas/scene";
import type { MediaItem } from "@/components/infinite-canvas/types";
import styles from "@/styles/experiment/infinite-canvas.module.scss";

const KEYBOARD_MAP: KeyboardControlsEntry<string>[] = [
  { name: "forward", keys: ["w", "W", "ArrowUp"] },
  { name: "backward", keys: ["s", "S", "ArrowDown"] },
  { name: "left", keys: ["a", "A", "ArrowLeft"] },
  { name: "right", keys: ["d", "D", "ArrowRight"] },
  { name: "up", keys: ["e", "E"] },
  { name: "down", keys: ["q", "Q"] },
];

export type InfiniteCanvasCodropsProps = {
  media: MediaItem[];
  enabled?: boolean;
  onSelect?: (item: MediaItem) => void;
};

export default function InfiniteCanvasCodrops({ media, enabled = true, onSelect }: InfiniteCanvasCodropsProps) {
  if (!media.length) return null;

  return (
    <KeyboardControls map={KEYBOARD_MAP}>
      <div className={styles.container} style={{ pointerEvents: enabled ? "auto" : "none" }}>
        <Canvas
          camera={{ position: [0, 0, INITIAL_CAMERA_Z], fov: 60, near: 1, far: 500 }}
          dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 1.5) : 1}
          flat
          gl={{ antialias: false, powerPreference: "high-performance" }}
          className={styles.canvas}
        >
          <Suspense fallback={null}>
            <InfiniteCanvasSceneContent media={media} enabled={enabled} onSelect={onSelect} />
          </Suspense>
        </Canvas>
      </div>
    </KeyboardControls>
  );
}
