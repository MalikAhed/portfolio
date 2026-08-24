<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@inspira-ui/plugins";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { FLUID_SETTINGS_EVENT } from "../../fluid-cursor/fluid-settings.js";

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

interface Props {
  enabled?: boolean;
  simResolution?: number;
  dyeResolution?: number;
  captureResolution?: number;
  densityDissipation?: number;
  velocityDissipation?: number;
  pressure?: number;
  pressureIterations?: number;
  curl?: number;
  splatRadius?: number;
  splatForce?: number;
  shading?: boolean;
  colorUpdateSpeed?: number;
  colorMode?: "original" | "custom";
  smokeColor?: string;
  secondaryColor?: string;
  colorStrength?: number;
  emitterReach?: number;
  emissionRate?: number;
  originX?: number;
  emitterGap?: number;
  emitterY?: number;
  emitterSpread?: number;
  backColor?: ColorRGB;
  transparent?: boolean;
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
  enabled: false,
  simResolution: 128,
  dyeResolution: 1440,
  captureResolution: 512,
  densityDissipation: 3.5,
  velocityDissipation: 2,
  pressure: 0.1,
  pressureIterations: 20,
  curl: 3,
  splatRadius: 0.2,
  splatForce: 6000,
  shading: true,
  colorUpdateSpeed: 10,
  colorMode: "original",
  smokeColor: "#ff0000",
  secondaryColor: "#0000ff",
  colorStrength: 0.24,
  emitterReach: 1.25,
  emissionRate: 8,
  originX: 0.5,
  emitterGap: 0.07,
  emitterY: 0.14,
  emitterSpread: 0.08,
  backColor: () => ({ r: 0.5, g: 0, b: 0 }),
  transparent: true,
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
let disposeSimulation = () => {};

function hexToRgb(value: string): ColorRGB {
  const match = /^#([0-9a-f]{6})$/i.exec(value);
  if (!match) return { r: 1, g: 1, b: 1 };
  const color = Number.parseInt(match[1], 16);
  return {
    r: ((color >> 16) & 255) / 255,
    g: ((color >> 8) & 255) / 255,
    b: (color & 255) / 255,
  };
}

onBeforeUnmount(() => disposeSimulation());

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  // Hero-owned ambient emitter setup. No pointer input reaches the simulation.
  let effectEnabled = props.enabled;
  let colorMode = props.colorMode;
  let smokeColor = hexToRgb(props.smokeColor);
  let secondaryColor = hexToRgb(props.secondaryColor);
  let colorStrength = props.colorStrength;
  let emitterReach = props.emitterReach;
  let emissionRate = props.emissionRate;
  let originX = props.originX;
  let emitterGap = props.emitterGap;
  let emitterY = props.emitterY;
  let emitterSpread = props.emitterSpread;

  const config = {
    SIM_RESOLUTION: props.simResolution,
    DYE_RESOLUTION: props.dyeResolution,
    CAPTURE_RESOLUTION: props.captureResolution,
    DENSITY_DISSIPATION: props.densityDissipation,
    VELOCITY_DISSIPATION: props.velocityDissipation,
    PRESSURE: props.pressure,
    PRESSURE_ITERATIONS: props.pressureIterations,
    CURL: props.curl,
    SPLAT_RADIUS: props.splatRadius,
    SPLAT_FORCE: props.splatForce,
    SHADING: props.shading,
    COLOR_UPDATE_SPEED: props.colorUpdateSpeed,
    PAUSED: false,
    BACK_COLOR: props.backColor,
    TRANSPARENT: props.transparent,
  };

  // Get WebGL context (WebGL1 or WebGL2)
  const { gl, ext } = getWebGLContext(canvas);
  if (!gl || !ext) return;

  // If no linear filtering, reduce resolution
  if (!ext.supportLinearFiltering) {
    config.DYE_RESOLUTION = 256;
    config.SHADING = false;
  }

  function getWebGLContext(canvas: HTMLCanvasElement) {
    const params = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    };

    let gl = canvas.getContext(
      "webgl2",
      params,
    ) as WebGL2RenderingContext | null;

    if (!gl) {
      gl = (canvas.getContext("webgl", params) ||
        canvas.getContext(
          "experimental-webgl",
          params,
        )) as WebGL2RenderingContext | null;
    }

    if (!gl) {
      throw new Error("Unable to initialize WebGL.");
    }

    const isWebGL2 = "drawBuffers" in gl;

    let supportLinearFiltering = false;
    let halfFloat = null;

    if (isWebGL2) {
      (gl as WebGL2RenderingContext).getExtension("EXT_color_buffer_float");
      supportLinearFiltering = !!(gl as WebGL2RenderingContext).getExtension(
        "OES_texture_float_linear",
      );
    } else {
      halfFloat = gl.getExtension("OES_texture_half_float");
      supportLinearFiltering = !!gl.getExtension(
        "OES_texture_half_float_linear",
      );
    }

    gl.clearColor(0, 0, 0, 1);

    const halfFloatTexType = isWebGL2
      ? (gl as WebGL2RenderingContext).HALF_FLOAT
      : (halfFloat && halfFloat.HALF_FLOAT_OES) || 0;

    let formatRGBA: { internalFormat: number; format: number } | null;
    let formatRG: { internalFormat: number; format: number } | null;
    let formatR: { internalFormat: number; format: number } | null;

    if (isWebGL2) {
      formatRGBA = getSupportedFormat(
        gl,
        (gl as WebGL2RenderingContext).RGBA16F,
        gl.RGBA,
        halfFloatTexType,
      );
      formatRG = getSupportedFormat(
        gl,
        (gl as WebGL2RenderingContext).RG16F,
        (gl as WebGL2RenderingContext).RG,
        halfFloatTexType,
      );
      formatR = getSupportedFormat(
        gl,
        (gl as WebGL2RenderingContext).R16F,
        (gl as WebGL2RenderingContext).RED,
        halfFloatTexType,
      );
    } else {
      formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }

    if (!formatRGBA || !formatRG || !formatR) {
      throw new Error(
        "Required floating-point render textures are unavailable.",
      );
    }

    return {
      gl,
      ext: {
        formatRGBA,
        formatRG,
        formatR,
        halfFloatTexType,
        supportLinearFiltering,
      },
    };
  }

  function getSupportedFormat(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    internalFormat: number,
    format: number,
    type: number,
  ): { internalFormat: number; format: number } | null {
    if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
      // For WebGL2 fallback:
      if ("drawBuffers" in gl) {
        const gl2 = gl as WebGL2RenderingContext;
        switch (internalFormat) {
          case gl2.R16F:
            return getSupportedFormat(gl2, gl2.RG16F, gl2.RG, type);
          case gl2.RG16F:
            return getSupportedFormat(gl2, gl2.RGBA16F, gl2.RGBA, type);
          default:
            return null;
        }
      }
      return null;
    }
    return { internalFormat, format };
  }

  function supportRenderTextureFormat(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    internalFormat: number,
    format: number,
    type: number,
  ) {
    const texture = gl.createTexture();
    if (!texture) return false;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      4,
      4,
      0,
      format,
      type,
      null,
    );

    const fbo = gl.createFramebuffer();
    if (!fbo) {
      gl.deleteTexture(texture);
      return false;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(texture);
    return status === gl.FRAMEBUFFER_COMPLETE;
  }

  function hashCode(s: string) {
    if (!s.length) return 0;
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  function addKeywords(source: string, keywords: string[] | null) {
    if (!keywords) return source;
    let keywordsString = "";
    for (const keyword of keywords) {
      keywordsString += `#define ${keyword}\n`;
    }
    return keywordsString + source;
  }

  function compileShader(
    type: number,
    source: string,
    keywords: string[] | null = null,
  ): WebGLShader | null {
    const shaderSource = addKeywords(source, keywords);
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(
        "Fluid shader compilation failed.",
        gl.getShaderInfoLog(shader),
      );
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  function createProgram(
    vertexShader: WebGLShader | null,
    fragmentShader: WebGLShader | null,
  ): WebGLProgram | null {
    if (!vertexShader || !fragmentShader) return null;
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(
        "Fluid program linking failed.",
        gl.getProgramInfoLog(program),
      );
      gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  function getUniforms(program: WebGLProgram) {
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      const uniformInfo = gl.getActiveUniform(program, i);
      if (uniformInfo) {
        uniforms[uniformInfo.name] = gl.getUniformLocation(
          program,
          uniformInfo.name,
        );
      }
    }
    return uniforms;
  }

  class Program {
    program: WebGLProgram | null;
    uniforms: Record<string, WebGLUniformLocation | null>;

    constructor(
      vertexShader: WebGLShader | null,
      fragmentShader: WebGLShader | null,
    ) {
      this.program = createProgram(vertexShader, fragmentShader);
      this.uniforms = this.program ? getUniforms(this.program) : {};
    }

    bind() {
      if (this.program) gl.useProgram(this.program);
    }
  }

  class Material {
    vertexShader: WebGLShader | null;
    fragmentShaderSource: string;
    programs: Record<number, WebGLProgram | null>;
    activeProgram: WebGLProgram | null;
    uniforms: Record<string, WebGLUniformLocation | null>;

    constructor(
      vertexShader: WebGLShader | null,
      fragmentShaderSource: string,
    ) {
      this.vertexShader = vertexShader;
      this.fragmentShaderSource = fragmentShaderSource;
      this.programs = {};
      this.activeProgram = null;
      this.uniforms = {};
    }

    setKeywords(keywords: string[]) {
      let hash = 0;
      for (const kw of keywords) {
        hash += hashCode(kw);
      }
      let program = this.programs[hash];
      if (program == null) {
        const fragmentShader = compileShader(
          gl.FRAGMENT_SHADER,
          this.fragmentShaderSource,
          keywords,
        );
        program = createProgram(this.vertexShader, fragmentShader);
        this.programs[hash] = program;
      }
      if (program === this.activeProgram) return;
      if (program) {
        this.uniforms = getUniforms(program);
      }
      this.activeProgram = program;
    }

    bind() {
      if (this.activeProgram) {
        gl.useProgram(this.activeProgram);
      }
    }
  }

  // -------------------- Shaders --------------------
  const baseVertexShader = compileShader(
    gl.VERTEX_SHADER,
    `
        precision highp float;
        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform vec2 texelSize;

        void main () {
          vUv = aPosition * 0.5 + 0.5;
          vL = vUv - vec2(texelSize.x, 0.0);
          vR = vUv + vec2(texelSize.x, 0.0);
          vT = vUv + vec2(0.0, texelSize.y);
          vB = vUv - vec2(0.0, texelSize.y);
          gl_Position = vec4(aPosition, 0.0, 1.0);
        }
      `,
  );

  const copyShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        uniform sampler2D uTexture;

        void main () {
          gl_FragColor = texture2D(uTexture, vUv);
        }
      `,
  );

  const clearShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        uniform sampler2D uTexture;
        uniform float value;

        void main () {
          gl_FragColor = value * texture2D(uTexture, vUv);
        }
      `,
  );

  const displayShaderSource = `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uTexture;
        uniform sampler2D uDithering;
        uniform vec2 ditherScale;
        uniform vec2 texelSize;

        vec3 linearToGamma (vec3 color) {
          color = max(color, vec3(0));
          return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
        }

        void main () {
          vec3 c = texture2D(uTexture, vUv).rgb;
          #ifdef SHADING
            vec3 lc = texture2D(uTexture, vL).rgb;
            vec3 rc = texture2D(uTexture, vR).rgb;
            vec3 tc = texture2D(uTexture, vT).rgb;
            vec3 bc = texture2D(uTexture, vB).rgb;

            float dx = length(rc) - length(lc);
            float dy = length(tc) - length(bc);

            vec3 n = normalize(vec3(dx, dy, length(texelSize)));
            vec3 l = vec3(0.0, 0.0, 1.0);

            float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
            c *= diffuse;
          #endif

          float a = max(c.r, max(c.g, c.b));
          gl_FragColor = vec4(c, a);
        }
      `;

  const splatShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        uniform sampler2D uTarget;
        uniform float aspectRatio;
        uniform vec3 color;
        uniform vec2 point;
        uniform float radius;

        void main () {
          vec2 p = vUv - point.xy;
          p.x *= aspectRatio;
          vec3 splat = exp(-dot(p, p) / radius) * color;
          vec3 base = texture2D(uTarget, vUv).xyz;
          gl_FragColor = vec4(base + splat, 1.0);
        }
      `,
  );

  const advectionShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uSource;
        uniform vec2 texelSize;
        uniform vec2 dyeTexelSize;
        uniform float dt;
        uniform float dissipation;

        vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
          vec2 st = uv / tsize - 0.5;
          vec2 iuv = floor(st);
          vec2 fuv = fract(st);

          vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
          vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
          vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
          vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

          return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
        }

        void main () {
          #ifdef MANUAL_FILTERING
            vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
            vec4 result = bilerp(uSource, coord, dyeTexelSize);
          #else
            vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
            vec4 result = texture2D(uSource, coord);
          #endif
          float decay = 1.0 + dissipation * dt;
          gl_FragColor = result / decay;
        }
      `,
    ext.supportLinearFiltering ? null : ["MANUAL_FILTERING"],
  );

  const divergenceShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;

        void main () {
          float L = texture2D(uVelocity, vL).x;
          float R = texture2D(uVelocity, vR).x;
          float T = texture2D(uVelocity, vT).y;
          float B = texture2D(uVelocity, vB).y;

          vec2 C = texture2D(uVelocity, vUv).xy;
          if (vL.x < 0.0) { L = -C.x; }
          if (vR.x > 1.0) { R = -C.x; }
          if (vT.y > 1.0) { T = -C.y; }
          if (vB.y < 0.0) { B = -C.y; }

          float div = 0.5 * (R - L + T - B);
          gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
        }
      `,
  );

  const curlShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;

        void main () {
          float L = texture2D(uVelocity, vL).y;
          float R = texture2D(uVelocity, vR).y;
          float T = texture2D(uVelocity, vT).x;
          float B = texture2D(uVelocity, vB).x;
          float vorticity = R - L - T + B;
          gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
        }
      `,
  );

  const vorticityShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;
        uniform sampler2D uCurl;
        uniform float curl;
        uniform float dt;

        void main () {
          float L = texture2D(uCurl, vL).x;
          float R = texture2D(uCurl, vR).x;
          float T = texture2D(uCurl, vT).x;
          float B = texture2D(uCurl, vB).x;
          float C = texture2D(uCurl, vUv).x;

          vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
          force /= length(force) + 0.0001;
          force *= curl * C;
          force.y *= -1.0;

          vec2 velocity = texture2D(uVelocity, vUv).xy;
          velocity += force * dt;
          velocity = min(max(velocity, -1000.0), 1000.0);
          gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
      `,
  );

  const pressureShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uDivergence;

        void main () {
          float L = texture2D(uPressure, vL).x;
          float R = texture2D(uPressure, vR).x;
          float T = texture2D(uPressure, vT).x;
          float B = texture2D(uPressure, vB).x;
          float C = texture2D(uPressure, vUv).x;
          float divergence = texture2D(uDivergence, vUv).x;
          float pressure = (L + R + B + T - divergence) * 0.25;
          gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
        }
      `,
  );

  const gradientSubtractShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uVelocity;

        void main () {
          float L = texture2D(uPressure, vL).x;
          float R = texture2D(uPressure, vR).x;
          float T = texture2D(uPressure, vT).x;
          float B = texture2D(uPressure, vB).x;
          vec2 velocity = texture2D(uVelocity, vUv).xy;
          velocity.xy -= vec2(R - L, T - B);
          gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
      `,
  );

  // -------------------- Fullscreen Triangles --------------------
  const blit = (() => {
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
      gl.STATIC_DRAW,
    );
    const elemBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elemBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0, 1, 2, 0, 2, 3]),
      gl.STATIC_DRAW,
    );
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    return (target: FBO | null, doClear = false) => {
      if (!gl) return;
      if (!target) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      if (doClear) {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
  })();

  // Types for Framebuffers
  interface FBO {
    texture: WebGLTexture;
    fbo: WebGLFramebuffer;
    width: number;
    height: number;
    texelSizeX: number;
    texelSizeY: number;
    attach: (id: number) => number;
  }

  interface DoubleFBO {
    width: number;
    height: number;
    texelSizeX: number;
    texelSizeY: number;
    read: FBO;
    write: FBO;
    swap: () => void;
  }

  // FBO variables
  let dye: DoubleFBO;
  let velocity: DoubleFBO;
  let divergence: FBO;
  let curl: FBO;
  let pressure: DoubleFBO;

  // WebGL Programs
  const copyProgram = new Program(baseVertexShader, copyShader);
  const clearProgram = new Program(baseVertexShader, clearShader);
  const splatProgram = new Program(baseVertexShader, splatShader);
  const advectionProgram = new Program(baseVertexShader, advectionShader);
  const divergenceProgram = new Program(baseVertexShader, divergenceShader);
  const curlProgram = new Program(baseVertexShader, curlShader);
  const vorticityProgram = new Program(baseVertexShader, vorticityShader);
  const pressureProgram = new Program(baseVertexShader, pressureShader);
  const gradienSubtractProgram = new Program(
    baseVertexShader,
    gradientSubtractShader,
  );
  const displayMaterial = new Material(baseVertexShader, displayShaderSource);

  // -------------------- FBO creation --------------------
  function createFBO(
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number,
  ): FBO {
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      w,
      h,
      0,
      format,
      type,
      null,
    );
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const texelSizeX = 1 / w;
    const texelSizeY = 1 / h;

    return {
      texture,
      fbo,
      width: w,
      height: h,
      texelSizeX,
      texelSizeY,
      attach(id: number) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      },
    };
  }

  function createDoubleFBO(
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number,
  ): DoubleFBO {
    const fbo1 = createFBO(w, h, internalFormat, format, type, param);
    const fbo2 = createFBO(w, h, internalFormat, format, type, param);
    return {
      width: w,
      height: h,
      texelSizeX: fbo1.texelSizeX,
      texelSizeY: fbo1.texelSizeY,
      read: fbo1,
      write: fbo2,
      swap() {
        const tmp = this.read;
        this.read = this.write;
        this.write = tmp;
      },
    };
  }

  function deleteFBO(target: FBO | undefined) {
    if (!target) return;
    gl.deleteFramebuffer(target.fbo);
    gl.deleteTexture(target.texture);
  }

  function deleteDoubleFBO(target: DoubleFBO | undefined) {
    if (!target) return;
    deleteFBO(target.read);
    deleteFBO(target.write);
  }

  function resizeFBO(
    target: FBO,
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number,
  ) {
    const newFBO = createFBO(w, h, internalFormat, format, type, param);
    copyProgram.bind();
    if (copyProgram.uniforms.uTexture)
      gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
    blit(newFBO, false);
    deleteFBO(target);
    return newFBO;
  }

  function resizeDoubleFBO(
    target: DoubleFBO,
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number,
  ) {
    if (target.width === w && target.height === h) return target;
    target.read = resizeFBO(
      target.read,
      w,
      h,
      internalFormat,
      format,
      type,
      param,
    );
    deleteFBO(target.write);
    target.write = createFBO(w, h, internalFormat, format, type, param);
    target.width = w;
    target.height = h;
    target.texelSizeX = 1 / w;
    target.texelSizeY = 1 / h;
    return target;
  }

  function initFramebuffers() {
    const simRes = getResolution(config.SIM_RESOLUTION!);
    const dyeRes = getResolution(config.DYE_RESOLUTION!);

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const rg = ext.formatRG;
    const r = ext.formatR;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
    gl.disable(gl.BLEND);

    if (!dye) {
      dye = createDoubleFBO(
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering,
      );
    } else {
      dye = resizeDoubleFBO(
        dye,
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering,
      );
    }

    if (!velocity) {
      velocity = createDoubleFBO(
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering,
      );
    } else {
      velocity = resizeDoubleFBO(
        velocity,
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering,
      );
    }

    deleteFBO(divergence);
    divergence = createFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST,
    );
    deleteFBO(curl);
    curl = createFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST,
    );
    deleteDoubleFBO(pressure);
    pressure = createDoubleFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST,
    );
  }

  function updateKeywords() {
    const displayKeywords: string[] = [];
    if (config.SHADING) displayKeywords.push("SHADING");
    displayMaterial.setKeywords(displayKeywords);
  }

  function getResolution(resolution: number) {
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    const aspectRatio = w / h;
    const aspect = aspectRatio < 1 ? 1 / aspectRatio : aspectRatio;
    const min = Math.round(resolution);
    const max = Math.round(resolution * aspect);
    if (w > h) {
      return { width: max, height: min };
    }
    return { width: min, height: max };
  }

  function scaleByPixelRatio(input: number) {
    // This atmospheric overlay shares the GPU with the Three.js world.
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.35);
    return Math.floor(input * pixelRatio);
  }

  // -------------------- Simulation Setup --------------------
  updateKeywords();
  initFramebuffers();

  let lastUpdateTime = Date.now();
  let colorUpdateTimer = 0.0;
  let emissionTimer = 1;
  let leftEmitterColor = generateColor("left");
  let rightEmitterColor = generateColor("right");
  let streamsPrimed = false;
  let animationFrame = 0;
  let running = true;
  let sceneVisible = true;

  function updateFrame() {
    if (!running || !effectEnabled || document.hidden || !sceneVisible) {
      animationFrame = 0;
      return;
    }
    const dt = calcDeltaTime();
    if (resizeCanvas()) initFramebuffers();
    updateColors(dt);
    emitFromBehindSubject(dt);
    step(dt);
    render(null);
    animationFrame = requestAnimationFrame(updateFrame);
  }

  function calcDeltaTime() {
    const now = Date.now();
    let dt = (now - lastUpdateTime) / 1000;
    dt = Math.min(dt, 0.016666);
    lastUpdateTime = now;
    return dt;
  }

  function resizeCanvas() {
    const width = scaleByPixelRatio(canvas!.clientWidth);
    const height = scaleByPixelRatio(canvas!.clientHeight);
    if (canvas!.width !== width || canvas!.height !== height) {
      canvas!.width = width;
      canvas!.height = height;
      return true;
    }
    return false;
  }

  function updateColors(dt: number) {
    colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
    if (colorUpdateTimer >= 1) {
      colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
      leftEmitterColor = generateColor("left");
      rightEmitterColor = generateColor("right");
    }
  }

  function emitFromBehindSubject(dt: number) {
    if (!streamsPrimed) {
      primeSubjectStreams();
      streamsPrimed = true;
    }

    emissionTimer += dt * emissionRate;
    if (emissionTimer < 1) return;

    const bursts = Math.min(2, Math.floor(emissionTimer));
    emissionTimer %= 1;
    const outwardVelocity = config.SPLAT_FORCE * 0.018 * emitterReach;
    const cornerRise = outwardVelocity * (0.12 + emitterSpread * 1.8);
    const leftOriginX = Math.max(0.02, originX - emitterGap * 0.5);
    const rightOriginX = Math.min(0.98, originX + emitterGap * 0.5);

    for (let remaining = bursts; remaining > 0; remaining -= 1) {
      // Both nozzles sit behind the lower portrait. Their velocity fans up
      // and outward from a fixed origin toward the two top corners.
      splat(
        leftOriginX,
        emitterY,
        -outwardVelocity,
        cornerRise,
        leftEmitterColor,
      );
      splatDye(
        Math.max(0.02, leftOriginX - 0.06),
        emitterY + 0.018,
        leftEmitterColor,
        0.72,
      );
      splat(
        rightOriginX,
        emitterY,
        outwardVelocity,
        cornerRise,
        rightEmitterColor,
      );
      splatDye(
        Math.min(0.98, rightOriginX + 0.06),
        emitterY + 0.018,
        rightEmitterColor,
        0.72,
      );
    }
  }

  function primeSubjectStreams() {
    const outwardVelocity = config.SPLAT_FORCE * 0.018 * emitterReach;
    const cornerRise = outwardVelocity * (0.12 + emitterSpread * 1.8);
    const leftOriginX = Math.max(0.02, originX - emitterGap * 0.5);
    const rightOriginX = Math.min(0.98, originX + emitterGap * 0.5);

    for (let index = 0; index < 4; index += 1) {
      const progress = index / 3;
      const travel = progress * 0.13;
      const rise = progress * (0.06 + emitterSpread * 0.5);
      const radiusScale = 1 - progress * 0.12;

      splat(
        Math.max(0.02, leftOriginX - travel),
        Math.min(0.98, emitterY + rise),
        -outwardVelocity,
        cornerRise,
        leftEmitterColor,
      );
      splatDye(
        Math.max(0.02, leftOriginX - travel),
        Math.min(0.98, emitterY + rise),
        leftEmitterColor,
        radiusScale,
      );
      splat(
        Math.min(0.98, rightOriginX + travel),
        Math.min(0.98, emitterY + rise),
        outwardVelocity,
        cornerRise,
        rightEmitterColor,
      );
      splatDye(
        Math.min(0.98, rightOriginX + travel),
        Math.min(0.98, emitterY + rise),
        rightEmitterColor,
        radiusScale,
      );
    }
  }

  function step(dt: number) {
    gl.disable(gl.BLEND);

    // Curl
    curlProgram.bind();
    if (curlProgram.uniforms.texelSize) {
      gl.uniform2f(
        curlProgram.uniforms.texelSize,
        velocity.texelSizeX,
        velocity.texelSizeY,
      );
    }
    if (curlProgram.uniforms.uVelocity) {
      gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
    }
    blit(curl);

    // Vorticity
    vorticityProgram.bind();
    if (vorticityProgram.uniforms.texelSize) {
      gl.uniform2f(
        vorticityProgram.uniforms.texelSize,
        velocity.texelSizeX,
        velocity.texelSizeY,
      );
    }
    if (vorticityProgram.uniforms.uVelocity) {
      gl.uniform1i(
        vorticityProgram.uniforms.uVelocity,
        velocity.read.attach(0),
      );
    }
    if (vorticityProgram.uniforms.uCurl) {
      gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
    }
    if (vorticityProgram.uniforms.curl) {
      gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
    }
    if (vorticityProgram.uniforms.dt) {
      gl.uniform1f(vorticityProgram.uniforms.dt, dt);
    }
    blit(velocity.write);
    velocity.swap();

    // Divergence
    divergenceProgram.bind();
    if (divergenceProgram.uniforms.texelSize) {
      gl.uniform2f(
        divergenceProgram.uniforms.texelSize,
        velocity.texelSizeX,
        velocity.texelSizeY,
      );
    }
    if (divergenceProgram.uniforms.uVelocity) {
      gl.uniform1i(
        divergenceProgram.uniforms.uVelocity,
        velocity.read.attach(0),
      );
    }
    blit(divergence);

    // Clear pressure
    clearProgram.bind();
    if (clearProgram.uniforms.uTexture) {
      gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
    }
    if (clearProgram.uniforms.value) {
      gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
    }
    blit(pressure.write);
    pressure.swap();

    // Pressure
    pressureProgram.bind();
    if (pressureProgram.uniforms.texelSize) {
      gl.uniform2f(
        pressureProgram.uniforms.texelSize,
        velocity.texelSizeX,
        velocity.texelSizeY,
      );
    }
    if (pressureProgram.uniforms.uDivergence) {
      gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
    }
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      if (pressureProgram.uniforms.uPressure) {
        gl.uniform1i(
          pressureProgram.uniforms.uPressure,
          pressure.read.attach(1),
        );
      }
      blit(pressure.write);
      pressure.swap();
    }

    // Gradient Subtract
    gradienSubtractProgram.bind();
    if (gradienSubtractProgram.uniforms.texelSize) {
      gl.uniform2f(
        gradienSubtractProgram.uniforms.texelSize,
        velocity.texelSizeX,
        velocity.texelSizeY,
      );
    }
    if (gradienSubtractProgram.uniforms.uPressure) {
      gl.uniform1i(
        gradienSubtractProgram.uniforms.uPressure,
        pressure.read.attach(0),
      );
    }
    if (gradienSubtractProgram.uniforms.uVelocity) {
      gl.uniform1i(
        gradienSubtractProgram.uniforms.uVelocity,
        velocity.read.attach(1),
      );
    }
    blit(velocity.write);
    velocity.swap();

    // Advection - velocity
    advectionProgram.bind();
    if (advectionProgram.uniforms.texelSize) {
      gl.uniform2f(
        advectionProgram.uniforms.texelSize,
        velocity.texelSizeX,
        velocity.texelSizeY,
      );
    }
    if (!ext.supportLinearFiltering && advectionProgram.uniforms.dyeTexelSize) {
      gl.uniform2f(
        advectionProgram.uniforms.dyeTexelSize,
        velocity.texelSizeX,
        velocity.texelSizeY,
      );
    }
    const velocityId = velocity.read.attach(0);
    if (advectionProgram.uniforms.uVelocity) {
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
    }
    if (advectionProgram.uniforms.uSource) {
      gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
    }
    if (advectionProgram.uniforms.dt) {
      gl.uniform1f(advectionProgram.uniforms.dt, dt);
    }
    if (advectionProgram.uniforms.dissipation) {
      gl.uniform1f(
        advectionProgram.uniforms.dissipation,
        config.VELOCITY_DISSIPATION,
      );
    }
    blit(velocity.write);
    velocity.swap();

    // Advection - dye
    if (!ext.supportLinearFiltering && advectionProgram.uniforms.dyeTexelSize) {
      gl.uniform2f(
        advectionProgram.uniforms.dyeTexelSize,
        dye.texelSizeX,
        dye.texelSizeY,
      );
    }
    if (advectionProgram.uniforms.uVelocity) {
      gl.uniform1i(
        advectionProgram.uniforms.uVelocity,
        velocity.read.attach(0),
      );
    }
    if (advectionProgram.uniforms.uSource) {
      gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
    }
    if (advectionProgram.uniforms.dissipation) {
      gl.uniform1f(
        advectionProgram.uniforms.dissipation,
        config.DENSITY_DISSIPATION,
      );
    }
    blit(dye.write);
    dye.swap();
  }

  function render(target: FBO | null) {
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    drawDisplay(target);
  }

  function drawDisplay(target: FBO | null) {
    const width = target ? target.width : gl.drawingBufferWidth;
    const height = target ? target.height : gl.drawingBufferHeight;
    displayMaterial.bind();
    if (config.SHADING && displayMaterial.uniforms.texelSize) {
      gl.uniform2f(displayMaterial.uniforms.texelSize, 1 / width, 1 / height);
    }
    if (displayMaterial.uniforms.uTexture) {
      gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
    }
    blit(target, false);
  }

  // -------------------- Ambient emission --------------------
  function splat(
    x: number,
    y: number,
    dx: number,
    dy: number,
    color: ColorRGB,
  ) {
    splatProgram.bind();
    if (splatProgram.uniforms.uTarget) {
      gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
    }
    if (splatProgram.uniforms.aspectRatio) {
      gl.uniform1f(
        splatProgram.uniforms.aspectRatio,
        canvas!.width / canvas!.height,
      );
    }
    if (splatProgram.uniforms.point) {
      gl.uniform2f(splatProgram.uniforms.point, x, y);
    }
    if (splatProgram.uniforms.color) {
      gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0);
    }
    if (splatProgram.uniforms.radius) {
      gl.uniform1f(
        splatProgram.uniforms.radius,
        correctRadius(config.SPLAT_RADIUS / 100)!,
      );
    }
    blit(velocity.write);
    velocity.swap();

    splatDye(x, y, color);
  }

  function splatDye(x: number, y: number, color: ColorRGB, radiusScale = 1) {
    splatProgram.bind();
    if (splatProgram.uniforms.uTarget) {
      gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
    }
    if (splatProgram.uniforms.aspectRatio) {
      gl.uniform1f(
        splatProgram.uniforms.aspectRatio,
        canvas!.width / canvas!.height,
      );
    }
    if (splatProgram.uniforms.point) {
      gl.uniform2f(splatProgram.uniforms.point, x, y);
    }
    if (splatProgram.uniforms.color) {
      gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
    }
    if (splatProgram.uniforms.radius) {
      gl.uniform1f(
        splatProgram.uniforms.radius,
        correctRadius((config.SPLAT_RADIUS / 100) * radiusScale)!,
      );
    }
    blit(dye.write);
    dye.swap();
  }

  function correctRadius(radius: number) {
    // Use non-null assertion (canvas can't be null here)
    const aspectRatio = canvas!.width / canvas!.height;
    if (aspectRatio > 1) radius *= aspectRatio;
    return radius;
  }

  function generateColor(side: "left" | "right"): ColorRGB {
    if (colorMode === "original") {
      const color = HSVtoRGB(Math.random(), 1, 1);
      color.r *= colorStrength;
      color.g *= colorStrength;
      color.b *= colorStrength;
      return color;
    }

    const source = side === "left" ? smokeColor : secondaryColor;
    return {
      r: source.r * colorStrength,
      g: source.g * colorStrength,
      b: source.b * colorStrength,
    };
  }

  function HSVtoRGB(h: number, s: number, v: number): ColorRGB {
    let r = 0;
    let g = 0;
    let b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
    }
    return { r, g, b };
  }

  function wrap(value: number, min: number, max: number) {
    const range = max - min;
    if (range === 0) return min;
    return ((value - min) % range) + min;
  }

  function handleVisibilityChange() {
    if (
      !effectEnabled ||
      document.hidden ||
      !sceneVisible ||
      animationFrame ||
      !running
    )
      return;
    lastUpdateTime = Date.now();
    animationFrame = requestAnimationFrame(updateFrame);
  }

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    sceneVisible = entry.isIntersecting;
    if (
      !effectEnabled ||
      !sceneVisible ||
      animationFrame ||
      !running ||
      document.hidden
    )
      return;
    lastUpdateTime = Date.now();
    animationFrame = requestAnimationFrame(updateFrame);
  });
  visibilityObserver.observe(canvas);

  function handleFluidSettings(event: Event) {
    const detail = (
      event as CustomEvent<{
        enabled: boolean;
        colorMode: "original" | "custom";
        color: string;
        secondaryColor: string;
        colorStrength: number;
        fadeTime: number;
        radius: number;
        force: number;
        curl: number;
        reach: number;
        emissionRate: number;
        originX: number;
        emitterGap: number;
        emitterY: number;
        emitterSpread: number;
      }>
    ).detail;
    if (!detail) return;

    const wasEnabled = effectEnabled;
    effectEnabled = detail.enabled;
    colorMode = detail.colorMode;
    smokeColor = hexToRgb(detail.color);
    secondaryColor = hexToRgb(detail.secondaryColor);
    colorStrength = detail.colorStrength;
    config.DENSITY_DISSIPATION = Math.log(10) / detail.fadeTime;
    config.SPLAT_RADIUS = detail.radius;
    config.SPLAT_FORCE = detail.force;
    config.CURL = detail.curl;
    emitterReach = detail.reach;
    emissionRate = detail.emissionRate;
    originX = detail.originX;
    emitterGap = detail.emitterGap;
    emitterY = detail.emitterY;
    emitterSpread = detail.emitterSpread;
    leftEmitterColor = generateColor("left");
    rightEmitterColor = generateColor("right");

    if (!effectEnabled) {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      return;
    }

    if (!wasEnabled) {
      initFramebuffers();
      streamsPrimed = false;
      emissionTimer = 1;
    }
    if (!animationFrame && sceneVisible && !document.hidden && running) {
      lastUpdateTime = Date.now();
      animationFrame = requestAnimationFrame(updateFrame);
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener(FLUID_SETTINGS_EVENT, handleFluidSettings);
  // ------------------------------------------------------------
  // Add watchers for prop changes
  watch(
    () => props.simResolution,
    (newVal) => {
      config.SIM_RESOLUTION = newVal;
      initFramebuffers();
    },
  );

  watch(
    () => props.dyeResolution,
    (newVal) => {
      config.DYE_RESOLUTION = newVal;
      initFramebuffers();
    },
  );

  watch(
    () => props.shading,
    (newVal) => {
      config.SHADING = newVal;
      updateKeywords();
    },
  );

  disposeSimulation = () => {
    running = false;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    visibilityObserver.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener(FLUID_SETTINGS_EVENT, handleFluidSettings);
    deleteDoubleFBO(dye);
    deleteDoubleFBO(velocity);
    deleteFBO(divergence);
    deleteFBO(curl);
    deleteDoubleFBO(pressure);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };

  if (effectEnabled) animationFrame = requestAnimationFrame(updateFrame);
});
</script>

<template>
  <div :class="cn(`pointer-events-none size-full`, props.class)">
    <canvas id="fluid" ref="canvasRef" class="block h-screen w-screen" />
  </div>
</template>
