'use client';

import { motion } from 'framer-motion';
import { Flag, Bomb } from 'lucide-react';
import { Cell as CellType } from './Minesweeper.types';
import { NUMBER_COLORS, CELL_SIZE, CELL_SIZE_MOBILE } from './Minesweeper.config';

interface CellProps {
  cell: CellType;
  gameOver: boolean;
  isMobile: boolean;
  onClick: () => void;
  onRightClick: () => void;
  onDoubleClick: () => void;
}

export function Cell({
  cell,
  gameOver,
  isMobile,
  onClick,
  onRightClick,
  onDoubleClick,
}: CellProps) {
  const size = isMobile ? CELL_SIZE_MOBILE : CELL_SIZE;
  const isNumberedCell = cell.isRevealed && !cell.isMine && cell.adjacentMines > 0;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onRightClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!gameOver && !cell.isRevealed && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      onRightClick();
      return;
    }

    if (isNumberedCell && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onDoubleClick();
    }
  };

  const cellLabel = `Row ${cell.row + 1}, column ${cell.col + 1}${
    cell.isFlagged ? ', flagged' : ''
  }. ${cell.isRevealed
    ? cell.isMine
      ? 'Mine'
      : isNumberedCell
        ? `${cell.adjacentMines} adjacent mines`
        : 'Empty'
    : 'Hidden cell'
  }. ${isNumberedCell ? 'Press Enter or Space to chord.' : cell.isRevealed ? '' : 'Press Enter to reveal or F to flag.'}`;

  // Unrevealed cell
  if (!cell.isRevealed) {
    return (
      <motion.button
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onDoubleClick={onDoubleClick}
        onKeyDown={handleKeyDown}
        disabled={gameOver}
        aria-label={cellLabel}
        aria-pressed={cell.isFlagged}
        className={`
          relative flex items-center justify-center
          rounded-md border transition-all duration-100
          ${gameOver
            ? 'cursor-default opacity-80'
            : 'cursor-pointer hover:brightness-110 active:scale-95'
          }
          ${cell.isFlagged
            ? 'bg-[var(--pg-accent-gold)]/20 border-[var(--pg-accent-gold)]/40'
            : 'bg-[var(--pg-bg-elevated)] pg-border-soft pg-hover-border-strong'
          }
        `}
        style={{ width: size, height: size }}
        whileTap={gameOver ? {} : { scale: 0.95 }}
      >
        {cell.isFlagged && (
          <Flag
            className="w-4 h-4 text-[var(--pg-accent-gold)]"
            strokeWidth={2.5}
          />
        )}

        {/* Subtle gradient overlay */}
        {!cell.isFlagged && (
          <div className="absolute inset-0 rounded-md bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
        )}
      </motion.button>
    );
  }

  // Revealed mine
  if (cell.isMine) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex items-center justify-center rounded-md bg-[var(--pg-game-error)]/20 border border-[var(--pg-game-error)]/30"
        style={{ width: size, height: size }}
        role="img"
        aria-label={cellLabel}
      >
        <Bomb className="w-4 h-4 text-[var(--pg-game-error)]" strokeWidth={2} />
      </motion.div>
    );
  }

  // Revealed empty or number
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.1 }}
      onClick={onDoubleClick}
      onKeyDown={handleKeyDown}
      className={`
        flex items-center justify-center rounded-md cursor-default
        bg-[var(--pg-bg-surface)] border border-white/[0.04]
        ${isNumberedCell ? 'cursor-pointer' : ''}
      `}
      style={{ width: size, height: size }}
      role={isNumberedCell ? 'button' : 'img'}
      tabIndex={isNumberedCell && !gameOver ? 0 : undefined}
      aria-label={cellLabel}
    >
      {cell.adjacentMines > 0 && (
        <span
          className="font-mono font-bold text-sm"
          style={{ color: NUMBER_COLORS[cell.adjacentMines] }}
        >
          {cell.adjacentMines}
        </span>
      )}
    </motion.div>
  );
}
