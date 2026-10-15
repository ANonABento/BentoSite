import fs from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { profile } from '@/lib/content';
import { introProfile } from '@/lib/board';

/*
 * The link preview: the board in miniature. A tray of compartments, the
 * intro on the left and four project photos, each outlined in its
 * category's hue, on the right. Built once at build time.
 */

export const alt = `${profile.name}: robots and the software that runs them`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const WALL = '#2a2421';
const CELL = '#171312';
const RICE = '#f2ece2';
const ASH = '#a39a90';
const ORANGE = '#e8823f';
const PURPLE = '#a78bfa';
const GAP = 12;

const SHOTS = [
  { src: 'projects/expressive-ai-robot-head/photo.webp', hue: '#f0915a' },
  { src: 'projects/flowto/hero.png', hue: '#b39dfb' },
  { src: 'projects/pomme/robot.webp', hue: '#f0915a' },
  { src: 'projects/robotic-arm-puppeteer/worn.webp', hue: '#f0915a' },
];

const INTRO_W = 560;
const SHOTS_W = size.width - INTRO_W - GAP * 3;
const SHOT_W = (SHOTS_W - GAP) / 2;
const SHOT_H = (size.height - GAP * 3) / 2;

/** Satori can't read webp, so every shot goes through sharp as a cropped JPEG. */
async function shot(src: string): Promise<string> {
  const file = await fs.readFile(path.join(process.cwd(), 'public', src));
  const jpeg = await sharp(file)
    .resize(Math.round(SHOT_W * 2), Math.round(SHOT_H * 2), { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
}

function Mark({ px }: { px: number }) {
  return (
    <svg width={px} height={px} viewBox="0 0 24 24">
      <path d="M3 0h7.5v24H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3Z" fill={ORANGE} />
      <path d="M12.5 0H21a3 3 0 0 1 3 3v8h-11.5Z" fill={ORANGE} />
      <path d="M12.5 13H24v8a3 3 0 0 1-3 3h-8.5Z" fill={PURPLE} />
      <path d="m15.4 16.2 2.1 1.8-2.1 1.8M18.6 20.2h2.6" stroke="#fff" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export default async function OpengraphImage() {
  const shots = await Promise.all(SHOTS.map(async (s) => ({ ...s, data: await shot(s.src) })));
  const { pitch } = introProfile();

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: WALL, padding: GAP, gap: GAP }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: INTRO_W,
            background: CELL,
            borderRadius: 18,
            padding: 44,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Mark px={40} />
            <span style={{ fontSize: 30, fontWeight: 700, color: RICE, letterSpacing: -0.5 }}>bentOS</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <span style={{ fontSize: 76, fontWeight: 700, color: RICE, letterSpacing: -2, lineHeight: 1 }}>{profile.name}</span>
            <span style={{ fontSize: 28, color: ASH, lineHeight: 1.35 }}>{pitch}</span>
          </div>
          <span style={{ fontSize: 22, color: ORANGE }}>{`> ${profile.title}`}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: SHOTS_W, gap: GAP }}>
          {shots.map((s) => (
            <div
              key={s.src}
              style={{
                display: 'flex',
                width: SHOT_W,
                height: SHOT_H,
                borderRadius: 18,
                overflow: 'hidden',
                border: `2px solid ${s.hue}`,
                background: CELL,
              }}
            >
              <img src={s.data} width={SHOT_W} height={SHOT_H} style={{ objectFit: 'cover' }} alt="" />
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
