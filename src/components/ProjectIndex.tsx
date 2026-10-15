'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type Row = {
  id: string;
  name: string;
  category: string;
  status: string;
  year: string;
  blurb: string;
  award?: string;
  thumbnail?: string;
};

export function ProjectIndex({ rows, categories }: { rows: Row[]; categories: string[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const visible = category ? rows.filter((r) => r.category === category) : rows;

  const chip = (label: string, value: string | null, count: number) => {
    const active = category === value;
    return (
      <button
        key={label}
        type="button"
        onClick={() => setCategory(value)}
        aria-pressed={active}
        className={`shrink-0 rounded-full px-3 py-1 text-sm transition-colors ${
          active ? 'bg-rice text-lacquer' : 'text-ash hover:bg-cell-raised hover:text-rice'
        }`}
      >
        {label} <span className={active ? 'text-lacquer/60' : 'text-ash/60'}>{count}</span>
      </button>
    );
  };

  return (
    <div className="cell">
      <div className="flex gap-1 overflow-x-auto border-b border-wall p-3">
        {chip('All', null, rows.length)}
        {categories.map((c) => chip(c, c, rows.filter((r) => r.category === c).length))}
      </div>
      <ul>
        {visible.map((row) => (
          <li key={row.id} className="border-b border-wall/70 last:border-0">
            <Link
              href={`/?project=${row.id}`}
              className="group grid grid-cols-[4rem_1fr] items-center gap-x-4 px-4 py-3 hover:bg-cell-raised sm:grid-cols-[5.5rem_1fr_9rem_6.5rem]"
            >
              <span className="relative block aspect-[4/3] overflow-hidden rounded-md bg-cell-raised">
                {row.thumbnail && (
                  <Image src={row.thumbnail} alt="" fill sizes="88px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                )}
              </span>
              <span className="min-w-0">
                <span className="flex items-baseline gap-2">
                  <span className="font-medium group-hover:text-orange">{row.name}</span>
                  <span className="font-crt text-base text-ash/70">{row.year}</span>
                </span>
                <span className="mt-0.5 line-clamp-2 block text-sm leading-snug text-ash">{row.blurb}</span>
                {row.award && <span className="mt-1 block text-xs font-medium text-orange">★ {row.award}</span>}
                <span className="mt-1 block text-xs text-ash/70 sm:hidden">{row.category}</span>
              </span>
              <span className="hidden text-sm text-ash sm:block">{row.category}</span>
              <span className="hidden text-right text-sm sm:block">
                <span className={row.status === 'In Progress' ? 'text-purple' : 'text-ash/70'}>{row.status}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
