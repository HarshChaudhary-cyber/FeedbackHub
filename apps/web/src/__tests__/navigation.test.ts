import { describe, it, expect } from 'vitest';
import { getMarketingUrl } from '../utils/navigation';

describe('getMarketingUrl', () => {
  it('returns current protocol and host on localhost root', () => {
    const loc = {
      hostname: 'localhost',
      port: '3000',
      protocol: 'http:',
    } as Location;
    expect(getMarketingUrl(loc)).toBe('http://localhost:3000/');
  });

  it('navigates from tenant localhost subdomain to base localhost', () => {
    const loc = {
      hostname: 'acme.localhost',
      port: '3000',
      protocol: 'http:',
    } as Location;
    expect(getMarketingUrl(loc)).toBe('http://localhost:3000/');
  });

  it('navigates from app localhost subdomain to base localhost', () => {
    const loc = {
      hostname: 'app.localhost',
      port: '3000',
      protocol: 'http:',
    } as Location;
    expect(getMarketingUrl(loc)).toBe('http://localhost:3000/');
  });

  it('navigates from production tenant subdomain to production root domain without localhost', () => {
    const loc = {
      hostname: 'acme.feedbackhub.com',
      port: '',
      protocol: 'https:',
    } as Location;
    expect(getMarketingUrl(loc)).toBe('https://feedbackhub.com/');
    expect(getMarketingUrl(loc)).not.toContain('localhost');
  });

  it('navigates from production app subdomain to production root domain without localhost', () => {
    const loc = {
      hostname: 'app.feedbackhub.com',
      port: '',
      protocol: 'https:',
    } as Location;
    expect(getMarketingUrl(loc)).toBe('https://feedbackhub.com/');
    expect(getMarketingUrl(loc)).not.toContain('localhost');
  });

  it('falls back to relative root if location is not available or hostname is empty', () => {
    expect(getMarketingUrl(null)).toBe('/');
    expect(getMarketingUrl({ hostname: '', port: '', protocol: '' } as Location)).toBe('/');
  });
});
