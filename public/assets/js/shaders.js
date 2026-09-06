/**
 * Derovia — Shaders GLSL du fond organique
 *
 * Le fragment shader génère un dégradé de bruit fractal animé et interpole
 * en continu entre deux palettes (`u_transition` : 0 = accueil, 1 = parcours).
 *
 * `u_calm` apaise le rendu — ralenti, adouci, moins contrasté — sur les
 * diapositives où l'on lit plutôt qu'on ne contemple.
 */

export const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = (a_position + 1.0) * 0.5;
    v_uv.y = 1.0 - v_uv.y;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

export const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_transition;
  uniform float u_calm;

  varying vec2 v_uv;

  /* --- Bruit simplex 2D (Ashima Arts, domaine public) --- */
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;

    vec2 uv = st;
    uv.x *= aspect;

    vec2 mouse = u_mouse;
    mouse.x *= aspect;

    float calm = clamp(u_calm, 0.0, 1.0);

    /* Défilement lent et fluide, ralenti encore en mode apaisé */
    float t = u_time * mix(0.04, 0.015, calm);

    /* Attraction douce des formes vers le curseur */
    vec2 toMouse = mouse - uv;
    float mouseInfluence = smoothstep(0.85, 0.0, length(toMouse)) * mix(0.08, 0.03, calm);
    uv += normalize(toMouse + 0.0001) * mouseInfluence;

    /* Bruit multi-octaves (domain warping) */
    vec2 q = vec2(
      snoise(uv * 0.95 + vec2(t * 0.5, t * 0.35)),
      snoise(uv * 1.05 + vec2(-t * 0.45, t * 0.6))
    );

    vec2 r = vec2(
      snoise(uv * 1.35 + 1.25 * q + vec2(2.1, 7.3) + 0.25 * t),
      snoise(uv * 1.30 + 1.20 * q + vec2(5.4, 3.2) + 0.22 * t)
    );

    float f = snoise(uv * 1.1 + 1.5 * r + 0.12 * t);
    float shape = smoothstep(-0.35, 0.65, f);

    /* Palette 1 — Accueil : nacre, ciel, lilas, champagne */
    vec3 bg1   = vec3(0.985, 0.986, 0.992);
    vec3 colA1 = vec3(0.80, 0.89, 0.98); /* Bleu céleste */
    vec3 colB1 = vec3(0.90, 0.86, 0.98); /* Lilas */
    vec3 colC1 = vec3(0.98, 0.94, 0.88); /* Ambre nacré */
    vec3 colD1 = vec3(0.85, 0.96, 0.94); /* Aigue-marine */

    /* Palette 2 — Parcours : ambre chaud, rosé, indigo, sauge */
    vec3 bg2   = vec3(0.986, 0.982, 0.980);
    vec3 colA2 = vec3(0.98, 0.87, 0.80); /* Champagne doré rosé */
    vec3 colB2 = vec3(0.84, 0.88, 0.98); /* Indigo éthéré */
    vec3 colC2 = vec3(0.99, 0.92, 0.74); /* Ambre solaire */
    vec3 colD2 = vec3(0.78, 0.94, 0.90); /* Sauge nacrée */

    /* Interpolation continue entre les deux palettes */
    float tr = clamp(u_transition, 0.0, 1.0);
    vec3 bg   = mix(bg1, bg2, tr);
    vec3 colA = mix(colA1, colA2, tr);
    vec3 colB = mix(colB1, colB2, tr);
    vec3 colC = mix(colC1, colC2, tr);
    vec3 colD = mix(colD1, colD2, tr);

    /* Fusion organique des teintes */
    vec3 color = bg;
    color = mix(color, colA, smoothstep(0.12, 0.68, shape + r.x * 0.28) * 0.85);
    color = mix(color, colB, smoothstep(0.25, 0.82, q.y * 0.5 + 0.5) * 0.65);
    color = mix(color, colC, smoothstep(0.38, 0.88, r.y * 0.5 + 0.5) * 0.50);
    color = mix(color, colD, smoothstep(0.55, 0.95, f) * 0.40);

    /* Mode apaisé : les teintes se rapprochent du fond pour libérer la lecture. */
    color = mix(color, bg, calm * 0.55);

    /* Vignettage doux */
    vec2 centerDist = st - vec2(0.5);
    color *= 1.0 - dot(centerDist, centerDist) * 0.28;

    gl_FragColor = vec4(color, 1.0);
  }
`;
