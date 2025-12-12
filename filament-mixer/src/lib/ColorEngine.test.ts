import { describe, it, expect } from 'vitest';
import { mixFilaments } from './ColorEngine';

describe('ColorEngine Mixing', () => {
  it('mixes Red and Blue to Purple (approx)', () => {
    const result = mixFilaments([
      { color: '#ff0000', ratio: 0.5, strength: 1 },
      { color: '#0000ff', ratio: 0.5, strength: 1 }
    ]);
    // CMYK Red (0,1,1,0) + Blue (1,1,0,0) -> Avg (0.5, 1, 0.5, 0)
    // Deep purple/maroon.
    expect(result).not.toBe('#000000');
    expect(result).not.toBe('#ffffff');
  });

  it('mixes Red and Green to Brown (approx)', () => {
    const result = mixFilaments([
      { color: '#ff0000', ratio: 0.5, strength: 1 },
      { color: '#00ff00', ratio: 0.5, strength: 1 }
    ]);
    // CMYK Red (0,1,1,0) + Green (1,0,1,0) -> Avg (0.5, 0.5, 1, 0)
    // Olive/Brown.
    expect(result).not.toBe('#ffff00'); // Additive would be yellow
  });
});
