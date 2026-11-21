import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  createCompanySchema,
  normalizeSlug,
  SLUG_REGEX,
  RESERVED_SLUGS,
} from '@feedbackhub/validation';
import type {
  CreateCompanyResponse,
  UserCompanyItem,
  CompanyRole,
} from '@feedbackhub/types';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates and validates a tenant slug from user input or company name.
   */
  private resolveSlug(name: string, customSlug?: string | null): string {
    let slug: string;

    if (customSlug && typeof customSlug === 'string' && customSlug.trim() !== '') {
      slug = customSlug.trim();
    } else {
      slug = normalizeSlug(name);
      // If the generated slug is shorter than 3 characters, append a deterministic suffix
      if (slug.length > 0 && slug.length < 3) {
        slug = `${slug}-co`;
      }
    }

    if (!slug || slug.length < 3) {
      throw new BadRequestException('Company slug must be at least 3 characters long.');
    }

    if (slug.length > 63) {
      throw new BadRequestException('Company slug cannot exceed 63 characters.');
    }

    if (!SLUG_REGEX.test(slug)) {
      throw new BadRequestException(
        'Company slug can only contain lowercase alphanumeric characters and single hyphens without leading or trailing hyphens.'
      );
    }

    if (RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number])) {
      throw new BadRequestException(`The slug "${slug}" is reserved by the platform. Please choose a different slug.`);
    }

    return slug;
  }

  /**
   * Creates a new company tenant and assigns the authenticated user as OWNER.
   * Executed atomically in a single database transaction.
   */
  async createCompany(userId: string, input: unknown): Promise<CreateCompanyResponse> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new UnauthorizedException('Authentication required. Cannot establish company without verified user context.');
    }

    // 1. Verify user exists and is active (strictly ACTIVE status, fail-closed)
    const user = await this.prisma.platformUser.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account not found or is not active.');
    }

    // 2. Validate input schema
    const parseResult = createCompanySchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => e.message).join(', ');
      throw new BadRequestException(errorMsg);
    }

    const { name, brandColorHex } = parseResult.data;

    // 3. Resolve and validate unique slug
    const slug = this.resolveSlug(name, parseResult.data.slug);

    // Check slug availability prior to transaction
    const existingSlug = await this.prisma.company.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException(`A company with the slug "${slug}" already exists.`);
    }

    // 4. Atomically create Company and OWNER CompanyMembership in a transaction
    try {
      return await this.prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            name: name.trim(),
            slug,
            brandColorHex: brandColorHex || '#8B5CF6',
            status: 'ACTIVE',
            isActive: true,
          },
        });

        await this.prisma.setTransactionTenantContext(tx as PrismaService, company.id, userId);

        const membership = await tx.companyMembership.create({
          data: {
            companyId: company.id,
            userId,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        });

        this.logger.log(`Created company "${company.slug}" (${company.id}) with OWNER "${userId}"`);

        return {
          id: company.id,
          name: company.name,
          slug: company.slug,
          role: membership.role as CompanyRole,
          status: company.status,
          createdAt:
            company.createdAt instanceof Date ? company.createdAt.toISOString() : String(company.createdAt),
          updatedAt:
            company.updatedAt instanceof Date ? company.updatedAt.toISOString() : String(company.updatedAt),
        };
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(`A company with the slug "${slug}" already exists.`);
      }
      throw error;
    }
  }

  /**
   * Retrieves all companies for which the authenticated user holds an active membership.
   */
  async getUserCompanies(userId: string): Promise<UserCompanyItem[]> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new UnauthorizedException('Authentication required.');
    }

    const memberships = await this.prisma.withUserContext(userId, async (tx) => {
      return tx.companyMembership.findMany({
        where: {
          userId,
          status: 'ACTIVE',
        },
        include: {
          company: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    });

    return memberships
      .filter(
        (m) =>
          m.status === 'ACTIVE' &&
          m.company &&
          m.company.status === 'ACTIVE' &&
          m.company.isActive === true
      )
      .map((m) => ({
        id: m.company.id,
        name: m.company.name,
        slug: m.company.slug,
        role: m.role as CompanyRole,
        status: m.company.status,
        createdAt:
          m.company.createdAt instanceof Date
            ? m.company.createdAt.toISOString()
            : String(m.company.createdAt),
      }));
  }
}
