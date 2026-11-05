'use client';

import * as React from 'react';
import { Button as PressButton, type ButtonProps } from '@animate-ui/react/primitives/buttons/button';

type Lazy = { $$typeof: symbol; _payload: PromiseLike<React.ReactNode> };
const LAZY = Symbol.for('react.lazy');

/**
 * Animate UI's press (0.97 spring, no hover scale, reduced-motion aware).
 * Its Slot renders nothing for a lazy child, which Server Components send when they outline an
 * element into its own chunk (a `<Link>` passed from a server page), so unwrap it first like Radix's Slot.
 */
export function Pressable(props: ButtonProps) {
  let { children } = props as { children?: React.ReactNode };
  const maybeLazy = children as unknown as Lazy | null;
  if (props.asChild && maybeLazy && typeof maybeLazy === 'object' && maybeLazy.$$typeof === LAZY) {
    children = React.use(maybeLazy._payload as Promise<React.ReactNode>);
  }
  return <PressButton {...({ ...props, children } as ButtonProps)} />;
}
