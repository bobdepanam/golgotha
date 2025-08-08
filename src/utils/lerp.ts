// /utils/lerp.ts
export function lerp(a: number, b: number, n: number): number {
  return (1 - n) * a + n * b;
}
