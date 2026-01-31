'use client';

import { motion } from 'framer-motion';
import { sectionItem, staggerContainer, staggerItem } from '@/lib/animations';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';

const highlights = [
  { label: 'Years Experience', value: '5+' },
  { label: 'Projects Completed', value: '20+' },
  { label: 'Technologies', value: '15+' },
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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            About Me
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-violet-500 to-orange-500 rounded-full" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Bio Content */}
          <motion.div variants={sectionItem} className="space-y-6">
            <p className="text-lg text-gray-300 leading-relaxed">
              I&apos;m a passionate developer who loves building interactive experiences
              that blend creativity with technical excellence. With expertise spanning
              hardware engineering to web development, I bring a unique perspective
              to every project.
            </p>
            <p className="text-gray-400 leading-relaxed">
              My journey started with tinkering with electronics and has evolved into
              crafting modern web applications with 3D visualizations, AI integrations,
              and intuitive user interfaces. I believe in writing clean, maintainable
              code and creating experiences that delight users.
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
                  <div className="text-2xl md:text-3xl font-bold text-violet-400 mb-1">
                    {item.value}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">
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
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-orange-500/10" />

              {/* Code block aesthetic */}
              <div className="relative space-y-4 font-mono text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="text-violet-400">const</span>
                  <span className="text-orange-400">developer</span>
                  <span>=</span>
                  <span className="text-gray-400">{'{'}</span>
                </div>
                <div className="pl-4 space-y-2">
                  <div>
                    <span className="text-gray-500">name:</span>
                    <span className="text-emerald-400"> &quot;{PORTFOLIO_DATA.personal.name}&quot;</span>,
                  </div>
                  <div>
                    <span className="text-gray-500">role:</span>
                    <span className="text-emerald-400"> &quot;{PORTFOLIO_DATA.personal.title}&quot;</span>,
                  </div>
                  <div>
                    <span className="text-gray-500">skills:</span>
                    <span className="text-gray-400"> [</span>
                    <span className="text-amber-400">&quot;React&quot;</span>,
                    <span className="text-amber-400"> &quot;TypeScript&quot;</span>,
                    <span className="text-amber-400"> &quot;Three.js&quot;</span>
                    <span className="text-gray-400">]</span>,
                  </div>
                  <div>
                    <span className="text-gray-500">passion:</span>
                    <span className="text-emerald-400"> &quot;Building amazing things&quot;</span>,
                  </div>
                  <div>
                    <span className="text-gray-500">available:</span>
                    <span className="text-violet-400"> true</span>
                  </div>
                </div>
                <div className="text-gray-400">{'}'}</div>
              </div>
            </div>

            {/* Floating decorative elements */}
            <motion.div
              className="absolute -top-4 -right-4 w-20 h-20 bg-violet-500/20 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-4 -left-4 w-16 h-16 bg-orange-500/20 rounded-full blur-2xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, delay: 2 }}
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
