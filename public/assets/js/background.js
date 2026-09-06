/**
 * Derovia — Fond organique lumineux et fluide
 *
 * Rend un dégradé animé en WebGL, avec repli automatique sur un rendu Canvas 2D
 * (blobs en dégradé radial) si le contexte WebGL est indisponible.
 */

import { VERTEX_SHADER, FRAGMENT_SHADER } from './shaders.js';

/** Vitesse d'avancement du temps à chaque image. */
const TIME_STEP = 0.012;
/** Facteurs de lissage (0 → figé, 1 → instantané). */
const MOUSE_EASING = 0.025;
const PALETTE_EASING = 0.04;
/** Densité de pixels maximale, pour ne pas saturer les écrans haute résolution. */
const MAX_PIXEL_RATIO = 2;

/** Blobs du rendu de repli : `from`/`to` sont les couleurs des deux palettes. */
const FALLBACK_BLOBS = [
  { x: 0.35, y: 0.40, radius: 0.40, vx: 0.00022, vy: 0.00028, from: [204, 227, 250], to: [250, 222, 204] },
  { x: 0.65, y: 0.35, radius: 0.45, vx: -0.00028, vy: 0.00022, from: [230, 220, 250], to: [214, 224, 250] },
  { x: 0.50, y: 0.65, radius: 0.48, vx: 0.00020, vy: -0.00025, from: [252, 240, 215], to: [252, 234, 189] },
  { x: 0.40, y: 0.55, radius: 0.38, vx: -0.00022, vy: -0.00018, from: [215, 245, 240], to: [199, 240, 230] },
];

const FALLBACK_BACKGROUND = '#FBFCFD';

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);

export class OrganicBackground {
  /** @param {string} canvasId Identifiant du `<canvas>` de fond. */
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    this.time = 0;
    this.palette = 0;
    this.targetPalette = 0;
    this.calm = 0;
    this.targetCalm = 0;

    if (!this.#initWebGL()) {
      this.#initCanvas2D();
    }

    this.#bindEvents();
    this.#resize();
    this.#animate();
  }

  /**
   * Fait glisser la palette de fond vers la teinte demandée.
   * @param {number} value 0 pour l'accueil, 1 pour la dernière diapositive.
   */
  setPalette(value) {
    this.targetPalette = clamp01(value);
  }

  /**
   * Apaise ou réveille le fond selon que la diapositive se lit ou se contemple.
   * @param {number} value 0 pour le rendu plein, 1 pour le rendu apaisé.
   */
  setCalm(value) {
    this.targetCalm = clamp01(value);
  }

  /* ----------------------------------------------------------------------
     Initialisation
     ---------------------------------------------------------------------- */

  /** @returns {boolean} `true` si le pipeline WebGL est prêt. */
  #initWebGL() {
    const gl =
      this.canvas.getContext('webgl', { antialias: true, alpha: true }) ||
      this.canvas.getContext('experimental-webgl');

    if (!gl) return false;

    const vertexShader = this.#compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = this.#compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return false;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Derovia : échec de l’édition de liens du programme WebGL.', gl.getProgramInfoLog(program));
      return false;
    }

    this.gl = gl;
    this.program = program;
    this.uniforms = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      mouse: gl.getUniformLocation(program, 'u_mouse'),
      transition: gl.getUniformLocation(program, 'u_transition'),
      calm: gl.getUniformLocation(program, 'u_calm'),
    };

    // Un simple quad plein écran : tout le rendu se fait dans le fragment shader.
    const position = gl.getAttribLocation(program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    return true;
  }

  #compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('Derovia : échec de compilation du shader.', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  #initCanvas2D() {
    // Un canvas ne peut pas changer de type de contexte : si WebGL a déjà été
    // initialisé dessus, `getContext('2d')` renverrait null. On repart d'un
    // élément neuf pour que le repli fonctionne réellement.
    const fresh = this.canvas.cloneNode(false);
    this.canvas.replaceWith(fresh);
    this.canvas = fresh;

    this.ctx = fresh.getContext('2d');
    this.blobs = FALLBACK_BLOBS.map((blob) => ({ ...blob }));
  }

  #bindEvents() {
    window.addEventListener('resize', () => this.#resize());

    window.addEventListener('pointermove', (event) => {
      this.#aimAt(event.clientX, event.clientY);
    });

    window.addEventListener(
      'touchmove',
      (event) => {
        const touch = event.touches[0];
        if (touch) this.#aimAt(touch.clientX, touch.clientY);
      },
      { passive: true },
    );
  }

  /** Convertit des coordonnées écran en coordonnées normalisées (origine en bas à gauche). */
  #aimAt(clientX, clientY) {
    this.mouse.targetX = clientX / window.innerWidth;
    this.mouse.targetY = 1 - clientY / window.innerHeight;
  }

  #resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    this.canvas.width = Math.floor(window.innerWidth * ratio);
    this.canvas.height = Math.floor(window.innerHeight * ratio);

    this.gl?.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /* ----------------------------------------------------------------------
     Boucle de rendu
     ---------------------------------------------------------------------- */

  #animate() {
    this.time += TIME_STEP;
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * MOUSE_EASING;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * MOUSE_EASING;
    this.palette += (this.targetPalette - this.palette) * PALETTE_EASING;
    this.calm += (this.targetCalm - this.calm) * PALETTE_EASING;

    if (this.gl) {
      this.#renderWebGL();
    } else if (this.ctx) {
      this.#renderCanvas2D();
    }

    requestAnimationFrame(() => this.#animate());
  }

  #renderWebGL() {
    const { gl, uniforms } = this;

    gl.useProgram(this.program);
    gl.uniform2f(uniforms.resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(uniforms.time, this.time);
    gl.uniform2f(uniforms.mouse, this.mouse.x, this.mouse.y);
    gl.uniform1f(uniforms.transition, this.palette);
    gl.uniform1f(uniforms.calm, this.calm);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  #renderCanvas2D() {
    const { ctx } = this;
    const { width, height } = this.canvas;
    const shortestSide = Math.min(width, height);

    ctx.fillStyle = FALLBACK_BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    for (const blob of this.blobs) {
      blob.x += blob.vx;
      blob.y += blob.vy;
      if (blob.x < 0.1 || blob.x > 0.9) blob.vx *= -1;
      if (blob.y < 0.1 || blob.y > 0.9) blob.vy *= -1;

      const x = (blob.x + (this.mouse.x - 0.5) * 0.12) * width;
      const y = (1 - blob.y - (this.mouse.y - 0.5) * 0.12) * height;
      const radius = blob.radius * shortestSide;

      const [r, g, b] = blob.from.map((channel, i) =>
        Math.round(channel * (1 - this.palette) + blob.to[i] * this.palette),
      );

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.65 - this.calm * 0.35})`);
      gradient.addColorStop(1, 'rgba(251, 252, 253, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
