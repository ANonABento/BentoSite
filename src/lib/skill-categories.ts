// Categorize a project's `technologies` array into named buckets for the
// dashboard's "project tools" view. Matches a curated set of regexes per
// bucket; anything that doesn't match falls into MISC. The three primary
// buckets mirror the generic skills panel (HW_MODULES / SW_STACK / DEV_TOOLS)
// so the panel chrome stays visually consistent when it re-skins.

export type SkillCategoryKey = 'hardware' | 'stack' | 'tooling';
export type CategorizedKey = SkillCategoryKey | 'misc';

export interface CategorizedSkillGroup {
  key: CategorizedKey;
  label: string;
  items: string[];
}

interface CategoryDef {
  key: SkillCategoryKey;
  label: string;
  matchers: RegExp[];
}

const CATEGORY_DEFS: CategoryDef[] = [
  {
    key: 'hardware',
    label: 'HARDWARE',
    matchers: [
      /^stm32/i,
      /^esp32/i,
      /^arduino/i,
      /^jetson/i,
      /^raspberry pi$/i,
      /^dynamixel$/i,
      /^u2d2$/i,
      /^pcb/i,
      /^altium/i,
      /^schematic/i,
      /^smd/i,
      /^solder/i,
      /^gpio$/i,
      /^uart$/i,
      /^i2c$/i,
      /^spi$/i,
      /^servo/i,
      /^motor/i,
      /^sensor/i,
      /^freertos$/i,
      /^stm32cube$/i,
      /^edge impulse$/i,
      /^espasyncwebserver$/i,
    ],
  },
  {
    key: 'stack',
    label: 'STACK',
    matchers: [
      /^python$/i,
      /^javascript$/i,
      /^typescript$/i,
      /^c$/i,
      /^c \/ c\+\+$/i,
      /^c\+\+$/i,
      /^c#$/i,
      /^rust$/i,
      /^java$/i,
      /^shell$/i,
      /^ros2?$/i,
      /^react$/i,
      /^react & next\.js$/i,
      /^next\.?js$/i,
      /^tauri$/i,
      /^flask$/i,
      /^fastapi$/i,
      /^celery$/i,
      /^unity$/i,
      /^three\.?js$/i,
      /^@react-three/i,
      /^matter-js$/i,
      /^framer-motion$/i,
      /^tailwind/i,
      /^pytorch$/i,
      /^cuda$/i,
      /^llama\.cpp/i,
      /^whisper$/i,
      /^silero/i,
      /^zonos$/i,
      /^opencv$/i,
      /^emgu opencv$/i,
      /^apriltag$/i,
      /^xterm/i,
      /^chrome extension/i,
      /^android studio$/i,
      /^camerax$/i,
      /^devtools protocol$/i,
      /^github api$/i,
      /^discord api$/i,
      /^claude/i,
      /^ai$/i,
      /^ai\/ml$/i,
      /^full stack$/i,
      /^agpl/i,
      /^mqtt$/i,
      /^computer vision$/i,
      /^web scraping$/i,
      /^webgl$/i,
    ],
  },
  {
    key: 'tooling',
    label: 'TOOLING',
    matchers: [
      /^fusion 360$/i,
      /^onshape$/i,
      /^blender$/i,
      /^meshcat$/i,
      /^mujoco$/i,
      /^isaac sim$/i,
      /^rviz/i,
      /^docker$/i,
      /^git/i,
      /^github$/i,
      /^linux$/i,
      /^visual studio$/i,
      /^cura$/i,
      /^3d printing$/i,
      /^3d-printing$/i,
      /^3d printing & cad$/i,
      /^fsm$/i,
      /^cad$/i,
    ],
  },
];

const MISC_LABEL = 'MISC';
const CATEGORY_BY_KEY = new Map(CATEGORY_DEFS.map((category) => [category.key, category]));

export function categorizeTechnologies(technologies: string[]): CategorizedSkillGroup[] {
  const buckets: Record<CategorizedKey, string[]> = {
    hardware: [],
    stack: [],
    tooling: [],
    misc: [],
  };

  const seen = new Set<string>();

  for (const raw of technologies) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const dedupeKey = trimmed.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const found = CATEGORY_DEFS.find((c) => c.matchers.some((re) => re.test(trimmed)));
    if (found) {
      buckets[found.key].push(trimmed);
    } else {
      buckets.misc.push(trimmed);
    }
  }

  const orderedKeys: CategorizedKey[] = [...CATEGORY_DEFS.map((category) => category.key), 'misc'];

  return orderedKeys
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({
      key,
      label: key === 'misc' ? MISC_LABEL : CATEGORY_BY_KEY.get(key)!.label,
      items: buckets[key],
    }));
}
