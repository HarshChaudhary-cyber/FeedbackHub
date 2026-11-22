import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TenantResolutionGuard } from './guards/tenant-resolution.guard';
import { TenantMembershipGuard } from './guards/tenant-membership.guard';
import { TenantRoleGuard } from './guards/tenant-role.guard';
import { CurrentTenant } from './decorators/current-tenant.decorator';
import { RequireRoles } from './decorators/roles.decorator';
import { TenantMembershipService } from './tenant-membership.service';
import { PrismaService } from '../prisma/prisma.service';
import type { TenantContext, TenantMemberResponse, CompanyInvitation, CompanyRole } from '@feedbackhub/types';

@ApiTags('Tenant')
@ApiCookieAuth()
@Controller('tenant')
export class TenantController {
  private readonly membershipService: TenantMembershipService;

  constructor(membershipService?: TenantMembershipService) {
    this.membershipService = membershipService || new TenantMembershipService(new PrismaService());
  }

  @Get('context')
  @UseGuards(AuthGuard, TenantResolutionGuard, TenantMembershipGuard)
  @ApiOperation({ summary: 'Get current tenant context and caller membership' })
  @ApiResponse({ status: 200, description: 'Tenant context returned' })
  async getTenantContext(@CurrentTenant() tenant: TenantContext) {
    return {
      tenant,
      role: tenant.membershipRole,
    };
  }

  @Get('members')
  @UseGuards(AuthGuard, TenantResolutionGuard, TenantMembershipGuard, TenantRoleGuard)
  @RequireRoles('MANAGER', 'ADMIN', 'OWNER')
  @ApiOperation({ summary: 'List members of the tenant organization' })
  @ApiResponse({ status: 200, description: 'Member list returned' })
  async getMembers(
    @CurrentTenant('companyId') companyId: string,
    @CurrentTenant('membershipRole') callerRole: CompanyRole
  ): Promise<TenantMemberResponse[]> {
    return this.membershipService.getCompanyMembers(companyId, callerRole);
  }

  @Patch('members/:id/role')
  @UseGuards(AuthGuard, TenantResolutionGuard, TenantMembershipGuard, TenantRoleGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update a member role' })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  async updateMemberRole(
    @CurrentTenant('companyId') companyId: string,
    @CurrentUser('id') callerUserId: string,
    @CurrentTenant('membershipRole') callerRole: CompanyRole,
    @Param('id') targetMembershipId: string,
    @Body() body: unknown
  ): Promise<TenantMemberResponse> {
    return this.membershipService.updateMemberRole(
      companyId,
      callerUserId,
      callerRole,
      targetMembershipId,
      body
    );
  }

  @Patch('members/:id/status')
  @UseGuards(AuthGuard, TenantResolutionGuard, TenantMembershipGuard, TenantRoleGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update a member status (ACTIVE or SUSPENDED)' })
  @ApiResponse({ status: 200, description: 'Member status updated' })
  async updateMemberStatus(
    @CurrentTenant('companyId') companyId: string,
    @CurrentUser('id') callerUserId: string,
    @CurrentTenant('membershipRole') callerRole: CompanyRole,
    @Param('id') targetMembershipId: string,
    @Body() body: unknown
  ): Promise<TenantMemberResponse> {
    return this.membershipService.updateMemberStatus(
      companyId,
      callerUserId,
      callerRole,
      targetMembershipId,
      body
    );
  }

  @Delete('members/:id')
  @UseGuards(AuthGuard, TenantResolutionGuard, TenantMembershipGuard)
  @ApiOperation({ summary: 'Remove a member from the company or leave organization' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  async removeMember(
    @CurrentTenant('companyId') companyId: string,
    @CurrentUser('id') callerUserId: string,
    @CurrentTenant('membershipRole') callerRole: CompanyRole,
    @Param('id') targetMembershipId: string
  ): Promise<{ message: string }> {
    return this.membershipService.removeMember(
      companyId,
      callerUserId,
      callerRole,
      targetMembershipId
    );
  }

  @Post('transfer-ownership')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, TenantResolutionGuard, TenantMembershipGuard, TenantRoleGuard)
  @RequireRoles('OWNER')
  @ApiOperation({ summary: 'Transfer organization ownership to an active member' })
  @ApiResponse({ status: 200, description: 'Ownership transferred' })
  async transferOwnership(
    @CurrentTenant('companyId') companyId: string,
    @CurrentUser('id') callerUserId: string,
    @Body() body: unknown
  ): Promise<{ message: string; newOwnerId: string }> {
    return this.membershipService.transferOwnership(companyId, callerUserId, body);
  }

  @Post('invitations')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard, TenantResolutionGuard, TenantMembershipGuard, TenantRoleGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Invite a new member to join the tenant organization' })
  @ApiResponse({ status: 201, description: 'Invitation created' })
  async createInvitation(
    @CurrentTenant('companyId') companyId: string,
    @CurrentUser('id') callerUserId: string,
    @CurrentTenant('membershipRole') callerRole: CompanyRole,
    @Body() body: unknown
  ): Promise<CompanyInvitation & { invitationToken?: string }> {
    return this.membershipService.createInvitation(
      companyId,
      callerUserId,
      callerRole,
      body
    );
  }

  @Get('invitations')
  @UseGuards(AuthGuard, TenantResolutionGuard, TenantMembershipGuard, TenantRoleGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'List pending invitations for the tenant organization' })
  @ApiResponse({ status: 200, description: 'Invitations list returned' })
  async getInvitations(
    @CurrentTenant('companyId') companyId: string,
    @CurrentTenant('membershipRole') callerRole: CompanyRole
  ): Promise<CompanyInvitation[]> {
    return this.membershipService.getPendingInvitations(companyId, callerRole);
  }

  @Delete('invitations/:id')
  @UseGuards(AuthGuard, TenantResolutionGuard, TenantMembershipGuard, TenantRoleGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  @ApiResponse({ status: 200, description: 'Invitation revoked' })
  async revokeInvitation(
    @CurrentTenant('companyId') companyId: string,
    @CurrentTenant('membershipRole') callerRole: CompanyRole,
    @Param('id') invitationId: string
  ): Promise<{ message: string }> {
    return this.membershipService.revokeInvitation(companyId, callerRole, invitationId);
  }

  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Accept an invitation using an invitation token' })
  @ApiResponse({ status: 200, description: 'Invitation accepted and membership activated' })
  async acceptInvitation(
    @CurrentUser('id') userId: string | undefined,
    @CurrentUser('email') userEmail: string | undefined,
    @Body() body: unknown
  ): Promise<{ message: string; companyId: string; role: CompanyRole }> {
    if (!userId || !userEmail) {
      throw new UnauthorizedException('Authentication required. Missing user identity.');
    }
    return this.membershipService.acceptInvitation(userId, userEmail, body);
  }
}
