// Effet List FX de Simple (prototype/list-fx/listFxShader.ts, PASS 7A) — WebGL2 brut, sans dépendance.
//
// One fullscreen quad over the active image. The fragment shader samples the
// same texture three times: red shifted along the motion, green kept in place
// with a short trail behind the motion, blue shifted against it. With all
// uniforms at zero the output equals the source image.

export const VERTEX_SRC = `#version 300 es
const vec2 P[4] = vec2[4](vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0), vec2(1.0, 1.0));
out vec2 vUv;
void main() {
  vec2 p = P[gl_VertexID];
  // v = 0 at the top of the element, matching texture row 0 (no Y flip on upload).
  vUv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

export const FRAGMENT_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uCover;   // object-fit: cover mapping of the image onto the element
uniform vec2 uShift;   // whole-image drift along the motion (uv units)
uniform vec2 uSplit;   // red / blue separation along the motion (uv units)
uniform vec2 uSmear;   // green trail vector, pointing back along the motion (uv units)
out vec4 outColor;

vec2 toImg(vec2 uv) {
  return (uv - 0.5) * uCover + 0.5;
}

void main() {
  vec2 base = vUv + uShift;
  float r = texture(uTex, toImg(base + uSplit)).r;
  float g0 = texture(uTex, toImg(base)).g;
  float g1 = texture(uTex, toImg(base + uSmear)).g;
  float g2 = texture(uTex, toImg(base + 2.0 * uSmear)).g;
  float g = (2.0 * g0 + g1 + g2) / 4.0;
  float b = texture(uTex, toImg(base - uSplit)).b;
  outColor = vec4(r, g, b, 1.0);
}
`;
