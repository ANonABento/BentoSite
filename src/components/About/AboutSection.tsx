'use client';

import { motion } from 'framer-motion';
import { sectionItem, staggerContainer, staggerItem } from '@/lib/animations';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';

const highlights = [
  { label: 'Robots Built', value: '6+' },
  { label: 'Hackathon Wins', value: '3' },
  { label: 'Technologies', value: '20+' },
];

export function AboutSection() {
  return (
    <section id="about" className="py-16 md:py-24">
      <motion.div
        className="max-w-6xl mx-auto px-4 md:px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        {/* Section Header */}
        <motion.div variants={sectionItem} className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
            About Me
          </h2>
          <div className="w-20 h-1 rounded-full" style={{ background: 'linear-gradient(to right, var(--purple), var(--orange))' }} />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Bio Content */}
          <motion.div variants={sectionItem} className="space-y-6">
            <p className="text-lg text-[var(--text-primary)] leading-relaxed">
              I&apos;m a Computer Engineering student at the <span className="text-[var(--interactive)] font-medium">University of Waterloo</span> with a passion for building robots that interact naturally with humans.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              My work spans the full stack of robotics—from designing custom PCBs and 3D-printed mechanisms to implementing GPU-accelerated AI pipelines with LLMs and computer vision. I&apos;ve built everything from gesture-controlled robot arms using AR glasses to expressive robot heads that can hold conversations.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              When I&apos;m not soldering or debugging ROS2 nodes, you&apos;ll find me competing at hackathons or tinkering with new sensor technologies.
            </p>

            {/* Highlights */}
            <motion.div
              className="grid grid-cols-3 gap-4 pt-6"
              variants={staggerContainer}
            >
              {highlights.map((item) => (
                <motion.div
                  key={item.label}
                  variants={staggerItem}
                  className="text-center p-4 glass rounded-xl"
                >
                  <div className="text-2xl md:text-3xl font-bold text-[var(--interactive)] mb-1">
                    {item.value}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                    {item.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Visual Element */}
          <motion.div
            variants={sectionItem}
            className="relative"
          >
            <div className="glass rounded-2xl p-8 relative overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, var(--purple-muted), transparent, var(--orange-muted))' }} />

              {/* Code block aesthetic */}
              <div className="relative space-y-4 font-mono text-sm">
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <span className="text-[var(--interactive)]">const</span>
                  <span className="text-[var(--orange)]">engineer</span>
                  <span>=</span>
                  <span className="text-[var(--text-secondary)]">{'{'}</span>
                </div>
                <div className="pl-4 space-y-2">
                  <div>
                    <span className="text-[var(--text-muted)]">name:</span>
                    <span className="text-[var(--status-success)]"> &quot;{PORTFOLIO_DATA.personal.name}&quot;</span>,
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">school:</span>
                    <span className="text-[var(--status-success)]"> &quot;UWaterloo&quot;</span>,
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">focus:</span>
                    <span className="text-[var(--text-secondary)]"> [</span>
                  </div>
                  <div className="pl-4">
                    <span className="text-[var(--status-warning)]">&quot;Robotics&quot;</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-[var(--status-warning)]">&quot;Embedded Systems&quot;</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-[var(--status-warning)]">&quot;AI/ML&quot;</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">]</span>,
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">currentlyBuilding:</span>
                    <span className="text-[var(--status-success)]"> &quot;expressive robots&quot;</span>,
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">openToWork:</span>
                    <span className="text-[var(--interactive)]"> true</span>
                  </div>
                </div>
                <div className="text-[var(--text-secondary)]">{'}'}</div>
              </div>
            </div>

            {/* Floating decorative elements */}
            <motion.div
              className="absolute -top-4 -right-4 w-20 h-20 bg-[var(--purple-muted)] rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-4 -left-4 w-16 h-16 bg-[var(--orange-muted)] rounded-full blur-2xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, delay: 2 }}
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
