import React, { forwardRef, useState } from 'react';
import { cn } from '../utils';

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  fallback?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; status: string }> = {
  sm: {
    container: 'w-8 h-8 min-w-[32px] min-h-[32px]',
    text: 'text-xs',
    status: 'w-2 h-2 ring-1',
  },
  md: {
    container: 'w-10 h-10 min-w-[40px] min-h-[40px]',
    text: 'text-sm',
    status: 'w-2.5 h-2.5 ring-2',
  },
  lg: {
    container: 'w-12 h-12 min-w-[48px] min-h-[48px]',
    text: 'text-base',
    status: 'w-3 h-3 ring-2',
  },
};

const statusColors: Record<AvatarStatus, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-400',
  busy: 'bg-red-500',
  away: 'bg-amber-500',
};

function getInitials(name?: string, fallback?: string): string {
  if (fallback) return fallback.slice(0, 2).toUpperCase();
  if (!name) return '?';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      name,
      fallback,
      size = 'md',
      status,
      className,
      ...props
    },
    ref
  ) => {
    const [hasImageError, setHasImageError] = useState(false);
    const initials = getInitials(name, fallback);
    const currentSize = sizeStyles[size] || sizeStyles.md;

    // Show image only if src is provided and no load error occurred
    const showImage = Boolean(src) && !hasImageError;

    return (
      <div
        ref={ref}
        className={cn(
          // Circular design token radius (rounded-full / rounded-avatar)
          'relative inline-flex items-center justify-center rounded-full shrink-0 select-none overflow-visible',
          currentSize.container,
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'w-full h-full rounded-full overflow-hidden flex items-center justify-center font-medium transition-smooth border border-border/80',
            showImage ? 'bg-slate-100' : 'bg-slate-100 text-content-main'
          )}
        >
          {showImage ? (
            <img
              src={src}
              alt={alt || name || 'Avatar'}
              onError={() => setHasImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className={cn(
                'font-semibold text-slate-700 tracking-wider',
                currentSize.text
              )}
              aria-label={alt || name || 'Avatar fallback'}
            >
              {initials}
            </span>
          )}
        </div>

        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full ring-white',
              currentSize.status,
              statusColors[status]
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
