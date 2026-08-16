/**
 * Organic torn-paper edge for the Cadde split hero.
 * Integer noise only so SSR and the client emit the same clip paths.
 */

function hash01(i: number): number {
  let t = Math.imul(i, 0x9e3779b9) + 0x243f6a88;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothNoise(i: number, period: number, seed: number): number {
  const bucket = Math.trunc(i / period);
  const t = (i % period) / period;
  const u = t * t * (3 - 2 * t);
  return lerp(hash01(bucket * 17 + seed), hash01((bucket + 1) * 17 + seed), u);
}

const STEPS = 260;
const STEPS_MOBILE = 84;

function pulse(i: number, center: number, width: number): number {
  const d = Math.abs(i - center);
  if (d >= width) return 0;
  const t = d / width;
  return 1 - t * t * (3 - 2 * t);
}

type TearBump = { center: number; width: number; amp: number };

function buildBumps(seed: number, steps: number): TearBump[] {
  const bumps: TearBump[] = [];
  for (let k = 0; k < 7; k += 1) {
    bumps.push({
      center: Math.round(24 + hash01(k + 200 + seed) * (steps - 48)),
      width: 10 + Math.round(hash01(k + 310 + seed) * 14),
      amp: (hash01(k + 420 + seed) - 0.5) * 0.011,
    });
  }
  return bumps;
}

type TearSpec = {
  seed: number;
  originX: number;
  /** Rightward bulge in the middle; 0 at top and bottom. */
  driftRight?: number;
  wanderPeriod?: number;
  wavePeriod?: number;
  steps?: number;
  /** Multiplies wander / nicks so the rip reads on a narrow screen. */
  amp?: number;
  fiberScale?: number;
};

type Point = readonly [number, number];

function buildTear(spec: TearSpec): { outer: Point[]; inner: Point[] } {
  const { seed, originX, driftRight = 0 } = spec;
  const steps = spec.steps ?? STEPS;
  const amp = spec.amp ?? 1;
  const fiberScale = spec.fiberScale ?? 1;
  const wanderPeriod = spec.wanderPeriod ?? 92;
  const wavePeriod = spec.wavePeriod ?? 48;
  const bumps = buildBumps(seed, steps);
  const outer: Point[] = [];
  const inner: Point[] = [];

  for (let i = 0; i <= steps; i += 1) {
    const y = i / steps;
    const wander = (smoothNoise(i, wanderPeriod, 1 + seed) - 0.5) * 0.013 * amp;
    const wave = (smoothNoise(i, wavePeriod, 4 + seed) - 0.5) * 0.0045 * amp;
    let pull = 0;
    for (const bump of bumps) {
      pull += bump.amp * amp * pulse(i, bump.center, bump.width);
    }
    const nick =
      hash01(i + 90 + seed) > 0.93
        ? (hash01(i + 91 + seed) - 0.5) * 0.0028 * amp
        : 0;
    const fuzz = (hash01(i + 2 + seed) - 0.5) * 0.0007 * amp;
    const along = i === 0 || i === steps ? 0 : Math.sin(Math.PI * y);
    const x =
      originX +
      driftRight * along +
      (wander + wave + pull + nick + fuzz) * along;

    const fiber =
      (0.0008 +
        smoothNoise(i, 18, 8 + seed) * 0.0014 +
        hash01(i + 20 + seed) * 0.00025) *
      fiberScale;
    outer.push([x, y]);
    inner.push([x + fiber, y]);
  }

  return { outer, inner };
}

function clipsFrom(tear: { outer: Point[]; inner: Point[] }) {
  return {
    left: `polygon(0% 0%, ${edgeList(tear.outer)}, 0% 100%)`,
    right: `polygon(100% 0%, ${edgeList(tear.outer)}, 100% 100%)`,
    fiber: `polygon(${edgeList(tear.outer)}, ${edgeList([...tear.inner].reverse())})`,
  };
}

function pct(n: number): string {
  return `${(n * 100).toFixed(3)}%`;
}

function edgeList(pts: Point[]): string {
  return pts.map(([x, y]) => `${pct(x)} ${pct(y)}`).join(", ");
}

export type CaddeHeroTearId = "lila" | "ayla";

const TEAR_GEOMETRY: Record<CaddeHeroTearId, { outer: Point[]; inner: Point[] }> = {
  lila: buildTear({ seed: 0, originX: 0.5 }),
  ayla: buildTear({
    seed: 11,
    originX: 0.5,
    driftRight: 0.024,
    wanderPeriod: 76,
    wavePeriod: 34,
  }),
};

export const CADDE_HERO_TEARS: Record<
  CaddeHeroTearId,
  { left: string; right: string; fiber: string }
> = {
  lila: clipsFrom(TEAR_GEOMETRY.lila),
  ayla: clipsFrom(TEAR_GEOMETRY.ayla),
};

const TEAR_GEOMETRY_MOBILE: Record<CaddeHeroTearId, { outer: Point[]; inner: Point[] }> = {
  lila: buildTear({
    seed: 0,
    originX: 0.5,
    steps: STEPS_MOBILE,
    amp: 3.2,
    fiberScale: 2.6,
    wanderPeriod: 26,
    wavePeriod: 12,
  }),
  ayla: buildTear({
    seed: 11,
    originX: 0.5,
    driftRight: 0.046,
    steps: STEPS_MOBILE,
    amp: 3.4,
    fiberScale: 2.6,
    wanderPeriod: 22,
    wavePeriod: 11,
  }),
};

/** Fewer vertices + wider wobble so iOS keeps an organic rip. */
export const CADDE_HERO_TEARS_MOBILE: Record<
  CaddeHeroTearId,
  { left: string; right: string; fiber: string }
> = {
  lila: clipsFrom(TEAR_GEOMETRY_MOBILE.lila),
  ayla: clipsFrom(TEAR_GEOMETRY_MOBILE.ayla),
};

function sliceProgress(pts: Point[], progress: number): Point[] {
  const t = Math.min(1, Math.max(0, progress));
  const last = Math.max(1, Math.ceil((pts.length - 1) * t));
  return pts.slice(0, last + 1);
}

/** Tear clips at 0–1 rip progress. 0 = intact color photo, 1 = full split. */
export function caddeHeroTearClipsAt(
  id: CaddeHeroTearId,
  progress: number,
): { left: string; right: string; fiber: string } {
  if (progress >= 0.999) return CADDE_HERO_TEARS[id];
  if (progress <= 0.001) {
    return {
      left: "none",
      right: "inset(0 0 100% 0)",
      fiber: "inset(0 0 100% 0)",
    };
  }
  const geometry = TEAR_GEOMETRY[id];
  const outer = sliceProgress(geometry.outer, progress);
  const inner = sliceProgress(geometry.inner, progress);
  const yEnd = outer[outer.length - 1][1];
  return {
    left: "none",
    right: `polygon(100% 0%, ${edgeList(outer)}, 100% ${pct(yEnd)})`,
    fiber: `polygon(${edgeList(outer)}, ${edgeList([...inner].reverse())})`,
  };
}

function peelClipFrom(outer: Point[]): string {
  const edge = outer.filter(([, y]) => y <= 0.28);
  if (edge.length < 2) return "polygon(0% 0%, 0% 0%, 0% 0%)";
  return `polygon(10% 0%, ${edgeList(edge)}, 16% 36%, 0% 24%, 0% 0%)`;
}

const PEEL_CLIPS: Record<CaddeHeroTearId, string> = {
  lila: peelClipFrom(TEAR_GEOMETRY.lila.outer),
  ayla: peelClipFrom(TEAR_GEOMETRY.ayla.outer),
};

export function caddeHeroPeelClip(id: CaddeHeroTearId): string {
  return PEEL_CLIPS[id];
}

export function caddeHeroRipHead(
  id: CaddeHeroTearId,
  progress: number,
): { x: number; y: number } {
  const outer = TEAR_GEOMETRY[id].outer;
  const index = Math.round((outer.length - 1) * Math.min(1, Math.max(0, progress)));
  const [x, y] = outer[index];
  return { x, y };
}

const GRAIN_MOTTLE = encodeURIComponent(
  `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg"><filter id="m"><feTurbulence type="fractalNoise" baseFrequency="0.032" numOctaves="3" seed="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#m)" opacity="0.55"/></svg>`,
);

const GRAIN_FIBERS = encodeURIComponent(
  `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg"><filter id="f"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.07" numOctaves="4" seed="11" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#f)" opacity="0.5"/></svg>`,
);

/** Laid-paper grain: slow mottle + stretched fibers. */
export const CADDE_HERO_PAPER_GRAIN = `url("data:image/svg+xml,${GRAIN_MOTTLE}"), url("data:image/svg+xml,${GRAIN_FIBERS}")`;

const RIP_PULP = encodeURIComponent(
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="2.6" numOctaves="4" seed="19" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.86  0 0 0 0 0.83  0 0 0 0 0.76  0 0 0 0.9 0"/></filter><rect width="100%" height="100%" filter="url(#p)"/></svg>`,
);

const RIP_STRANDS = encodeURIComponent(
  `<svg viewBox="0 0 24 96" xmlns="http://www.w3.org/2000/svg"><filter id="s"><feTurbulence type="fractalNoise" baseFrequency="0.22 1.6" numOctaves="3" seed="8" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#s)"/></svg>`,
);

/** Dense pulp + vertical strands for the torn white lip. */
export const CADDE_HERO_RIP_TEXTURE = `url("data:image/svg+xml,${RIP_PULP}"), url("data:image/svg+xml,${RIP_STRANDS}"), linear-gradient(90deg, #ffffff 0%, #f7f4ec 70%, #eee8dc 100%)`;
