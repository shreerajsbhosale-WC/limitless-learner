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

export function drawSprite(ctx: CanvasRenderingContext2D, spec: SpriteSpec, scale: number) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, GRID * scale, GRID * scale);

  const layers: { grid: Grid; color: string }[] = [
    { grid: (bodyShapes[spec.body] ?? bodyShapes.round)(), color: spec.skin },
    { grid: (clothingStyles[spec.clothing] ?? clothingStyles.tshirt)(), color: spec.clothingColor },
    { grid: (hairStyles[spec.hair] ?? hairStyles.short)(), color: spec.hairColor },
    { grid: (eyeStyles[spec.eyes] ?? eyeStyles.dot)(), color: "#20201f" },
    { grid: (mouthStyles[spec.mouth] ?? mouthStyles.smile)(), color: "#7a3b2e" },
    { grid: (accessoryStyles[spec.accessory] ?? accessoryStyles.none)(), color: "#20201f" },
  ];

  for (const layer of layers) {
    ctx.fillStyle = layer.color;
    for (let i = 0; i < GRID; i++)
      for (let j = 0; j < GRID; j++)
        if (layer.grid[i][j]) ctx.fillRect(j * scale, i * scale, scale, scale);
  }
}
