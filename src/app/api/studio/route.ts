import fs from 'node:fs';
import { NextResponse } from 'next/server';
import { firstClash, fits, readingOrder, type BoardLayout } from '@/components/BentoGrid';
import { LAYOUT_PATH } from '@/lib/board';

/** Saves the board layout from /studio. Dev only: it writes into the repo. */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') return new NextResponse(null, { status: 404 });

  const layout = (await request.json()) as BoardLayout;
  const problem = check(layout);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  // Reading order keeps the file's diffs small when a card moves.
  const tidy: BoardLayout = {
    cols: layout.cols,
    rows: layout.rows,
    ...(layout.shift ? { shift: layout.shift } : {}),
    cards: readingOrder(layout.cards),
  };
  fs.writeFileSync(LAYOUT_PATH, JSON.stringify(tidy, null, 2) + '\n');
  return NextResponse.json({ ok: true });
}

function check(layout: BoardLayout): string | null {
  if (!Number.isInteger(layout?.cols) || !Number.isInteger(layout?.rows) || !Array.isArray(layout.cards)) {
    return 'not a layout';
  }
  if (layout.shift !== undefined && (!Number.isInteger(layout.shift) || layout.shift < 0 || layout.shift >= layout.cols)) {
    return 'shift must be a whole number of columns, less than the tile is wide';
  }
  for (const card of layout.cards) {
    if (!fits(layout, card)) return `${card.id} sits outside the tile`;
  }
  const clash = firstClash(layout);
  return clash ? `${clash[0].id} overlaps ${clash[1].id}` : null;
}
