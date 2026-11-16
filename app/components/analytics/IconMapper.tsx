// app/components/analytics/IconMapper.tsx
'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

/**
 * Returns a lucide component for a name that comes from the API.
 *
 * Deliberately does NOT memoise into a module-level cache: writing to a cache
 * during render is an impure side effect (react-hooks/purity) and bought nothing
 * — a property lookup on the namespace is already O(1).
 */
export function getIcon(iconName: string): React.ElementType {
  return (Icons as unknown as Record<string, React.ElementType>)[iconName] ?? Icons.Activity;
}

/**
 * Renders an icon by name.
 *
 * A component rather than `const Icon = getIcon(...)` inside the caller: creating
 * a component during render makes it a new type every time, which forces React to
 * unmount and remount the subtree (react-hooks/static-components).
 */
export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  // Resolved through a factory rather than a local `const Icon` binding: the
  // compiler treats a renamed capitalised local as a component created during
  // render, which would defeat the point of hoisting it.
  const icon = getIcon(name);
  return React.createElement(icon, props);
}
