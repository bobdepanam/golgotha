// src/utils/index.ts

export function map(x: number, in_min: number, in_max: number, out_min: number, out_max: number): number {
  return ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}

export function lerp(a: number, b: number, n: number) {
  return (1 - n) * a + n * b;
}

export function getMousePos(e?: MouseEvent) {
  if (!e) {
    if (typeof window === "undefined") {
      return { x: 0, y: 0 };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  return { x: e.clientX, y: e.clientY };
}



export function calcWinsize() {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 }; // fallback côté serveur
  }
  return { width: window.innerWidth, height: window.innerHeight };
}
