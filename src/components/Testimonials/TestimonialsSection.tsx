'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sectionItem, staggerContainer } from '@/lib/animations';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Alex Chen',
    role: 'Engineering Manager',
    company: 'Tech Corp',
    content: 'An exceptional developer who combines technical expertise with creative problem-solving. Their 3D work transformed our product visualization.',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    role: 'Product Designer',
    company: 'Design Studio',
    content: 'Working together was a pleasure. They have a keen eye for detail and always deliver polished, performant solutions.',
  },
  {
    id: '3',
    name: 'Michael Park',
    role: 'CTO',
    company: 'Startup Inc',
    content: 'Brought our MVP to life in record time. Their full-stack expertise and proactive communication made the project a success.',
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-16 md:py-24">
      <motion.div
        className="max-w-4xl mx-auto px-4 md:px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        {/* Section Header */}
        <motion.div variants={sectionItem} className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What People Say
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-violet-500 to-orange-500 rounded-full mx-auto" />
        </motion.div>

        {/* Testimonial Carousel */}
        <motion.div variants={sectionItem} className="relative">
          <div className="glass rounded-2xl p-8 md:p-12 overflow-hidden">
            {/* Quote icon */}
            <div className="absolute top-6 left-6 text-6xl text-violet-500/20 font-serif">
              &ldquo;
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8 italic">
                  &ldquo;{testimonials[activeIndex].content}&rdquo;
                </p>

                <div className="flex items-center gap-4">
                  {/* Avatar placeholder */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center text-white font-bold">
                    {testimonials[activeIndex].name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      {testimonials[activeIndex].name}
                    </div>
                    <div className="text-sm text-gray-400">
                      {testimonials[activeIndex].role} at {testimonials[activeIndex].company}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prevTestimonial}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              aria-label="Previous testimonial"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === activeIndex
                      ? 'bg-violet-500 w-6'
                      : 'bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              aria-label="Next testimonial"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
