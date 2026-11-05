'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import { getVariants, useAnimateIconContext, IconWrapper, type IconProps } from '@animate-ui/react/icons';

type HouseProps = IconProps<keyof typeof animations>;

// Lucide "house": the roof settles and the door opens a touch.
const animations = {
  default: {
    roof: {
      initial: { y: 0 },
      animate: { y: [0, -2, 0], transition: { duration: 0.5, ease: 'easeOut' } },
    },
    door: {
      initial: { scaleY: 1 },
      animate: { scaleY: [1, 0.7, 1], transition: { duration: 0.5, ease: 'easeOut', delay: 0.1 } },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: HouseProps) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <motion.path
        d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        variants={variants.roof}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
        style={{ originY: 1 }}
        variants={variants.door}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function House(props: HouseProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { animations, House, House as HouseIcon, type HouseProps, type HouseProps as HouseIconProps };
