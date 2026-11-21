import { describe, it, expect, beforeEach } from 'vitest';
import type { Request } from 'express';
import { TenantResolutionService } from '../tenant-resolution.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('TenantResolutionService', () => {
  let service: TenantResolutionService;
  let prisma: PrismaService;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.TRUSTED_PROXY;
    delete process.env.ALLOW_DEV_TENANT_HEADER;
    process.env.PLATFORM_DOMAIN = 'feedbackhub.com';

    prisma = new PrismaService();
    prisma.isInMemory = true;
    prisma.resetMemoryStore();

    service = new TenantResolutionService(prisma);
  });

  describe('Host Classification', () => {
    it('classifies root platform domains and localhost as marketing', () => {
      expect(service.classifyHost('feedbackhub.com')).toEqual({ mode: 'marketing' });
      expect(service.classifyHost('www.feedbackhub.com')).toEqual({ mode: 'marketing' });
      expect(service.classifyHost('localhost')).toEqual({ mode: 'marketing' });
      expect(service.classifyHost('127.0.0.1')).toEqual({ mode: 'marketing' });
    });

    it('classifies app domains as app', () => {
      expect(service.classifyHost('app.feedbackhub.com')).toEqual({ mode: 'app' });
      expect(service.classifyHost('app.localhost')).toEqual({ mode: 'app' });
    });

    it('classifies platform-reserved subdomains as platform mode', () => {
      expect(service.classifyHost('api.feedbackhub.com')).toEqual({
        mode: 'platform',
        slug: 'api',
      });
      expect(service.classifyHost('auth.feedbackhub.com')).toEqual({
        mode: 'platform',
        slug: 'auth',
      });
      expect(service.classifyHost('admin.feedbackhub.com')).toEqual({
        mode: 'platform',
        slug: 'admin',
      });
    });

    it('classifies tenant subdomains on platform domain as tenant mode', () => {
      expect(service.classifyHost('acme.feedbackhub.com')).toEqual({
        mode: 'tenant',
        slug: 'acme',
      });
      expect(service.classifyHost('globex.feedbackhub.com')).toEqual({
        mode: 'tenant',
        slug: 'globex',
      });
    });

    it('classifies local development tenant subdomains on .localhost', () => {
      expect(service.classifyHost('acme.localhost')).toEqual({
        mode: 'tenant',
        slug: 'acme',
      });
    });

    it('classifies unrecognized domains as custom domain candidates', () => {
      expect(service.classifyHost('feedback.acme.corp')).toEqual({
        mode: 'tenant',
        customDomain: 'feedback.acme.corp',
      });
    });

    it('rejects multi-level tenant subdomains with BadRequestException', () => {
      expect(() => service.classifyHost('nested.tenant.feedbackhub.com')).toThrow(
        BadRequestException
      );
      expect(() => service.classifyHost('sub.org.localhost')).toThrow(
        BadRequestException
      );
    });
  });

  describe('Host Extraction & Reverse-Proxy Spoofing Protections', () => {
    it('extracts host from standard Host header and strips port', () => {
      const mockReq = {
        headers: { host: 'acme.feedbackhub.com:4000' },
      } as unknown as Request;

      expect(service.extractHost(mockReq)).toBe('acme.feedbackhub.com');
    });

    it('extracts and normalizes IPv6 bracketed hosts with and without port', () => {
      const mockReqWithPort = {
        headers: { host: '[::1]:3000' },
      } as unknown as Request;
      expect(service.extractHost(mockReqWithPort)).toBe('[::1]');

      const mockReqBare = {
        headers: { host: '[::1]' },
      } as unknown as Request;
      expect(service.extractHost(mockReqBare)).toBe('[::1]');
    });

    it('normalizes single trailing dot from FQDN host headers', () => {
      const mockReq = {
        headers: { host: 'acme.feedbackhub.com.:3000' },
      } as unknown as Request;
      expect(service.extractHost(mockReq)).toBe('acme.feedbackhub.com');
    });

    it('rejects ports outside valid range 1-65535 with BadRequestException', () => {
      const mockReqTooHigh = {
        headers: { host: 'acme.feedbackhub.com:99999' },
      } as unknown as Request;
      expect(() => service.extractHost(mockReqTooHigh)).toThrow(BadRequestException);

      const mockReqZero = {
        headers: { host: 'acme.feedbackhub.com:0' },
      } as unknown as Request;
      expect(() => service.extractHost(mockReqZero)).toThrow(BadRequestException);
    });

    it('rejects authority injection delimiters in Host header', () => {
      const maliciousHosts = [
        'attacker.com/evil',
        'attacker.com\\evil',
        'user:pass@legit.com',
        'legit.com?query=1',
        'legit.com#frag',
        'legit..com',
      ];
      for (const host of maliciousHosts) {
        const mockReq = { headers: { host } } as unknown as Request;
        expect(() => service.extractHost(mockReq)).toThrow(BadRequestException);
      }
    });

    it('handles repeated array values in X-Forwarded-Host when proxy trust is enabled', () => {
      process.env.TRUSTED_PROXY = 'true';
      const mockReq = {
        headers: {
          host: 'internal-proxy',
          'x-forwarded-host': ['acme.feedbackhub.com', 'spoof.com'],
        },
      } as unknown as Request;
      expect(service.extractHost(mockReq)).toBe('acme.feedbackhub.com');
    });

    it('ignores X-Forwarded-Host when TRUSTED_PROXY is not enabled (prevents header spoofing)', () => {
      process.env.TRUSTED_PROXY = 'false';
      const mockReq = {
        headers: {
          host: 'legitimate.feedbackhub.com',
          'x-forwarded-host': 'attacker-spoofed.feedbackhub.com',
        },
      } as unknown as Request;

      expect(service.extractHost(mockReq)).toBe('legitimate.feedbackhub.com');
    });

    it('trusts X-Forwarded-Host only when TRUSTED_PROXY is explicitly enabled', () => {
      process.env.TRUSTED_PROXY = 'true';
      const mockReq = {
        headers: {
          host: 'internal-proxy-ip',
          'x-forwarded-host': 'acme.feedbackhub.com, proxy1.internal',
        },
      } as unknown as Request;

      expect(service.extractHost(mockReq)).toBe('acme.feedbackhub.com');
    });

    it('rejects malformed Host headers containing invalid characters', () => {
      const invalidHosts = [
        'acme;spoof.com',
        'acme/path.com',
        'acme$corp.com',
        'acme space.com',
        'acme<script>.com',
      ];

      for (const badHost of invalidHosts) {
        const mockReq = { headers: { host: badHost } } as unknown as Request;
        expect(() => service.extractHost(mockReq)).toThrow(BadRequestException);
      }
    });

    it('rejects missing or empty Host header with BadRequestException', () => {
      const mockReq = { headers: {} } as unknown as Request;
      expect(() => service.extractHost(mockReq)).toThrow(BadRequestException);
    });
  });

  describe('Tenant Resolution & Lifecycle Verification', () => {
    it('resolves active tenant by slug and returns TenantContext', async () => {
      const company = await prisma.company.create({
        data: {
          name: 'Acme Corp',
          slug: 'acme-corp',
          status: 'ACTIVE',
          isActive: true,
        },
      });

      const mockReq = {
        headers: { host: 'acme-corp.feedbackhub.com' },
      } as unknown as Request;

      const tenant = await service.resolveFromRequest(mockReq);
      expect(tenant).toBeDefined();
      expect(tenant?.companyId).toBe(company.id);
      expect(tenant?.companySlug).toBe('acme-corp');
      expect(tenant?.companyName).toBe('Acme Corp');
      expect(tenant?.companyStatus).toBe('ACTIVE');
    });

    it('resolves active tenant by custom domain', async () => {
      const company = await prisma.company.create({
        data: {
          name: 'Custom Brand Co',
          slug: 'custom-brand',
          customDomain: 'feedback.custombrand.com',
          status: 'ACTIVE',
          isActive: true,
        },
      });

      const mockReq = {
        headers: { host: 'feedback.custombrand.com' },
      } as unknown as Request;

      const tenant = await service.resolveFromRequest(mockReq);
      expect(tenant).toBeDefined();
      expect(tenant?.companyId).toBe(company.id);
      expect(tenant?.companySlug).toBe('custom-brand');
    });

    it('returns null when request is for marketing or central app host', async () => {
      const marketingReq = { headers: { host: 'feedbackhub.com' } } as unknown as Request;
      expect(await service.resolveFromRequest(marketingReq)).toBeNull();

      const appReq = { headers: { host: 'app.feedbackhub.com' } } as unknown as Request;
      expect(await service.resolveFromRequest(appReq)).toBeNull();
    });

    it('throws 404 NotFoundException for unknown tenant slug (fail-closed)', async () => {
      const mockReq = {
        headers: { host: 'non-existent-org.feedbackhub.com' },
      } as unknown as Request;

      await expect(service.resolveFromRequest(mockReq)).rejects.toThrow(NotFoundException);
    });

    it('throws 404 NotFoundException for unknown custom domain (fail-closed)', async () => {
      const mockReq = {
        headers: { host: 'unknown-custom-domain.org' },
      } as unknown as Request;

      await expect(service.resolveFromRequest(mockReq)).rejects.toThrow(NotFoundException);
    });

    it('throws 403 ForbiddenException when tenant is SUSPENDED', async () => {
      await prisma.company.create({
        data: {
          name: 'Suspended Corp',
          slug: 'suspended-corp',
          status: 'SUSPENDED',
          isActive: true,
        },
      });

      const mockReq = {
        headers: { host: 'suspended-corp.feedbackhub.com' },
      } as unknown as Request;

      await expect(service.resolveFromRequest(mockReq)).rejects.toThrow(ForbiddenException);
    });

    it('throws 403 ForbiddenException when tenant isActive is false', async () => {
      await prisma.company.create({
        data: {
          name: 'Disabled Corp',
          slug: 'disabled-corp',
          status: 'ACTIVE',
          isActive: false,
        },
      });

      const mockReq = {
        headers: { host: 'disabled-corp.feedbackhub.com' },
      } as unknown as Request;

      await expect(service.resolveFromRequest(mockReq)).rejects.toThrow(ForbiddenException);
    });

    it('throws 404 NotFoundException for reserved platform slugs', async () => {
      await expect(service.resolveBySlug('admin')).rejects.toThrow(NotFoundException);
      await expect(service.resolveBySlug('api')).rejects.toThrow(NotFoundException);
      await expect(service.resolveBySlug('auth')).rejects.toThrow(NotFoundException);
    });
  });
});
