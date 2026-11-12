import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility helper to safely merge Tailwind CSS classes with conditional clsx expressions.
 * Standard across shadcn/ui and modern React design systems.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
