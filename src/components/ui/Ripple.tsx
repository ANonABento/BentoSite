'use client';

import { useState, useCallback, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RippleType {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleProps {
  color?: string;
  duration?: number;
}

export function useRipple({ color = 'rgba(255, 255, 255, 0.3)', duration = 600 }: RippleProps = {}) {
  const [ripples, setRipples] = useState<RippleType[]>([]);
  const nextId = useRef(0);

  const addRipple = useCallback((e: MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple: RippleType = {
      id: nextId.current++,
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, duration);
  }, [duration]);

  const RippleContainer = useCallback(() => (
    <AnimatePresence>
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration / 1000, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            borderRadius: '50%',
            backgroundColor: color,
            pointerEvents: 'none',
          }}
        />
      ))}
    </AnimatePresence>
  ), [ripples, color, duration]);

  return { addRipple, RippleContainer };
}

// Pre-styled button with built-in ripple
interface RippleButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  rippleColor?: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function RippleButton({
  children,
  variant = 'primary',
  size = 'md',
  rippleColor,
  className = '',
  onClick,
  disabled,
  type = 'button',
}: RippleButtonProps) {
  const { addRipple, RippleContainer } = useRipple({
    color: rippleColor || (variant === 'primary' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(167, 139, 250, 0.3)'),
  });

  const baseStyles = 'relative overflow-hidden transition-all duration-200 font-medium';

  const variantStyles = {
    primary: 'bg-violet-500 hover:bg-violet-400 active:bg-violet-600 text-white',
    secondary: 'bg-white/10 hover:bg-white/15 active:bg-white/20 text-white',
    ghost: 'bg-transparent hover:bg-white/5 active:bg-white/10 text-gray-300 hover:text-white',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-xl',
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      whileTap={{ scale: 0.97 }}
      onClick={(e) => {
        addRipple(e);
        onClick?.(e);
      }}
    >
      <RippleContainer />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
