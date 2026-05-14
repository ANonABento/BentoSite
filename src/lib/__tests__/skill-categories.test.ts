import { describe, expect, it } from 'vitest';
import { categorizeTechnologies } from '@/lib/skill-categories';

describe('categorizeTechnologies', () => {
  it('returns an empty array for empty input', () => {
    expect(categorizeTechnologies([])).toEqual([]);
  });

  it('drops empty / whitespace-only / non-string entries', () => {
    const result = categorizeTechnologies(['', '   ', 'Python', null as unknown as string]);
    expect(result).toHaveLength(1);
    expect(result[0].items).toEqual(['Python']);
  });

  it('de-duplicates case-insensitively but preserves the first casing seen', () => {
    const result = categorizeTechnologies(['Python', 'python', 'PYTHON']);
    expect(result).toHaveLength(1);
    expect(result[0].items).toEqual(['Python']);
  });

  it('places hardware tokens into HARDWARE', () => {
    const result = categorizeTechnologies(['STM32', 'ESP32-CAM', 'Dynamixel', 'Arduino']);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('hardware');
    expect(result[0].items).toEqual(
      expect.arrayContaining(['STM32', 'ESP32-CAM', 'Dynamixel', 'Arduino']),
    );
  });

  it('places code/framework tokens into STACK', () => {
    const result = categorizeTechnologies(['Python', 'TypeScript', 'Next.js', 'ROS2', 'PyTorch']);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('stack');
    expect(result[0].items).toEqual(
      expect.arrayContaining(['Python', 'TypeScript', 'Next.js', 'ROS2', 'PyTorch']),
    );
  });

  it('places CAD / IDE / simulation tokens into TOOLING', () => {
    const result = categorizeTechnologies(['Fusion 360', 'OnShape', 'Blender', 'MeshCat', 'Docker']);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('tooling');
    expect(result[0].items).toEqual(
      expect.arrayContaining(['Fusion 360', 'OnShape', 'Blender', 'MeshCat', 'Docker']),
    );
  });

  it('falls unknown tokens through to MISC', () => {
    const result = categorizeTechnologies(['SomeUnknownLib', 'Mystery DSL']);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('misc');
    expect(result[0].items).toEqual(['SomeUnknownLib', 'Mystery DSL']);
  });

  it('groups a mixed technologies array in the canonical order (HARDWARE → STACK → TOOLING → MISC)', () => {
    const result = categorizeTechnologies([
      'Fusion 360', // tooling
      'Python', // stack
      'STM32', // hardware
      'WeirdFramework', // misc
    ]);
    expect(result.map((g) => g.key)).toEqual(['hardware', 'stack', 'tooling', 'misc']);
  });

  it('handles a real project payload (robotic-arm-puppeteer)', () => {
    const result = categorizeTechnologies([
      'Python',
      'ROS2',
      'OpenCV',
      'AprilTag',
      'Dynamixel',
      'Fusion 360',
      'MuJoCo',
      'Isaac Sim',
      'MeshCat',
      'Flask',
      'Three.js',
    ]);

    const byKey = Object.fromEntries(result.map((g) => [g.key, g.items]));

    expect(byKey.hardware).toContain('Dynamixel');
    expect(byKey.stack).toEqual(
      expect.arrayContaining(['Python', 'ROS2', 'OpenCV', 'AprilTag', 'Flask', 'Three.js']),
    );
    expect(byKey.tooling).toEqual(
      expect.arrayContaining(['Fusion 360', 'MuJoCo', 'Isaac Sim', 'MeshCat']),
    );
    expect(byKey.misc).toBeUndefined();
  });
});
