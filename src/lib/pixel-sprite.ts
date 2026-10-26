// Deterministic 32x32 pixel sprite renderer (ported from the pixel character generator).
export const GRID = 32;

export type Cell = 0 | 1;
export type Grid = Cell[][];

export type SpriteSpec = {
  body: BodyKey;
  hair: HairKey;
  hairColor: string;
  eyes: EyeKey;
  mouth: MouthKey;
  clothing: ClothingKey;
  clothingColor: string;
  skin: string;
  accessory: AccessoryKey;
};

function emptyGrid(): Grid {
  return Array.from({ length: GRID }, () => Array(GRID).fill(0) as Cell[]);
}

function rect(g: Grid, x: number, y: number, w: number, h: number) {
  for (let i = y; i < y + h; i++)
    for (let j = x; j < x + w; j++) if (g[i] && i < GRID && j < GRID && j >= 0) g[i][j] = 1;
}

const bodyShapes = {
  round: () => {
    const g = emptyGrid();
    rect(g, 11, 4, 10, 10);
    rect(g, 10, 14, 12, 3);
    rect(g, 9, 17, 14, 11);
    return g;
  },
  slim: () => {
    const g = emptyGrid();
    rect(g, 12, 3, 8, 9);
    rect(g, 11, 12, 10, 3);
    rect(g, 10, 15, 12, 13);
    return g;
  },
  broad: () => {
    const g = emptyGrid();
    rect(g, 10, 4, 12, 10);
    rect(g, 7, 14, 18, 4);
    rect(g, 7, 18, 18, 10);
    return g;
  },
  chibi: () => {
    const g = emptyGrid();
    rect(g, 8, 3, 16, 14);
    rect(g, 11, 17, 10, 2);
    rect(g, 10, 19, 12, 9);
    return g;
  },
};

const hairStyles = {
  bald: () => emptyGrid(),
  short: () => {
    const g = emptyGrid();
    rect(g, 10, 3, 12, 3);
    rect(g, 10, 6, 2, 4);
    rect(g, 20, 6, 2, 4);
    return g;
  },
  bob: () => {
    const g = emptyGrid();
    rect(g, 9, 3, 14, 4);
    rect(g, 9, 7, 3, 8);
    rect(g, 20, 7, 3, 8);
    return g;
  },
  spiky: () => {
    const g = emptyGrid();
    rect(g, 10, 2, 2, 3);
    rect(g, 13, 1, 2, 4);
    rect(g, 16, 2, 2, 3);
    rect(g, 19, 1, 2, 4);
    rect(g, 22, 2, 2, 3);
    rect(g, 10, 4, 12, 3);
    return g;
  },
  long: () => {
    const g = emptyGrid();
    rect(g, 9, 3, 14, 4);
    rect(g, 9, 7, 3, 14);
    rect(g, 20, 7, 3, 14);
    return g;
  },
  mohawk: () => {
    const g = emptyGrid();
    rect(g, 15, 1, 2, 6);
    rect(g, 14, 3, 4, 2);
    return g;
  },
};

const eyeStyles = {
  dot: () => {
    const g = emptyGrid();
    rect(g, 13, 9, 2, 2);
    rect(g, 17, 9, 2, 2);
    return g;
  },
  wide: () => {
    const g = emptyGrid();
    rect(g, 12, 9, 3, 2);
    rect(g, 17, 9, 3, 2);
    return g;
  },
  sleepy: () => {
    const g = emptyGrid();
    rect(g, 12, 10, 3, 1);
    rect(g, 17, 10, 3, 1);
    return g;
  },
  star: () => {
    const g = emptyGrid();
    rect(g, 13, 8, 1, 3);
    rect(g, 12, 9, 3, 1);
    rect(g, 18, 8, 1, 3);
    rect(g, 17, 9, 3, 1);
    return g;
  },
};

const mouthStyles = {
  flat: () => {
    const g = emptyGrid();
    rect(g, 14, 12, 4, 1);
    return g;
  },
  smile: () => {
    const g = emptyGrid();
    rect(g, 13, 12, 1, 1);
    rect(g, 14, 13, 4, 1);
    rect(g, 18, 12, 1, 1);
    return g;
  },
  open: () => {
    const g = emptyGrid();
    rect(g, 14, 12, 4, 2);
    return g;
  },
  none: () => emptyGrid(),
};

const clothingStyles = {
  tshirt: () => {
    const g = emptyGrid();
    rect(g, 9, 17, 14, 11);
    return g;
  },
  hoodie: () => {
    const g = emptyGrid();
    rect(g, 8, 16, 16, 12);
    rect(g, 13, 16, 6, 2);
    return g;
  },
  robe: () => {
    const g = emptyGrid();
    rect(g, 8, 16, 16, 12);
    rect(g, 14, 17, 4, 4);
    return g;
  },
  armor: () => {
    const g = emptyGrid();
    rect(g, 8, 16, 16, 12);
    rect(g, 7, 17, 2, 4);
    rect(g, 23, 17, 2, 4);
    return g;
  },
  overalls: () => {
    const g = emptyGrid();
    rect(g, 9, 17, 14, 11);
    rect(g, 11, 15, 3, 4);
    rect(g, 18, 15, 3, 4);
    return g;
  },
};

const accessoryStyles = {
  none: () => emptyGrid(),
  glasses: () => {
    const g = emptyGrid();
    rect(g, 11, 8, 5, 1);
    rect(g, 16, 8, 5, 1);
    rect(g, 11, 9, 5, 3);
    rect(g, 16, 9, 5, 3);
    return g;
  },
  headband: () => {
    const g = emptyGrid();
    rect(g, 10, 7, 12, 1);
    return g;
  },
  crown: () => {
    const g = emptyGrid();
    rect(g, 10, 2, 12, 2);
    rect(g, 10, 0, 2, 2);
    rect(g, 15, 0, 2, 2);
    rect(g, 20, 0, 2, 2);
    return g;
  },
  hat: () => {
    const g = emptyGrid();
    rect(g, 9, 1, 14, 3);
    rect(g, 11, 0, 10, 1);
    return g;
  },
};

export type BodyKey = keyof typeof bodyShapes;
export type HairKey = keyof typeof hairStyles;
export type EyeKey = keyof typeof eyeStyles;
export type MouthKey = keyof typeof mouthStyles;
export type ClothingKey = keyof typeof clothingStyles;
export type AccessoryKey = keyof typeof accessoryStyles;

export const SPRITE_OPTIONS = {
  body: Object.keys(bodyShapes) as BodyKey[],
  hair: Object.keys(hairStyles) as HairKey[],
  eyes: Object.keys(eyeStyles) as EyeKey[],
  mouth: Object.keys(mouthStyles) as MouthKey[],
  clothing: Object.keys(clothingStyles) as ClothingKey[],
  accessory: Object.keys(accessoryStyles) as AccessoryKey[],
};

export const SKIN_TONES = ["#ffe0bd", "#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#4a2c17"];

function pick<T>(arr: T[], n: number): T {
  return arr[Math.abs(n) % arr.length];
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Build a stable sprite from a name, filling any gaps in a partial spec. */
export function spriteFromSeed(seed: string, partial?: Partial<SpriteSpec>): SpriteSpec {
  const h = hashString(seed);
  const hairColors = ["#1c1c1c", "#4a2e1f", "#8a5a2b", "#d9a441", "#c0392b", "#7f77dd", "#e9e9ee"];
  const clothColors = ["#3c6ea5", "#1D9E75", "#D85A30", "#D4537E", "#639922", "#8b5cf6", "#BA7517"];
  return {
    body: partial?.body ?? pick(SPRITE_OPTIONS.body, h),
    hair: partial?.hair ?? pick(SPRITE_OPTIONS.hair, h >> 3),
    hairColor: partial?.hairColor ?? pick(hairColors, h >> 5),
    eyes: partial?.eyes ?? pick(SPRITE_OPTIONS.eyes, h >> 7),
    mouth: partial?.mouth ?? pick(SPRITE_OPTIONS.mouth, h >> 9),
    clothing: partial?.clothing ?? pick(SPRITE_OPTIONS.clothing, h >> 11),
    clothingColor: partial?.clothingColor ?? pick(clothColors, h >> 13),
    skin: partial?.skin ?? pick(SKIN_TONES, h >> 15),
    accessory: partial?.accessory ?? pick(SPRITE_OPTIONS.accessory, h >> 17),
  };
}

/* ===== Rigging-based multi-direction rotation =====
   One spec acts as the anchor model: the same body/hair/clothing layers are
   re-projected into 4 facings (down/up/left/right) with colors kept consistent. */
export type SpriteDirection = "down" | "up" | "left" | "right";

function compressTowardCenter(g: Grid, factor = 0.72): Grid {
  const out = emptyGrid();
  for (let i = 0; i < GRID; i++)
    for (let j = 0; j < GRID; j++) {
      if (!g[i][j]) continue;
      const c = Math.min(GRID - 1, Math.max(0, Math.round(15.5 + (j - 15.5) * factor)));
      out[i][c] = 1;
    }
  return out;
}

function flipGrid(g: Grid): Grid {
  const out = emptyGrid();
  for (let i = 0; i < GRID; i++)
    for (let j = 0; j < GRID; j++) if (g[i][j]) out[i][GRID - 1 - j] = 1;
  return out;
}

const sideEyes = () => {
  const g = emptyGrid();
  rect(g, 13, 9, 2, 2);
  return g;
};
const sideMouth = () => {
  const g = emptyGrid();
  rect(g, 13, 12, 3, 1);
  return g;
};

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  spec: SpriteSpec,
  scale: number,
  direction: SpriteDirection = "down"
) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, GRID * scale, GRID * scale);

  const body = bodyShapes[spec.body] ?? bodyShapes.round;
  const clothing = clothingStyles[spec.clothing] ?? clothingStyles.tshirt;
  const hair = hairStyles[spec.hair] ?? hairStyles.short;
  const accessory = accessoryStyles[spec.accessory] ?? accessoryStyles.none;

  let layers: { grid: Grid; color: string }[];
  if (direction === "down") {
    layers = [
      { grid: body(), color: spec.skin },
      { grid: clothing(), color: spec.clothingColor },
      { grid: hair(), color: spec.hairColor },
      { grid: (eyeStyles[spec.eyes] ?? eyeStyles.dot)(), color: "#20201f" },
      { grid: (mouthStyles[spec.mouth] ?? mouthStyles.smile)(), color: "#7a3b2e" },
      { grid: accessory(), color: "#20201f" },
    ];
  } else if (direction === "up") {
    // Back view: silhouette and clothing unchanged, face features dropped.
    layers = [
      { grid: body(), color: spec.skin },
      { grid: clothing(), color: spec.clothingColor },
      { grid: hair(), color: spec.hairColor },
      ...(spec.accessory !== "glasses" ? [{ grid: accessory(), color: "#20201f" }] : []),
    ];
  } else {
    // Side profile: skeleton compressed toward center, one eye, mirrored for right.
    const f = direction === "right" ? flipGrid : (g: Grid) => g;
    layers = [
      { grid: f(compressTowardCenter(body())), color: spec.skin },
      { grid: f(compressTowardCenter(clothing())), color: spec.clothingColor },
      { grid: f(compressTowardCenter(hair())), color: spec.hairColor },
      { grid: f(compressTowardCenter(accessory())), color: "#20201f" },
      { grid: f(sideEyes()), color: "#20201f" },
      { grid: f(sideMouth()), color: "#7a3b2e" },
    ];
  }

  for (const layer of layers) {
    ctx.fillStyle = layer.color;
    for (let i = 0; i < GRID; i++)
      for (let j = 0; j < GRID; j++)
        if (layer.grid[i][j]) ctx.fillRect(j * scale, i * scale, scale, scale);
  }
}

/* ===== Frame-state VFX sequencing =====
   Each effect is a 3-frame progression (orb -> blast -> fade), rendered at
   low effective frame rate by the component for the retro feel. */
export type EffectKey = "none" | "fireball" | "slash" | "spark" | "aura";

const ringRect = (g: Grid, x: number, y: number, w: number, h: number) => {
  rect(g, x, y, w, 1);
  rect(g, x, y + h - 1, w, 1);
  rect(g, x, y, 1, h);
  rect(g, x + w - 1, y, 1, h);
};

const vfxFrames: Record<Exclude<EffectKey, "none">, (() => Grid)[]> = {
  fireball: [
    () => {
      const g = emptyGrid();
      rect(g, 14, 14, 4, 4);
      rect(g, 13, 15, 6, 2);
      return g;
    },
    () => {
      const g = emptyGrid();
      ringRect(g, 10, 10, 12, 12);
      rect(g, 14, 12, 4, 8);
      rect(g, 12, 14, 8, 4);
      return g;
    },
    () => {
      const g = emptyGrid();
      rect(g, 11, 7, 2, 2);
      rect(g, 19, 8, 2, 2);
      rect(g, 9, 14, 2, 2);
      rect(g, 21, 16, 2, 2);
      rect(g, 13, 21, 2, 2);
      rect(g, 18, 22, 2, 2);
      return g;
    },
  ],
  slash: [
    () => {
      const g = emptyGrid();
      for (let i = 9; i <= 23; i++) g[i][26 - i] = 1;
      return g;
    },
    () => {
      const g = emptyGrid();
      for (let i = 7; i <= 25; i++) {
        g[i][26 - i] = 1;
        if (g[i - 1]) g[i - 1][26 - i] = 1;
        if (g[i + 1]) g[i + 1][26 - i] = 1;
      }
      return g;
    },
    () => {
      const g = emptyGrid();
      for (let i = 14; i <= 22; i++) g[i][24 - i] = 1;
      return g;
    },
  ],
  spark: [
    () => {
      const g = emptyGrid();
      rect(g, 15, 11, 2, 10);
      rect(g, 11, 15, 10, 2);
      return g;
    },
    () => {
      const g = emptyGrid();
      rect(g, 15, 7, 2, 18);
      rect(g, 7, 15, 18, 2);
      rect(g, 11, 11, 2, 2);
      rect(g, 19, 11, 2, 2);
      rect(g, 11, 19, 2, 2);
      rect(g, 19, 19, 2, 2);
      return g;
    },
    () => {
      const g = emptyGrid();
      rect(g, 8, 9, 2, 2);
      rect(g, 21, 7, 2, 2);
      rect(g, 10, 20, 2, 2);
      rect(g, 22, 19, 2, 2);
      rect(g, 15, 13, 2, 2);
      return g;
    },
  ],
  aura: [
    () => {
      const g = emptyGrid();
      ringRect(g, 10, 10, 12, 12);
      return g;
    },
    () => {
      const g = emptyGrid();
      ringRect(g, 8, 8, 16, 16);
      ringRect(g, 12, 12, 8, 8);
      return g;
    },
    () => {
      const g = emptyGrid();
      ringRect(g, 9, 9, 14, 14);
      rect(g, 15, 5, 2, 2);
      rect(g, 15, 25, 2, 2);
      return g;
    },
  ],
};

export const VFX_COLORS: Record<Exclude<EffectKey, "none">, [string, string]> = {
  fireball: ["#fb923c", "#fde047"],
  slash: ["#a78bfa", "#ede9fe"],
  spark: ["#fde047", "#ffffff"],
  aura: ["#34d399", "#a7f3d0"],
};

export function drawVfx(
  ctx: CanvasRenderingContext2D,
  effect: Exclude<EffectKey, "none">,
  frame: number,
  scale: number
) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, GRID * scale, GRID * scale);
  const grid = vfxFrames[effect][((frame % 3) + 3) % 3]();
  const [core, glow] = VFX_COLORS[effect];
  ctx.fillStyle = glow + "44";
  for (let i = 0; i < GRID; i++)
    for (let j = 0; j < GRID; j++)
      if (grid[i][j]) ctx.fillRect((j - 1) * scale, (i - 1) * scale, scale * 3, scale * 3);
  ctx.fillStyle = core;
  for (let i = 0; i < GRID; i++)
    for (let j = 0; j < GRID; j++)
      if (grid[i][j]) ctx.fillRect(j * scale, i * scale, scale, scale);
}
