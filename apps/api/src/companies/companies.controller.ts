import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CreateCompanyResponse, UserCompanyItem } from '@feedbackhub/types';

@ApiTags('Companies')
@ApiCookieAuth()
@UseGuards(AuthGuard)
@Controller('companies')
export class CompaniesController {
  private readonly companiesService: CompaniesService;

  constructor(companiesService?: CompaniesService) {
    this.companiesService = companiesService || new CompaniesService(new PrismaService());
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new company tenant',
    description:
      'Creates a new company organization and automatically assigns OWNER membership to the authenticated user. Never trusts client-supplied owner or user IDs.',
  })
  @ApiResponse({ status: 201, description: 'Company successfully created' })
  @ApiResponse({ status: 400, description: 'Validation failed or reserved slug' })
  @ApiResponse({ status: 401, description: 'Unauthenticated or unauthorized' })
  @ApiResponse({ status: 409, description: 'Company slug already exists' })
  async createCompany(
    @CurrentUser('id') userId: string | undefined,
    @Body() body: unknown
  ): Promise<CreateCompanyResponse> {
    if (!userId) {
      throw new UnauthorizedException('Authentication required. Missing user identity.');
    }
    return this.companiesService.createCompany(userId, body);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List user companies',
    description:
      'Returns all companies for which the authenticated user holds an active membership. Never leaks cross-tenant or unpermitted user data.',
  })
  @ApiResponse({ status: 200, description: 'List of companies returned' })
  @ApiResponse({ status: 401, description: 'Unauthenticated or unauthorized' })
  async getMyCompanies(
    @CurrentUser('id') userId: string | undefined
  ): Promise<UserCompanyItem[]> {
    if (!userId) {
      throw new UnauthorizedException('Authentication required. Missing user identity.');
    }
    return this.companiesService.getUserCompanies(userId);
  }
}
