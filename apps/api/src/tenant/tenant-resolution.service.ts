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
   * Robustly parses IPv4, IPv6 (with brackets), ports, trailing dots, and proxy headers.
   */
  extractHost(req: Request): string {
    const isTrustedProxy = process.env.TRUSTED_PROXY === 'true' || process.env.TRUSTED_PROXY === '1';
    let rawHost: string | undefined;

    if (isTrustedProxy) {
      const forwarded = req.headers['x-forwarded-host'];
      if (typeof forwarded === 'string' && forwarded.trim() !== '') {
        // Multi-valued header: strictly extract leftmost client-supplied hop
        const firstHop = forwarded.split(',')[0].trim();
        if (firstHop !== '') {
          rawHost = firstHop;
        }
      } else if (Array.isArray(forwarded) && forwarded.length > 0 && typeof forwarded[0] === 'string') {
        const firstHop = forwarded[0].split(',')[0].trim();
        if (firstHop !== '') {
          rawHost = firstHop;
        }
      }
    }

    if (!rawHost) {
      rawHost = req.headers.host;
    }

    if (!rawHost || typeof rawHost !== 'string' || rawHost.trim() === '') {
      throw new BadRequestException('Missing or invalid Host header.');
    }

    const trimmed = rawHost.trim().toLowerCase();

    // Check for invalid authority delimiters that could signal path/query/userinfo injection
    if (/[/@?\\#\s]/.test(trimmed)) {
      throw new BadRequestException('Malformed Host header contains invalid authority delimiters.');
    }

    let hostWithoutPort: string;

    // IPv6 address enclosed in brackets, optionally followed by port: e.g. [::1]:3000 or [::1]
    if (trimmed.startsWith('[')) {
      const closingBracketIndex = trimmed.indexOf(']');
      if (closingBracketIndex === -1) {
        throw new BadRequestException('Malformed IPv6 Host header missing closing bracket.');
      }
      const ipv6Host = trimmed.slice(0, closingBracketIndex + 1);
      const remainder = trimmed.slice(closingBracketIndex + 1);
      if (remainder !== '') {
        if (!remainder.startsWith(':')) {
          throw new BadRequestException('Malformed Host header after IPv6 closing bracket.');
        }
        const portStr = remainder.slice(1);
        if (!/^\d+$/.test(portStr)) {
          throw new BadRequestException('Malformed port in Host header.');
        }
        const portNum = parseInt(portStr, 10);
        if (portNum < 1 || portNum > 65535) {
          throw new BadRequestException('Port in Host header out of valid range (1-65535).');
        }
      }
      hostWithoutPort = ipv6Host;
    } else {
      // Standard hostname or IPv4, optionally followed by port: e.g. acme.localhost:3000
      const colonIndex = trimmed.lastIndexOf(':');
      if (colonIndex !== -1) {
        const potentialPort = trimmed.slice(colonIndex + 1);
        if (!/^\d+$/.test(potentialPort)) {
          throw new BadRequestException('Malformed Host header contains invalid characters in port.');
        }
        const portNum = parseInt(potentialPort, 10);
        if (portNum < 1 || portNum > 65535) {
          throw new BadRequestException('Port in Host header out of valid range (1-65535).');
        }
        hostWithoutPort = trimmed.slice(0, colonIndex);
      } else {
        hostWithoutPort = trimmed;
      }
    }

    // Strip single trailing dot (RFC 1034 fully-qualified domain name syntax)
    if (hostWithoutPort.endsWith('.') && hostWithoutPort !== '.') {
      hostWithoutPort = hostWithoutPort.slice(0, -1);
    }

    // Validate overall host length per RFC 1035
    if (hostWithoutPort.length === 0 || hostWithoutPort.length > 253) {
      throw new BadRequestException('Host length out of valid RFC range (1-253 characters).');
    }

    // Handle loopback IPv6 bracketed host
    if (hostWithoutPort === '[::1]' || hostWithoutPort === '[0:0:0:0:0:0:0:1]') {
      return '[::1]';
    }

    // Check for consecutive dots or invalid leading/trailing dots
    if (hostWithoutPort.includes('..') || hostWithoutPort.startsWith('.') || hostWithoutPort.endsWith('.')) {
      throw new BadRequestException('Malformed Host header contains consecutive or invalid dots.');
    }

    // Validate labels: each label 1-63 chars, alphanumeric with optional hyphens
    const labels = hostWithoutPort.split('.');
    for (const label of labels) {
      if (label.length === 0 || label.length > 63) {
        throw new BadRequestException('Host label length out of valid range (1-63 characters).');
      }
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label)) {
        throw new BadRequestException('Malformed Host header contains invalid label characters.');
      }
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
      host === '127.0.0.1' ||
      host === '[::1]'
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
