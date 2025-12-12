import chroma from 'chroma-js';

export interface Filament {
  id: string;
  name: string;
  color: string; // Hex code
  transmission: number; // 0-1 (opacity/strength). 1 = solid, 0.1 = transparent. Default 1.
  strength: number;
}

export interface MixRecipe {
  name: string;
  slots: number;
  ratios: number[]; // e.g. [0.5, 0.5] for 1:1
}

export interface MixResult {
  id: string;
  color: string; // Hex
  recipeName: string;
  ingredients: {
    filament: Filament;
    part: number; // Ratio used
  }[];
}

export const RECIPES: MixRecipe[] = [
  // 2 Slots
  { name: '2-Color 1:1', slots: 2, ratios: [0.5, 0.5] },
  { name: '2-Color 3:1', slots: 2, ratios: [0.75, 0.25] },

  // 3 Slots
  { name: '3-Color 1:1:1', slots: 3, ratios: [0.3333, 0.3333, 0.3333] },
  { name: '3-Color 2:1:1', slots: 3, ratios: [0.5, 0.25, 0.25] },

  // 4 Slots
  { name: '4-Color 1:1:1:1', slots: 4, ratios: [0.25, 0.25, 0.25, 0.25] },
];

/**
 * Mixes colors using a CMYK subtractive approximation.
 *
 * @param inputs Array of { color: hex, ratio: number, strength: number }
 * @returns Resulting hex color
 */
export function mixFilaments(inputs: { color: string; ratio: number; strength: number }[]): string {
  if (inputs.length === 0) return '#000000';

  let c = 0, m = 0, y = 0, k = 0;
  let totalWeight = 0;

  for (const input of inputs) {
    const cmyk = chroma(input.color).cmyk();
    const weight = input.ratio * input.strength;

    c += cmyk[0] * weight;
    m += cmyk[1] * weight;
    y += cmyk[2] * weight;
    k += cmyk[3] * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return '#000000';

  // Normalize
  c = c / totalWeight;
  m = m / totalWeight;
  y = y / totalWeight;
  k = k / totalWeight;

  return chroma.cmyk(c, m, y, k).hex();
}

/**
 * Generates all possible mixes for a given inventory.
 */
export function generateMixes(inventory: Filament[]): MixResult[] {
  const results: MixResult[] = [];
  const uniqueKeys = new Set<string>();

  for (const recipe of RECIPES) {
    const combinations = getPermutationsWithReplacement(inventory, recipe.slots);

    for (const combo of combinations) {
      const inputs = combo.map((filament, index) => ({
        color: filament.color,
        ratio: recipe.ratios[index],
        strength: filament.strength
      }));

      const resultHex = mixFilaments(inputs);

      const ingredients = combo.map((f, i) => ({ filament: f, part: recipe.ratios[i] }));

      const allRatiosEqual = recipe.ratios.every(r => Math.abs(r - recipe.ratios[0]) < 0.001);

      let key = '';
      if (allRatiosEqual) {
        const sortedCombo = [...combo].sort((a, b) => a.id.localeCompare(b.id));
        key = `${recipe.name}::${sortedCombo.map(f => f.id).join('-')}`;
      } else {
        key = `${recipe.name}::${combo.map(f => f.id).join('-')}`;
      }

      if (uniqueKeys.has(key)) continue;
      uniqueKeys.add(key);

      results.push({
        id: key,
        color: resultHex,
        recipeName: recipe.name,
        ingredients
      });
    }
  }

  return results;
}

function getPermutationsWithReplacement<T extends { id: string }>(options: T[], length: number): T[][] {
  const perms: T[][] = [];

  function backtrack(current: T[]) {
    if (current.length === length) {
      perms.push([...current]);
      return;
    }

    for (const option of options) {
      backtrack([...current, option]);
    }
  }

  backtrack([]);

  // Filter out where all items are the same (boring)
  return perms.filter(p => !p.every(item => item.id === p[0].id));
}
