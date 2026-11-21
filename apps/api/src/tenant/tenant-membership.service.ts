import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
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

  constructor(private readonly prisma: PrismaService) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Retrieves all members of a company.
   */
  async getCompanyMembers(
    companyId: string,
    _callerRole?: CompanyRole
  ): Promise<TenantMemberResponse[]> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required.');
    }

    const memberships = await this.prisma.companyMembership.findMany({
      where: { companyId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return memberships.map((m: any) => ({
      id: m.id,
      userId: m.userId,
      companyId: m.companyId,
      email: m.user?.email || '',
      fullName: m.user?.fullName || '',
      role: m.role as CompanyRole,
      status: m.status,
      joinedAt: m.joinedAt instanceof Date ? m.joinedAt.toISOString() : String(m.joinedAt),
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
    }));
  }

  /**
   * Updates a member's role within the company.
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

    const parseResult = updateMemberRoleSchema.safeParse(input);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(', '));
    }
    const newRole = parseResult.data.role as CompanyRole;

    // ADMIN cannot grant OWNER
    if (newRole === 'OWNER') {
      throw new ForbiddenException('The OWNER role cannot be granted through role update. Use ownership transfer.');
    }

    const targetMembership = await this.prisma.companyMembership.findUnique({
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

    const updated = await this.prisma.companyMembership.update({
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
      status: updated.status,
      joinedAt: updated.joinedAt instanceof Date ? updated.joinedAt.toISOString() : String(updated.joinedAt),
      createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
    };
  }

  /**
   * Updates a member's status (ACTIVE or SUSPENDED).
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

    const parseResult = updateMemberStatusSchema.safeParse(input);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(', '));
    }
    const newStatus = parseResult.data.status;

    const targetMembership = await this.prisma.companyMembership.findUnique({
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

    if (targetMembership.userId === callerUserId) {
      throw new BadRequestException('You cannot modify your own membership status.');
    }

    if (callerRole === 'ADMIN' && targetMembership.role === 'ADMIN') {
      throw new ForbiddenException('An ADMIN cannot suspend another ADMIN. Only the OWNER can do so.');
    }

    const updated = await this.prisma.companyMembership.update({
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
      status: updated.status,
      joinedAt: updated.joinedAt instanceof Date ? updated.joinedAt.toISOString() : String(updated.joinedAt),
      createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
    };
  }

  /**
   * Removes a member from the company.
   * Enforces OWNER protection: OWNER cannot be removed (cannot leave company ownerless).
   */
  async removeMember(
    companyId: string,
    callerUserId: string,
    callerRole: CompanyRole,
    targetMembershipId: string
  ): Promise<{ message: string }> {
    const targetMembership = await this.prisma.companyMembership.findUnique({
      where: { id: targetMembershipId },
    });

    if (!targetMembership || targetMembership.companyId !== companyId) {
      throw new NotFoundException('Target membership not found in this organization.');
    }

    // Owner protection: OWNER cannot be removed
    if (targetMembership.role === 'OWNER') {
      throw new ForbiddenException(
        'The organization OWNER cannot be removed. Transfer ownership to another member before leaving.'
      );
    }

    const isSelf = targetMembership.userId === callerUserId;

    if (!isSelf) {
      if (callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
        throw new ForbiddenException('Only an OWNER or ADMIN can remove other members.');
      }

      if (callerRole === 'ADMIN' && targetMembership.role === 'ADMIN') {
        throw new ForbiddenException('An ADMIN cannot remove another ADMIN. Only the OWNER can remove an ADMIN.');
      }
    }

    await this.prisma.companyMembership.delete({
      where: { id: targetMembershipId },
    });

    return { message: 'Member successfully removed from organization.' };
  }

  /**
   * Atomically transfers company ownership from the current OWNER to an active member.
   */
  async transferOwnership(
    companyId: string,
    currentOwnerUserId: string,
    input: unknown
  ): Promise<{ message: string; newOwnerId: string }> {
    // 1. Verify current caller is indeed the company OWNER first
    const currentOwnerMembership = await this.prisma.companyMembership.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId: currentOwnerUserId,
        },
      },
    });

    if (!currentOwnerMembership || currentOwnerMembership.role !== 'OWNER') {
      throw new ForbiddenException('Only the current organization OWNER can transfer ownership.');
    }

    const parseResult = transferOwnershipSchema.safeParse(input);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(', '));
    }
    const { targetUserId, retainedRole } = parseResult.data;

    if (targetUserId === currentOwnerUserId) {
      throw new BadRequestException('Target user is already the current owner.');
    }

    // 2. Verify target user is an active member of this company
    const targetMembership = await this.prisma.companyMembership.findUnique({
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

    // 3. Atomically swap roles in a database transaction
    await this.prisma.$transaction(async (tx) => {
      // Demote current owner to retainedRole (ADMIN by default)
      await tx.companyMembership.update({
        where: { id: currentOwnerMembership.id },
        data: { role: retainedRole as CompanyRole },
      });

      // Promote target member to OWNER
      await tx.companyMembership.update({
        where: { id: targetMembership.id },
        data: { role: 'OWNER' },
      });
    });

    this.logger.log(
      `Ownership of company "${companyId}" transferred from "${currentOwnerUserId}" to "${targetUserId}"`
    );

    return {
      message: 'Organization ownership successfully transferred.',
      newOwnerId: targetUserId,
    };
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

    const parseResult = createInvitationSchema.safeParse(input);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(', '));
    }
    const validated = parseResult.data;
    const normalizedEmail = validated.email.toLowerCase().trim();

    // 1. Check if user already holds active membership
    const existingUser = await this.prisma.platformUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      const existingMembership = await this.prisma.companyMembership.findUnique({
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
    const existingInvitation = await this.prisma.companyInvitation.findFirst({
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

    const invitation = await this.prisma.companyInvitation.create({
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
  }

  /**
   * Retrieves all active pending invitations for the company.
   */
  async getPendingInvitations(
    companyId: string,
    callerRole: CompanyRole
  ): Promise<CompanyInvitation[]> {
    if (callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
      throw new ForbiddenException('Only an OWNER or ADMIN can view pending invitations.');
    }

    const invitations = await this.prisma.companyInvitation.findMany({
      where: {
        companyId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv: { id: string; companyId: string; invitedByUserId: string; email: string; role: string; status: string; expiresAt: Date | string; createdAt: Date | string; updatedAt: Date | string }) => ({
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
  }

  /**
   * Revokes a pending invitation.
   */
  async revokeInvitation(
    companyId: string,
    callerRole: CompanyRole,
    invitationId: string
  ): Promise<{ message: string }> {
    if (callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
      throw new ForbiddenException('Only an OWNER or ADMIN can revoke invitations.');
    }

    const invitation = await this.prisma.companyInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.companyId !== companyId) {
      throw new NotFoundException('Invitation not found in this organization.');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING invitations can be revoked.');
    }

    await this.prisma.companyInvitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' },
    });

    return { message: 'Invitation successfully revoked.' };
  }

  /**
   * Accepts an invitation using a raw invitation token.
   * Enforces email identity match: caller email must match invitation email.
   */
  async acceptInvitation(
    userId: string,
    userEmail: string,
    input: unknown
  ): Promise<{ message: string; companyId: string; role: CompanyRole }> {
    const parseResult = acceptInvitationSchema.safeParse(input);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(', '));
    }
    const tokenHash = this.hashToken(parseResult.data.token);

    const invitation = await this.prisma.companyInvitation.findUnique({
      where: { tokenHash },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid or expired invitation token.');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('This invitation has already been processed or revoked.');
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.companyInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('This invitation has expired.');
    }

    // Email identity verification: prevent accepting another user's invitation
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenException(
        'This invitation was issued to a different email address. Please sign in with the invited account.'
      );
    }

    // Atomic acceptance & membership creation in a single transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Mark invitation accepted
      await tx.companyInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      // 2. Check if user already holds a membership record in this company
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
    });

    this.logger.log(
      `User "${userId}" (${userEmail}) accepted invitation to join company "${invitation.companyId}" as "${invitation.role}"`
    );

    return {
      message: 'Invitation accepted successfully.',
      companyId: invitation.companyId,
      role: invitation.role as CompanyRole,
    };
  }
}
