'use client';

import { motion } from 'framer-motion';
import { TileData } from './Game2048.types';
import { TILE_COLORS, CELL_SIZE, CELL_SIZE_MOBILE, CELL_GAP, CELL_GAP_MOBILE } from './Game2048.config';

interface TileProps {
  tile: TileData;
  isMobile: boolean;
}

export function Tile({ tile, isMobile }: TileProps) {
  const size = isMobile ? CELL_SIZE_MOBILE : CELL_SIZE;
  const gap = isMobile ? CELL_GAP_MOBILE : CELL_GAP;

  const colors = TILE_COLORS[tile.value] ?? TILE_COLORS[4096];

  // Calculate position
  const x = tile.col * (size + gap);
  const y = tile.row * (size + gap);

  // Font size scales with value
  const getFontSize = () => {
    if (tile.value >= 1024) return isMobile ? '1.25rem' : '1.5rem';
    if (tile.value >= 128) return isMobile ? '1.5rem' : '1.75rem';
    return isMobile ? '1.75rem' : '2rem';
  };

  return (
    <motion.div
      layout
      initial={tile.isNew ? { scale: 0, opacity: 0 } : false}
      animate={{
        x,
        y,
        scale: tile.isMerged ? [1, 1.15, 1] : 1,
        opacity: 1,
      }}
      transition={{
        x: { type: 'spring', stiffness: 500, damping: 35 },
        y: { type: 'spring', stiffness: 500, damping: 35 },
        scale: tile.isNew
          ? { type: 'spring', stiffness: 500, damping: 25, delay: 0.05 }
          : { duration: 0.15 },
      }}
      className="absolute flex items-center justify-center rounded-lg font-bold select-none"
      role="img"
      aria-label={`Tile ${tile.value} at row ${tile.row + 1}, column ${tile.col + 1}`}
      style={{
        width: size,
        height: size,
        backgroundColor: colors.bg,
        color: colors.text,
        fontSize: getFontSize(),
        boxShadow: tile.value >= 2048
          ? '0 0 30px rgba(237, 194, 46, 0.5)'
          : tile.value >= 128
          ? '0 0 20px rgba(0, 0, 0, 0.15)'
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      {tile.value}
    </motion.div>
  );
}
