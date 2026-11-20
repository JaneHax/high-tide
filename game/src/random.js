// A seeded mulberry32 generator, the only source of randomness in the game: the same seed builds the
// same Puerto Sol, so a screenshot and a bug are both repeatable, and no module may call Math.random.

export function createRandom(seed) {
  let a = seed | 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    // A float in [min, max).
    range(min, max) {
      return min + next() * (max - min);
    },
    // A whole number from min to max, both included.
    intRange(min, max) {
      return Math.floor(min + next() * (max - min + 1));
    },
    // One element of a non-empty list.
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
    // True with probability p.
    chance(p) {
      return next() < p;
    },
  };
}
