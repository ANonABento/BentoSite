import fs from 'node:fs';
import { NextResponse } from 'next/server';
import { fits, overlaps, readingOrder, type BoardLayout } from '@/components/BentoGrid';
import { LAYOUT_PATH } from '@/lib/board';

/** Saves the board layout from /studio. Dev only: it writes into the repo. */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') return new NextResponse(null, { status: 404 });

  const layout = (await request.json()) as BoardLayout;
  const problem = check(layout);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  // Reading order keeps the file's diffs small when a card moves.
  const tidy: BoardLayout = { cols: layout.cols, rows: layout.rows, cards: readingOrder(layout.cards) };
  fs.writeFileSync(LAYOUT_PATH, JSON.stringify(tidy, null, 2) + '\n');
  return NextResponse.json({ ok: true });
}

function check(layout: BoardLayout): string | null {
  if (!Number.isInteger(layout?.cols) || !Number.isInteger(layout?.rows) || !Array.isArray(layout.cards)) {
    return 'not a layout';
  }
  for (const [index, card] of layout.cards.entries()) {
    if (!fits(layout, card)) return `${card.id} sits outside the tile`;
    const clash = layout.cards.slice(index + 1).find((other) => overlaps(card, other));
    if (clash) return `${card.id} overlaps ${clash.id}`;
  }
  return null;
}
