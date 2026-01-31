'use client';

import { motion } from 'framer-motion';
import { sectionItem, staggerContainer, staggerItem } from '@/lib/animations';

interface TimelineItem {
  id: string;
  title: string;
  company: string;
  period: string;
  description: string;
  technologies: string[];
  type: 'work' | 'education';
}

const timelineData: TimelineItem[] = [
  {
    id: '1',
    title: 'Senior Developer',
    company: 'Tech Company',
    period: '2022 - Present',
    description: 'Leading development of interactive 3D web applications and mentoring junior developers.',
    technologies: ['React', 'Three.js', 'TypeScript', 'Node.js'],
    type: 'work',
  },
  {
    id: '2',
    title: 'Full Stack Developer',
    company: 'Startup Inc',
    period: '2020 - 2022',
    description: 'Built and maintained multiple web applications with modern tech stack.',
    technologies: ['Next.js', 'PostgreSQL', 'AWS', 'Docker'],
    type: 'work',
  },
  {
    id: '3',
    title: 'Hardware Engineer',
    company: 'Robotics Lab',
    period: '2018 - 2020',
    description: 'Designed embedded systems and IoT solutions for industrial applications.',
    technologies: ['C++', 'Python', 'Arduino', 'ROS'],
    type: 'work',
  },
  {
    id: '4',
    title: 'Computer Science Degree',
    company: 'University',
    period: '2014 - 2018',
    description: 'Bachelor of Science in Computer Science with focus on graphics and AI.',
    technologies: ['Algorithms', 'Machine Learning', 'Computer Graphics'],
    type: 'education',
  },
];

function TimelineCard({ item, index }: { item: TimelineItem; index: number }) {
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      variants={staggerItem}
      className={`flex items-center gap-4 md:gap-8 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}
    >
      {/* Content */}
      <motion.div
        className={`flex-1 ${isLeft ? 'md:text-right' : 'md:text-left'}`}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div className="glass rounded-xl p-6 card-hover">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              item.type === 'work'
                ? 'bg-violet-500/20 text-violet-300'
                : 'bg-orange-500/20 text-orange-300'
            }`}>
              {item.type === 'work' ? 'Work' : 'Education'}
            </span>
            <span className="text-sm text-gray-500">{item.period}</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
          <p className="text-violet-400 text-sm mb-3">{item.company}</p>
          <p className="text-gray-400 text-sm mb-4">{item.description}</p>
          <div className="flex flex-wrap gap-2">
            {item.technologies.map((tech) => (
              <span
                key={tech}
                className="px-2 py-1 text-xs bg-white/5 text-gray-400 rounded-md"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Center line and dot */}
      <div className="hidden md:flex flex-col items-center">
        <motion.div
          className="w-4 h-4 rounded-full bg-violet-500 border-4 border-[var(--background)] z-10"
          whileHover={{ scale: 1.5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        />
      </div>

      {/* Spacer for alternating layout */}
      <div className="hidden md:block flex-1" />
    </motion.div>
  );
}

export function TimelineSection() {
  return (
    <section id="experience" className="py-16 md:py-24">
      <motion.div
        className="max-w-6xl mx-auto px-4 md:px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        {/* Section Header */}
        <motion.div variants={sectionItem} className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Experience
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-violet-500 to-orange-500 rounded-full mx-auto" />
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Center line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2" />

          <motion.div
            className="space-y-8 md:space-y-12"
            variants={staggerContainer}
          >
            {timelineData.map((item, index) => (
              <TimelineCard key={item.id} item={item} index={index} />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
