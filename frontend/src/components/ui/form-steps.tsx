'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  blur,
  ReducedMotionConfig,
  shift,
  transition,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';

export function FormSteps({
  step,
  direction,
  children,
}: {
  step: number;
  direction: 1 | -1;
  children: React.ReactNode;
}) {
  return (
    <ReducedMotionConfig>
      <Steps step={step} direction={direction}>
        {children}
      </Steps>
    </ReducedMotionConfig>
  );
}

function Steps({
  step,
  direction,
  children,
}: {
  step: number;
  direction: 1 | -1;
  children: React.ReactNode;
}) {
  const reduce = useShouldReduceMotion();
  const leave = useTempoTransition(transition.panelOut);
  const enter = useTempoTransition(transition.panelIn);
  const ref = React.useRef<HTMLDivElement>(null);
  const away = (sign: number) => ({
    opacity: 0,
    filter: blur.panel,
    transform: `translateX(${reduce ? 0 : sign * shift.step}px)`,
  });
  const variants = {
    enter: (dir: number) => away(dir),
    center: {
      opacity: 1,
      filter: 'blur(0px)',
      transform: 'translateX(0px)',
      transition: enter,
    },
    exit: (dir: number) => ({ ...away(-dir), transition: leave }),
  };

  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={step}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        ref={ref}
        onAnimationComplete={(name) => {
          if (name !== 'center') return;
          ref.current?.querySelector<HTMLElement>('input, select, textarea, [tabindex="-1"]')?.focus();
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
