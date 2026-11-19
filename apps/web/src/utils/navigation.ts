/**
 * Centralized, safe navigation utility for hostname-aware routing.
 * Avoids hardcoding localhost in deployed environments while supporting
 * local development, custom base domains, and tenant subdomains safely.
 */

export function getMarketingUrl(currentLocation?: Location | null): string {
  if (currentLocation === null) {
    return '/';
  }

  if (typeof window === 'undefined' && !currentLocation) {
    return '/';
  }

  const loc = currentLocation || window.location;
  if (!loc || !loc.hostname) {
    return '/';
  }

  const hostname = loc.hostname.toLowerCase();
  const port = loc.port ? `:${loc.port}` : '';
  const protocol = loc.protocol || 'http:';

  // Local development root
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}${port}/`;
  }

  // Local development tenant/app subdomain (e.g. acme.localhost, app.localhost)
  if (hostname.endsWith('.localhost')) {
    return `${protocol}//localhost${port}/`;
  }

  // Deployed production/staging environment (e.g. acme.feedbackhub.com -> feedbackhub.com)
  const baseDomain = 'feedbackhub.com';
  if (hostname.endsWith(`.${baseDomain}`)) {
    return `${protocol}//${baseDomain}${port}/`;
  }

  // Fallback safe relative path
  return '/';
}
