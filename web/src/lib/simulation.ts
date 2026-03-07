export function randomDelta(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function clampScore(value: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, value)));
}

export function shouldTrigger(probability: number): boolean {
  return Math.random() < probability;
}

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
