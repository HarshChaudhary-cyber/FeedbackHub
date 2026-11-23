import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TenantResolutionGuard } from '../tenant/guards/tenant-resolution.guard';
import { TenantMembershipGuard } from '../tenant/guards/tenant-membership.guard';
import { TenantRoleGuard } from '../tenant/guards/tenant-role.guard';
import { CurrentTenant } from '../tenant/decorators/current-tenant.decorator';
import { RequireRoles } from '../tenant/decorators/roles.decorator';
import { FormsService } from './forms.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  FeedbackForm,
  FeedbackFormSummary,
  FormStatus,
  PublicFeedbackForm,
} from '@feedbackhub/types';

@ApiTags('Tenant Forms')
@ApiCookieAuth()
@UseGuards(AuthGuard, TenantResolutionGuard, TenantMembershipGuard, TenantRoleGuard)
@Controller('tenant/forms')
export class FormsController {
  private readonly formsService: FormsService;

  constructor(
    @Optional() formsService?: FormsService,
    @Optional() prismaService?: PrismaService
  ) {
    this.formsService = formsService || new FormsService(prismaService || new PrismaService());
  }

  @Get()
  @ApiOperation({ summary: 'List all company feedback forms' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  @ApiResponse({ status: 200, description: 'List of forms returned' })
  async listForms(
    @CurrentTenant('companyId') companyId: string,
    @Query('search') search?: string,
    @Query('status') status?: FormStatus
  ): Promise<FeedbackFormSummary[]> {
    return this.formsService.listForms(companyId, { search, status });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireRoles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new feedback form' })
  @ApiResponse({ status: 201, description: 'Feedback form created' })
  async createForm(
    @CurrentTenant('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() body: unknown
  ): Promise<FeedbackForm> {
    return this.formsService.createForm(companyId, userId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a form by ID with questions and configuration' })
  @ApiResponse({ status: 200, description: 'Feedback form returned' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async getForm(
    @CurrentTenant('companyId') companyId: string,
    @Param('id') formId: string
  ): Promise<FeedbackForm> {
    return this.formsService.getForm(companyId, formId);
  }

  @Patch(':id')
  @RequireRoles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update a feedback form and synchronize its questions' })
  @ApiResponse({ status: 200, description: 'Feedback form updated' })
  async updateForm(
    @CurrentTenant('companyId') companyId: string,
    @Param('id') formId: string,
    @Body() body: unknown
  ): Promise<FeedbackForm> {
    return this.formsService.updateForm(companyId, formId, body);
  }

  @Put(':id')
  @RequireRoles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update a feedback form and synchronize its questions (PUT alias)' })
  @ApiResponse({ status: 200, description: 'Feedback form updated' })
  async updateFormPut(
    @CurrentTenant('companyId') companyId: string,
    @Param('id') formId: string,
    @Body() body: unknown
  ): Promise<FeedbackForm> {
    return this.formsService.updateForm(companyId, formId, body);
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @RequireRoles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Duplicate an existing form into a new draft' })
  @ApiResponse({ status: 201, description: 'Form duplicated' })
  async duplicateForm(
    @CurrentTenant('companyId') companyId: string,
    @Param('id') formId: string
  ): Promise<FeedbackForm> {
    return this.formsService.duplicateForm(companyId, formId);
  }

  @Post(':id/publish')
  @RequireRoles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Publish a draft feedback form' })
  @ApiResponse({ status: 200, description: 'Form published' })
  async publishForm(
    @CurrentTenant('companyId') companyId: string,
    @Param('id') formId: string
  ): Promise<FeedbackForm> {
    return this.formsService.publishForm(companyId, formId);
  }

  @Post(':id/unpublish')
  @RequireRoles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Unpublish a published form back to draft status' })
  @ApiResponse({ status: 200, description: 'Form unpublished' })
  async unpublishForm(
    @CurrentTenant('companyId') companyId: string,
    @Param('id') formId: string
  ): Promise<FeedbackForm> {
    return this.formsService.unpublishForm(companyId, formId);
  }

  @Post(':id/archive')
  @RequireRoles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Archive a form to prevent new submissions' })
  @ApiResponse({ status: 200, description: 'Form archived' })
  async archiveForm(
    @CurrentTenant('companyId') companyId: string,
    @Param('id') formId: string
  ): Promise<FeedbackForm> {
    return this.formsService.archiveForm(companyId, formId);
  }

  @Delete(':id')
  @RequireRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Delete a feedback form and its answers' })
  @ApiResponse({ status: 200, description: 'Form deleted' })
  async deleteForm(
    @CurrentTenant('companyId') companyId: string,
    @Param('id') formId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.formsService.deleteForm(companyId, formId);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview a form as respondents will experience it' })
  @ApiResponse({ status: 200, description: 'Form preview returned' })
  async getPreview(
    @CurrentTenant('companyId') companyId: string,
    @Param('id') formId: string
  ): Promise<PublicFeedbackForm> {
    return this.formsService.getPreview(companyId, formId);
  }
}
