/**
 * FeedbackHub Web Application Entry Point
 * Hostname-Aware Routing Architecture
 * Foundation: Phase 1 Stub
 */

import { TenantResolutionMode } from '@feedbackhub/types';
import { THEME_COLORS, RADIUS_TOKENS } from '@feedbackhub/ui';

export function resolveHostMode(hostname: string, baseDomain = 'feedbackhub.com'): {
  mode: TenantResolutionMode;
  slug?: string;
} {
  const normalized = hostname.toLowerCase();

  if (
    normalized === baseDomain ||
    normalized === `www.${baseDomain}` ||
    normalized === 'localhost' ||
    normalized === '127.0.0.1'
  ) {
    return { mode: 'marketing' };
  }

  if (normalized === `app.${baseDomain}` || normalized === 'app.localhost') {
    return { mode: 'app' };
  }

  // Tenant subdomain pattern: {slug}.feedbackhub.com
  const suffix = `.${baseDomain}`;
  if (normalized.endsWith(suffix)) {
    const slug = normalized.slice(0, -suffix.length);
    return { mode: 'tenant', slug };
  }

  return { mode: 'tenant', slug: normalized };
}

export const webFoundation = {
  version: '0.1.0',
  theme: THEME_COLORS,
  radius: RADIUS_TOKENS,
  resolveHostMode,
};
