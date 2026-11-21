import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RESERVED_SLUGS } from '@feedbackhub/validation';
import type { TenantContext, TenantResolutionMode } from '@feedbackhub/types';

export interface HostResolutionResult {
  mode: TenantResolutionMode | 'platform';
  slug?: string;
  customDomain?: string;
}

@Injectable()
export class TenantResolutionService {
  private readonly logger = new Logger(TenantResolutionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the configured base platform domain.
   */
  getPlatformDomain(): string {
    return (process.env.PLATFORM_DOMAIN || 'feedbackhub.com').toLowerCase().trim();
  }

  /**
   * Safely extracts and sanitizes the request hostname.
   * Protects against host spoofing by strictly respecting TRUSTED_PROXY configuration.
   */
  extractHost(req: Request): string {
    const isTrustedProxy = process.env.TRUSTED_PROXY === 'true';
    let rawHost: string | undefined;

    if (isTrustedProxy) {
      const forwarded = req.headers['x-forwarded-host'];
      if (typeof forwarded === 'string' && forwarded.trim() !== '') {
        // In proxy mode, take first hop
        rawHost = forwarded.split(',')[0].trim();
      }
    }

    if (!rawHost) {
      rawHost = req.headers.host;
    }

    if (!rawHost || typeof rawHost !== 'string' || rawHost.trim() === '') {
      throw new BadRequestException('Missing or invalid Host header.');
    }

    // Strip port if present (e.g. localhost:4000 -> localhost)
    const hostWithoutPort = rawHost.split(':')[0].trim().toLowerCase();

    // Validate hostname characters: only lowercase alphanumeric, hyphen, dot
    if (!/^[a-z0-9.-]+$/.test(hostWithoutPort)) {
      throw new BadRequestException('Malformed Host header contains invalid characters.');
    }

    return hostWithoutPort;
  }

  /**
   * Classifies the hostname into marketing, app, platform, or tenant mode.
   */
  classifyHost(host: string): HostResolutionResult {
    const platformDomain = this.getPlatformDomain();

    // 1. Root marketing domains & localhost
    if (
      host === platformDomain ||
      host === `www.${platformDomain}` ||
      host === 'localhost' ||
      host === '127.0.0.1'
    ) {
      return { mode: 'marketing' };
    }

    // 2. Central application host
    if (host === `app.${platformDomain}` || host === 'app.localhost') {
      return { mode: 'app' };
    }

    // 3. Platform reserved subdomains on platform domain (e.g. api.feedbackhub.com, auth.feedbackhub.com)
    const suffix = `.${platformDomain}`;
    if (host.endsWith(suffix)) {
      const subdomain = host.slice(0, -suffix.length);
      // Disallow multi-level subdomains
      if (subdomain.includes('.')) {
        throw new BadRequestException('Multi-level tenant subdomains are not permitted.');
      }

      if (RESERVED_SLUGS.includes(subdomain as (typeof RESERVED_SLUGS)[number])) {
        return { mode: 'platform', slug: subdomain };
      }

      return { mode: 'tenant', slug: subdomain };
    }

    // 4. Localhost tenant subdomains for development (e.g. acme.localhost)
    if (host.endsWith('.localhost')) {
      const subdomain = host.slice(0, -'.localhost'.length);
      if (subdomain.includes('.')) {
        throw new BadRequestException('Multi-level tenant subdomains are not permitted.');
      }

      if (RESERVED_SLUGS.includes(subdomain as (typeof RESERVED_SLUGS)[number])) {
        return { mode: 'platform', slug: subdomain };
      }

      return { mode: 'tenant', slug: subdomain };
    }

    // 5. Custom domain candidate
    return { mode: 'tenant', customDomain: host };
  }

  /**
   * Resolves the verified TenantContext from an incoming HTTP request.
   * Fails closed if the tenant does not exist or is suspended/inactive.
   */
  async resolveFromRequest(req: Request): Promise<TenantContext | null> {
    // Development bypass header (explicit opt-in only, never permitted in production)
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.ALLOW_DEV_TENANT_HEADER === 'true'
    ) {
      const devSlug = req.headers['x-dev-tenant-slug'];
      if (typeof devSlug === 'string' && devSlug.trim() !== '') {
        return this.resolveBySlug(devSlug.trim());
      }
    }

    const host = this.extractHost(req);
    const classification = this.classifyHost(host);

    if (classification.mode !== 'tenant') {
      return null;
    }

    if (classification.slug) {
      return this.resolveBySlug(classification.slug);
    }

    if (classification.customDomain) {
      return this.resolveByCustomDomain(classification.customDomain);
    }

    return null;
  }

  /**
   * Resolves and lifecycle-validates a company tenant by its slug.
   * Fails closed: non-existent -> 404, suspended/inactive -> 403.
   */
  async resolveBySlug(slug: string): Promise<TenantContext> {
    const normalizedSlug = slug.toLowerCase().trim();

    if (RESERVED_SLUGS.includes(normalizedSlug as (typeof RESERVED_SLUGS)[number])) {
      throw new NotFoundException(`Tenant "${normalizedSlug}" not found.`);
    }

    const company = await this.prisma.company.findUnique({
      where: { slug: normalizedSlug },
    });

    if (!company) {
      throw new NotFoundException(`Tenant organization "${normalizedSlug}" not found.`);
    }

    this.validateTenantLifecycle(company);

    return {
      companyId: company.id,
      companySlug: company.slug,
      companyName: company.name,
      companyStatus: company.status,
    };
  }

  /**
   * Resolves and lifecycle-validates a company tenant by custom domain.
   */
  async resolveByCustomDomain(customDomain: string): Promise<TenantContext> {
    const normalized = customDomain.toLowerCase().trim();

    const company = await this.prisma.company.findUnique({
      where: { customDomain: normalized },
    });

    if (!company) {
      throw new NotFoundException(`Tenant organization for domain "${normalized}" not found.`);
    }

    this.validateTenantLifecycle(company);

    return {
      companyId: company.id,
      companySlug: company.slug,
      companyName: company.name,
      companyStatus: company.status,
    };
  }

  /**
   * Strict lifecycle validation. Fails closed if status != ACTIVE or isActive != true.
   */
  private validateTenantLifecycle(company: {
    id: string;
    slug: string;
    status: string;
    isActive: boolean;
  }): void {
    if (company.status === 'SUSPENDED') {
      throw new ForbiddenException('Tenant organization is currently suspended.');
    }

    if (company.status !== 'ACTIVE' || company.isActive !== true) {
      throw new ForbiddenException('Tenant organization is inactive or disabled.');
    }
  }
}
