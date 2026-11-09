// app/components/analytics/IconMapper.tsx
'use client';

import * as Icons from 'lucide-react';

const iconCache: Record<string, React.ElementType> = {};

export function getIcon(iconName: string): React.ElementType {
  if (iconCache[iconName]) {
    return iconCache[iconName];
  }
  
  const IconComponent = (Icons as any)[iconName];
  const fallbackIcon = Icons.Activity;
  
  iconCache[iconName] = IconComponent || fallbackIcon;
  return iconCache[iconName];
}