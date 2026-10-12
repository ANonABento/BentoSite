'use client';

import Link from 'next/link';
import { useState } from 'react';

type Row = { id: string; name: string; category: string; status: string; year: string };

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
              href={`/projects/${row.id}`}
              className="group grid grid-cols-[3.5rem_1fr] items-baseline gap-x-4 gap-y-0.5 px-5 py-3.5 hover:bg-cell-raised sm:grid-cols-[3.5rem_1fr_11rem_7rem]"
            >
              <span className="font-crt text-lg text-ash">{row.year}</span>
              <span className="font-medium group-hover:text-orange">{row.name}</span>
              <span className="col-start-2 text-sm text-ash sm:col-start-auto">{row.category}</span>
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
