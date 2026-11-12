import { describe, it, expect } from 'vitest';
import { resolveHostMode } from '../index';

describe('resolveHostMode', () => {
  it('resolves marketing mode for root domain and www', () => {
    expect(resolveHostMode('feedbackhub.com')).toEqual({ mode: 'marketing' });
    expect(resolveHostMode('www.feedbackhub.com')).toEqual({ mode: 'marketing' });
    expect(resolveHostMode('localhost')).toEqual({ mode: 'marketing' });
    expect(resolveHostMode('127.0.0.1')).toEqual({ mode: 'marketing' });
  });

  it('resolves app mode for app.feedbackhub.com and app.localhost', () => {
    expect(resolveHostMode('app.feedbackhub.com')).toEqual({ mode: 'app' });
    expect(resolveHostMode('app.localhost')).toEqual({ mode: 'app' });
  });

  it('resolves tenant mode with slug for tenant subdomains', () => {
    expect(resolveHostMode('acme.feedbackhub.com')).toEqual({
      mode: 'tenant',
      slug: 'acme',
    });
    expect(resolveHostMode('nova.feedbackhub.com')).toEqual({
      mode: 'tenant',
      slug: 'nova',
    });
  });

  it('handles case-insensitivity in hostnames', () => {
    expect(resolveHostMode('APP.FEEDBACKHUB.COM')).toEqual({ mode: 'app' });
    expect(resolveHostMode('Acme.FeedbackHub.Com')).toEqual({
      mode: 'tenant',
      slug: 'acme',
    });
  });
});
