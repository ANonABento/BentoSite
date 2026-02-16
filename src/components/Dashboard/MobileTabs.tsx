'use client';

import { motion } from 'framer-motion';
import { buttonTap, dashboardPanelIn } from '@/lib/animations';
import { BentoIcon } from '@/components/BentoOS/BentoIcon';

interface MobileTabsProps {
  activeSection: '3d' | 'chat';
  onTabChange: (tab: '3d' | 'chat') => void;
}

export function MobileTabs({ activeSection, onTabChange }: MobileTabsProps) {
  return (
    <motion.div
      className="md:hidden flex-shrink-0 px-4 pb-4"
      variants={dashboardPanelIn}
    >
      <div className="glass-panel rounded-2xl p-1.5 flex gap-1 relative">
        {(['3d', 'chat'] as const).map((tab) => (
          <motion.button
            key={tab}
            onClick={() => onTabChange(tab)}
            whileTap={buttonTap}
            className={`relative flex-1 py-3 px-4 rounded-xl text-sm font-medium font-mono transition-colors duration-200 ${
              activeSection === tab
                ? 'text-[var(--text-on-accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {activeSection === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-[var(--highlight)] rounded-xl shadow-lg shadow-[0_0_20px_var(--orange-muted)]"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                style={{ zIndex: -1 }}
              />
            )}
            <span className="relative flex items-center justify-center gap-2">
              <BentoIcon size={14} className="text-current" />
              {tab === '3d' ? 'viewfinder' : 'terminal'}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
