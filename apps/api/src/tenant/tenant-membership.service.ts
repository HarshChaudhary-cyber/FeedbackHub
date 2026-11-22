import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
  Optional,
} from '@nestjs/common';
import crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RateLimiterService } from '../auth/rate-limiter.service';
import {
  createInvitationSchema,
  acceptInvitationSchema,
  updateMemberRoleSchema,
  updateMemberStatusSchema,
  transferOwnershipSchema,
} from '@feedbackhub/validation';
import type {
  CompanyRole,
  TenantMemberResponse,
  CompanyInvitation,
  InvitationStatus,
} from '@feedbackhub/types';

@Injectable()
export class TenantMembershipService {
  private readonly logger = new Logger(TenantMembershipService.name);
  private readonly prisma: PrismaService;

  constructor(
    @Optional() prisma?: PrismaService,
    @Optional() private readonly rateLimiter?: RateLimiterService
  ) {
    this.prisma = prisma || new PrismaService();
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Retrieves all members of a company within transaction-local tenant context.
   */
  async getCompanyMembers(
    companyId: string,
    _callerRole?: CompanyRole
  ): Promise<TenantMemberResponse[]> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required.');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      const memberships = await tx.companyMembership.findMany({
        where: { companyId },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      });

      return memberships.map((m: {
        id: string;
        userId: string;
        companyId: string;
        user?: { email?: string; fullName?: string } | null;
        role: string;
        status: string;
        joinedAt: Date | string;
        createdAt: Date | string;
      }) => ({
        id: m.id,
        userId: m.userId,
        companyId: m.companyId,
        email: m.user?.email || '',
        fullName: m.user?.fullName || '',
        role: m.role as CompanyRole,
        status: m.status as import('@feedbackhub/types').MembershipStatus,
        joinedAt: m.joinedAt instanceof Date ? m.joinedAt.toISOString() : String(m.joinedAt),
        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
      }));
    });
  }

  /**
   * Updates a member's role within the company within transaction-local tenant context.
   * Enforces OWNER protection: the OWNER cannot be demoted, and ADMIN cannot grant OWNER.
   */
  async updateMemberRole(
    companyId: string,
    callerUserId: string,
    callerRole: CompanyRole,
    targetMembershipId: string,
    input: unknown
  ): Promise<TenantMemberResponse> {
    if (callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
      throw new ForbiddenException('Only an OWNER or ADMIN can modify member roles.');
    }

    if (this.rateLimiter) {
      await this.rateLimiter.assert('tenant_member_mutation:' + companyId, 60, 60_000);
    }

    const parseResult = updateMemberRoleSchema.safeParse(input);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(', '));
    }
    const newRole = parseResult.data.role as CompanyRole;

    // ADMIN cannot grant OWNER
    if (newRole === 'OWNER') {
      throw new ForbiddenException('The OWNER role cannot be granted through role update. Use ownership transfer.');
    }

    return this.prisma.withTenantContext(companyId, callerUserId, async (tx) => {
      const targetMembership = await tx.companyMembership.findUnique({
        where: { id: targetMembershipId },
        include: { user: true },
      });

      if (!targetMembership || targetMembership.companyId !== companyId) {
        throw new NotFoundException('Target membership not found in this organization.');
      }

      // Owner protection: cannot demote the OWNER
      if (targetMembership.role === 'OWNER') {
        throw new ForbiddenException('The organization OWNER role cannot be modified. Use ownership transfer.');
      }

      // Cannot modify own role
      if (targetMembership.userId === callerUserId) {
        throw new BadRequestException('You cannot modify your own role.');
      }

      // ADMIN cannot modify another ADMIN
      if (callerRole === 'ADMIN' && targetMembership.role === 'ADMIN') {
        throw new ForbiddenException('An ADMIN cannot modify another ADMIN. Only the OWNER can modify an ADMIN.');
      }

      const updated = await tx.companyMembership.update({
        where: { id: targetMembershipId },
        data: { role: newRole },
        include: { user: true },
      });

      return {
        id: updated.id,
        userId: updated.userId,
        companyId: updated.companyId,
        email: updated.user?.email || '',
        fullName: updated.user?.fullName || '',
        role: updated.role as CompanyRole,
        status: updated.status as import('@feedbackhub/types').MembershipStatus,
        joinedAt: updated.joinedAt instanceof Date ? updated.joinedAt.toISOString() : String(updated.joinedAt),
        createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
      };
    });
  }

  /**
   * Updates a member's status (ACTIVE or SUSPENDED) within transaction-local tenant context.
   * Enforces OWNER protection: the OWNER cannot be suspended.
   */
  async updateMemberStatus(
    companyId: string,
    callerUserId: string,
    callerRole: CompanyRole,
    targetMembershipId: string,
    input: unknown
  ): Promise<TenantMemberResponse> {
    if (callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
      throw new ForbiddenException('Only an OWNER or ADMIN can modify member status.');
    }

    if (this.rateLimiter) {
      await this.rateLimiter.assert('tenant_member_mutation:' + companyId, 60, 60_000);
    }

    const parseResult = updateMemberStatusSchema.safeParse(input);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(', '));
    }
    const newStatus = parseResult.data.status;

    return this.prisma.withTenantContext(companyId, callerUserId, async (tx) => {
      const targetMembership = await tx.companyMembership.findUnique({
        where: { id: targetMembershipId },
        include: { user: true },
      });

      if (!targetMembership || targetMembership.companyId !== companyId) {
        throw new NotFoundException('Target membership not found in this organization.');
      }

      // Owner protection: cannot suspend the OWNER
      if (targetMembership.role === 'OWNER') {
        throw new ForbiddenException('The organization OWNER cannot be suspended.');
      }

      // Cannot suspend own status
      if (targetMembership.userId === callerUserId) {
        throw new BadRequestException('You cannot modify your own status.');
      }

      // ADMIN cannot modify another ADMIN
      if (callerRole === 'ADMIN' && targetMembership.role === 'ADMIN') {
        throw new ForbiddenException('An ADMIN cannot modify another ADMIN. Only the OWNER can modify an ADMIN.');
      }

      const updated = await tx.companyMembership.update({
        where: { id: targetMembershipId },
        data: { status: newStatus },
        include: { user: true },
      });

      return {
        id: updated.id,
        userId: updated.userId,
        companyId: updated.companyId,
        email: updated.user?.email || '',
        fullName: updated.user?.fullName || '',
        role: updated.role as CompanyRole,
        status: updated.status as import('@feedbackhub/types').MembershipStatus,
        joinedAt: updated.joinedAt instanceof Date ? updated.joinedAt.toISOString() : String(updated.joinedAt),
        createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
      };
    });
  }

  /**
   * Removes a member from the company or allows a non-owner member to leave.
   * Enforces OWNER protection: the OWNER cannot be removed.
   */
  async removeMember(
    companyId: string,
    callerUserId: string,
    callerRole: CompanyRole,
    targetMembershipId: string
  ): Promise<{ message: string }> {
    if (this.rateLimiter) {
      await this.rateLimiter.assert('tenant_member_mutation:' + companyId, 60, 60_000);
    }

    return this.prisma.withTenantContext(companyId, callerUserId, async (tx) => {
      const targetMembership = await tx.companyMembership.findUnique({
        where: { id: targetMembershipId },
      });

      if (!targetMembership || targetMembership.companyId !== companyId) {
        throw new NotFoundException('Target membership not found in this organization.');
      }

      // Owner protection: cannot remove the OWNER
      if (targetMembership.role === 'OWNER') {
        throw new ForbiddenException(
          'The organization OWNER cannot be removed. Transfer ownership before removing this user.'
        );
      }

      const isSelfRemoval = targetMembership.userId === callerUserId;

      if (!isSelfRemoval) {
        if (callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
          throw new ForbiddenException('Only an OWNER or ADMIN can remove other members.');
        }

        // ADMIN cannot remove another ADMIN
        if (callerRole === 'ADMIN' && targetMembership.role === 'ADMIN') {
          throw new ForbiddenException('An ADMIN cannot remove another ADMIN. Only the OWNER can remove an ADMIN.');
        }
      }

      await tx.companyMembership.delete({
        where: { id: targetMembershipId },
      });

      return {
        message: 'Member successfully removed from organization.',
      };
    });
  }

  /**
   * Atomically transfers company ownership from the current OWNER to an active member.
   * Uses conditional transactional updates to prevent race conditions and guarantee owner invariants.
   */
  async transferOwnership(
    companyId: string,
    currentOwnerUserId: string,
    input: unknown
  ): Promise<{ message: string; newOwnerId: string }> {
    if (this.rateLimiter) {
      await this.rateLimiter.assert('tenant_transfer_ownership:' + companyId, 5, 3600_000);
    }

    return this.prisma.withTenantContext(companyId, currentOwnerUserId, async (tx) => {
      // 1. Verify company exists and is active
      const company = await tx.company.findUnique({
        where: { id: companyId },
      });
      if (!company || company.status !== 'ACTIVE' || company.isActive !== true) {
        throw new ForbiddenException('The organization is suspended or inactive.');
      }

      // 2. Verify current caller is indeed the active company OWNER
      const currentOwnerMembership = await tx.companyMembership.findUnique({
        where: {
          companyId_userId: {
            companyId,
            userId: currentOwnerUserId,
          },
        },
      });

      if (
        !currentOwnerMembership ||
        currentOwnerMembership.role !== 'OWNER' ||
        currentOwnerMembership.status !== 'ACTIVE'
      ) {
        throw new ForbiddenException('Only the current active organization OWNER can transfer ownership.');
      }

      const parseResult = transferOwnershipSchema.safeParse(input);
      if (!parseResult.success) {
        throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(', '));
      }
      const { targetUserId, retainedRole } = parseResult.data;

      if (targetUserId === currentOwnerUserId) {
        throw new BadRequestException('Target user is already the current owner.');
      }

      // 3. Verify target platform user exists and is active
      const targetUser = await tx.platformUser.findUnique({
        where: { id: targetUserId },
      });
      if (!targetUser || targetUser.status !== 'ACTIVE') {
        throw new BadRequestException('Target user account is not active.');
      }

      // 4. Verify target user is an active member of this company
      const targetMembership = await tx.companyMembership.findUnique({
        where: {
          companyId_userId: {
            companyId,
            userId: targetUserId,
          },
        },
      });

      if (!targetMembership || targetMembership.status !== 'ACTIVE') {
        throw new BadRequestException('Target user must be an active member of this organization.');
      }

      // 5. Concurrency-safe atomic conditional swap:
      // Demote current owner only if still active OWNER
      const demoteResult = await tx.companyMembership.updateMany({
        where: {
          id: currentOwnerMembership.id,
          companyId,
          role: 'OWNER',
          status: 'ACTIVE',
        },
        data: { role: retainedRole as CompanyRole },
      });

      if (demoteResult.count !== 1) {
        throw new ConflictException(
          'Concurrent ownership transfer detected. Caller is no longer the active owner.'
        );
      }

      // Promote target member only if still active member
      const promoteResult = await tx.companyMembership.updateMany({
        where: {
          id: targetMembership.id,
          companyId,
          status: 'ACTIVE',
        },
        data: { role: 'OWNER' },
      });

      if (promoteResult.count !== 1) {
        throw new ConflictException(
          'Target user is no longer an eligible active member of this organization.'
        );
      }

      this.logger.log(
        `Ownership of company "${companyId}" transferred from "${currentOwnerUserId}" to "${targetUserId}"`
      );

      return {
        message: 'Organization ownership successfully transferred.',
        newOwnerId: targetUserId,
      };
    });
  }

  /**
   * Creates an invitation for an email address to join the company.
   * Stores SHA-256 token hash; raw token is only returned for delivery.
   */
  async createInvitation(
    companyId: string,
    callerUserId: string,
    callerRole: CompanyRole,
    input: unknown
  ): Promise<CompanyInvitation & { invitationToken?: string }> {
    if (callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
      throw new ForbiddenException('Only an OWNER or ADMIN can invite new members.');
    }

    if (this.rateLimiter) {
      await this.rateLimiter.assert('tenant_invite_create:' + companyId, 50, 3600_000);
    }

    const parseResult = createInvitationSchema.safeParse(input);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(', '));
    }
    const validated = parseResult.data;

    // Defensive check: never permit an invitation to grant OWNER
    if ((validated.role as string) === 'OWNER') {
      throw new BadRequestException('An invitation cannot grant the OWNER role.');
    }

    const normalizedEmail = validated.email.toLowerCase().trim();

    return this.prisma.withTenantContext(companyId, callerUserId, async (tx) => {
      // 1. Check if user already holds active membership
      const existingUser = await tx.platformUser.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        const existingMembership = await tx.companyMembership.findUnique({
          where: {
            companyId_userId: {
              companyId,
              userId: existingUser.id,
            },
          },
        });

        if (existingMembership && existingMembership.status === 'ACTIVE') {
          throw new ConflictException('This user is already an active member of this organization.');
        }
      }

      // 2. Check for duplicate pending invitation
      const existingInvitation = await tx.companyInvitation.findFirst({
        where: {
          companyId,
          email: normalizedEmail,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
      });

      if (existingInvitation) {
        throw new ConflictException(
          'An active invitation has already been issued to this email address.'
        );
      }

      // 3. Generate secure random token (32 bytes = 64 hex chars)
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(rawToken);

      // 7-day expiration
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      try {
        const invitation = await tx.companyInvitation.create({
          data: {
            companyId,
            invitedByUserId: callerUserId,
            email: normalizedEmail,
            role: validated.role as CompanyRole,
            tokenHash,
            status: 'PENDING',
            expiresAt,
          },
        });

        this.logger.log(`Created invitation for "${normalizedEmail}" to join company "${companyId}"`);

        return {
          id: invitation.id,
          companyId: invitation.companyId,
          invitedByUserId: invitation.invitedByUserId,
          email: invitation.email,
          role: invitation.role as CompanyRole,
          status: invitation.status as InvitationStatus,
          expiresAt: invitation.expiresAt.toISOString(),
          createdAt: invitation.createdAt.toISOString(),
          updatedAt: invitation.updatedAt.toISOString(),
          // Raw token returned only at creation time for email delivery / dev verification
          invitationToken: rawToken,
        };
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'code' in err &&
          (err as { code: string }).code === 'P2002'
        ) {
          throw new ConflictException(
            'An active invitation has already been issued to this email address.'
          );
        }
        throw err;
      }
    });
  }

  /**
   * Retrieves all active pending invitations for the company within transaction-local tenant context.
   */
  async getPendingInvitations(
    companyId: string,
    callerRole: CompanyRole
  ): Promise<CompanyInvitation[]> {
    if (callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
      throw new ForbiddenException('Only an OWNER or ADMIN can view pending invitations.');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      const invitations = await tx.companyInvitation.findMany({
        where: {
          companyId,
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      });

      return invitations.map((inv: {
        id: string;
        companyId: string;
        invitedByUserId: string;
        email: string;
        role: string;
        status: string;
        expiresAt: Date | string;
        createdAt: Date | string;
        updatedAt: Date | string;
      }) => ({
        id: inv.id,
        companyId: inv.companyId,
        invitedByUserId: inv.invitedByUserId,
        email: inv.email,
        role: inv.role as CompanyRole,
        status: inv.status as InvitationStatus,
        expiresAt: inv.expiresAt instanceof Date ? inv.expiresAt.toISOString() : String(inv.expiresAt),
        createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : String(inv.createdAt),
        updatedAt: inv.updatedAt instanceof Date ? inv.updatedAt.toISOString() : String(inv.updatedAt),
      }));
    });
  }

  /**
   * Revokes a pending invitation within transaction-local tenant context.
   */
  async revokeInvitation(
    companyId: string,
    callerRole: CompanyRole,
    invitationId: string
  ): Promise<{ message: string }> {
    if (callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
      throw new ForbiddenException('Only an OWNER or ADMIN can revoke invitations.');
    }

    return this.prisma.withTenantContext(companyId, undefined, async (tx) => {
      const updateResult = await tx.companyInvitation.updateMany({
        where: {
          id: invitationId,
          companyId,
          status: 'PENDING',
        },
        data: { status: 'REVOKED' },
      });

      if (updateResult.count !== 1) {
        const invitation = await tx.companyInvitation.findUnique({
          where: { id: invitationId },
        });

        if (!invitation || invitation.companyId !== companyId) {
          throw new NotFoundException('Invitation not found in this organization.');
        }

        throw new BadRequestException('Only PENDING invitations can be revoked.');
      }

      return { message: 'Invitation successfully revoked.' };
    });
  }

  /**
   * Accepts an invitation using a raw invitation token.
   * Executes as a dedicated pre-membership workflow with transaction-local token hash context.
   * Enforces email identity match: caller email must match invitation email.
   * Enforces active standing: caller account must be exactly ACTIVE.
   */
  async acceptInvitation(
    userId: string,
    userEmail: string,
    input: unknown
  ): Promise<{ message: string; companyId: string; role: CompanyRole }> {
    if (this.rateLimiter) {
      await this.rateLimiter.assert('tenant_invite_accept:' + userId, 10, 60_000);
    }

    // 1. Validate accepting user account is strictly ACTIVE
    const user = await this.prisma.platformUser.findUnique({
      where: { id: userId },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new ForbiddenException('Your account is not in active standing.');
    }

    // 2. Validate input token
    const parseResult = acceptInvitationSchema.safeParse(input);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(', '));
    }
    const tokenHash = this.hashToken(parseResult.data.token);

    // 3. Execute inside dedicated invitation token context
    type AcceptOutcome =
      | { outcome: 'NOT_FOUND' }
      | { outcome: 'EXPIRED' }
      | { outcome: 'ALREADY_PROCESSED' }
      | { outcome: 'EMAIL_MISMATCH' }
      | { outcome: 'INVALID_ROLE' }
      | { outcome: 'COMPANY_INACTIVE' }
      | { outcome: 'CONCURRENT_ACCEPT' }
      | {
          outcome: 'SUCCESS';
          data: { message: string; companyId: string; role: CompanyRole };
        };

    const result = await this.prisma.withInvitationTokenContext(
      tokenHash,
      userId,
      async (tx): Promise<AcceptOutcome> => {
        const invitation = await tx.companyInvitation.findUnique({
          where: { tokenHash },
        });

        if (!invitation) {
          return { outcome: 'NOT_FOUND' };
        }

        if (invitation.status === 'EXPIRED') {
          return { outcome: 'EXPIRED' };
        }

        if (invitation.status !== 'PENDING') {
          return { outcome: 'ALREADY_PROCESSED' };
        }

        const now = new Date();
        const expTime =
          invitation.expiresAt instanceof Date
            ? invitation.expiresAt.getTime()
            : new Date(invitation.expiresAt).getTime();

        if (expTime <= now.getTime()) {
          // Concurrency-safe atomic conditional transition:
          // Mark EXPIRED only if still PENDING and expired
          const expireResult = await tx.companyInvitation.updateMany({
            where: {
              id: invitation.id,
              tokenHash,
              status: 'PENDING',
              expiresAt: { lte: now },
            },
            data: { status: 'EXPIRED' },
          });

          if (expireResult.count === 0) {
            // Concurrent modification: inspect current state
            const recheck = await tx.companyInvitation.findUnique({
              where: { tokenHash },
            });
            if (recheck?.status === 'EXPIRED') {
              return { outcome: 'EXPIRED' };
            }
            return { outcome: 'ALREADY_PROCESSED' };
          }

          return { outcome: 'EXPIRED' };
        }

        // Email identity verification: prevent accepting another user's invitation
        if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
          return { outcome: 'EMAIL_MISMATCH' };
        }

        // Invariant: invitation cannot grant OWNER
        if (invitation.role === 'OWNER') {
          return { outcome: 'INVALID_ROLE' };
        }

        // Validate company exists and is active
        const company = await tx.company.findUnique({
          where: { id: invitation.companyId },
        });
        if (!company || company.status !== 'ACTIVE' || company.isActive !== true) {
          return { outcome: 'COMPANY_INACTIVE' };
        }

        // Transition transaction into tenant context for membership creation
        await this.prisma.setTransactionTenantContext(tx, invitation.companyId, userId);

        // Concurrency-safe conditional update: marks ACCEPTED only if still PENDING and unexpired
        const updateResult = await tx.companyInvitation.updateMany({
          where: {
            id: invitation.id,
            status: 'PENDING',
            expiresAt: { gt: now },
          },
          data: { status: 'ACCEPTED' },
        });

        if (updateResult.count !== 1) {
          return { outcome: 'CONCURRENT_ACCEPT' };
        }

        // Create or reactivate membership record
        const existingMembership = await tx.companyMembership.findUnique({
          where: {
            companyId_userId: {
              companyId: invitation.companyId,
              userId,
            },
          },
        });

        if (existingMembership) {
          await tx.companyMembership.update({
            where: { id: existingMembership.id },
            data: {
              role: invitation.role,
              status: 'ACTIVE',
            },
          });
        } else {
          await tx.companyMembership.create({
            data: {
              companyId: invitation.companyId,
              userId,
              role: invitation.role,
              status: 'ACTIVE',
            },
          });
        }

        return {
          outcome: 'SUCCESS',
          data: {
            message: 'Invitation accepted successfully.',
            companyId: invitation.companyId,
            role: invitation.role as CompanyRole,
          },
        };
      }
    );

    if (result.outcome === 'NOT_FOUND') {
      throw new BadRequestException('Invalid or expired invitation token.');
    }
    if (result.outcome === 'EXPIRED') {
      throw new BadRequestException('This invitation has expired.');
    }
    if (result.outcome === 'ALREADY_PROCESSED') {
      throw new BadRequestException('This invitation has already been processed or revoked.');
    }
    if (result.outcome === 'EMAIL_MISMATCH') {
      throw new ForbiddenException(
        'This invitation was issued to a different email address. Please sign in with the invited account.'
      );
    }
    if (result.outcome === 'INVALID_ROLE') {
      throw new ForbiddenException('An invitation cannot grant the OWNER role.');
    }
    if (result.outcome === 'COMPANY_INACTIVE') {
      throw new ForbiddenException('The target organization is suspended or inactive.');
    }
    if (result.outcome === 'CONCURRENT_ACCEPT') {
      throw new BadRequestException(
        'This invitation has already been accepted or is no longer pending.'
      );
    }

    this.logger.log(
      `User "${userId}" (${userEmail}) accepted invitation to join company "${result.data.companyId}" as "${result.data.role}"`
    );

    return result.data;
  }
}
