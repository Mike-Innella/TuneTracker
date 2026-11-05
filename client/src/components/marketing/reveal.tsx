'use client';

import { motion } from 'motion/react';

/**
 * The "needle drop": rows settle into place once as they enter. Content starts mostly visible,
 * so nothing is hidden if JS is slow; reduced motion is honoured globally via MotionConfig.
 */
export function Reveal({
  as = 'div',
  index = 0,
  className,
  children,
}: {
  as?: 'div' | 'li';
  index?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const Tag = as === 'li' ? motion.li : motion.div;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0.4, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ delay: index * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  );
}
