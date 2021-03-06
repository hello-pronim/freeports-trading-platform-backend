import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  Get,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ExceptionDto } from 'src/exeption/dto/exception.dto';
import { InvalidFormExceptionDto } from 'src/exeption/dto/invalid-form-exception.dto';
import { OrganizationService } from './organization.service';
import { ParseObjectIdPipe } from 'src/pipe/parse-objectid.pipe';
import { Permissions } from '../auth/decorator/permissions.decorator';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { UserDocument } from 'src/schema/user/user.schema';
import { CreateOrganizationResponseDto } from './dto/create-organization-response.dto';
import { CreateOrganizationRequestDto } from './dto/create-organization-request.dto';
import { UpdateOrganizationRequestDto } from './dto/update-organization-request.dto';
import { UpdateOrganizationResponseDto } from './dto/update-organization-response.dto';
import { ApiPaginationResponse } from 'src/pagination/api-pagination-response.decorador';
import { GetOrganizationResponseDto } from './dto/get-organization-response.dto';
import { PaginationParams } from 'src/pagination/pagination-params.decorator';
import { PaginationRequest } from 'src/pagination/pagination-request.interface';
import { PaginationResponseDto } from 'src/pagination/pagination-response.dto';
import { PermissionsGuard } from '../auth/guard/permissions.guard';
import { RoleService } from '../role/role.service';
import { OrganizationMapper } from './mapper/organization.mapper';
import { OrganizationDocument } from 'src/schema/organization/organization.schema';
import { PaginationHelper } from 'src/pagination/pagination.helper';
import JwtTwoFactorGuard from '../auth/guard/jwt-two-factor.guard';
import {
  PermissionClearer,
  PermissionOrganization,
} from 'src/schema/role/permission.helper';

@UseGuards(JwtTwoFactorGuard, PermissionsGuard)
@Controller('api/v1')
@ApiBearerAuth()
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly roleService: RoleService,
  ) {}

  @Post('clearer/organization')
  @Permissions(PermissionClearer.organizationCreate)
  @ApiTags('clearer')
  @ApiOperation({ summary: 'Create organization' })
  @ApiCreatedResponse({
    description: 'Successfully registered organization id',
    type: CreateOrganizationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid form',
    type: InvalidFormExceptionDto,
  })
  async createOrganization(
    @Body() request: CreateOrganizationRequestDto,
    @CurrentUser() userCurrent: UserDocument,
  ): Promise<CreateOrganizationResponseDto> {
    const organization = await this.organizationService.create(request);

    await this.roleService.createRoleOrganizationManager(
      organization,
      userCurrent,
    );

    return OrganizationMapper.toCreateDto(organization);
  }

  @Patch('organization/:organizationId')
  @Permissions(
    PermissionClearer.organizationUpdate,
    PermissionOrganization.organizationUpdate,
  )
  @ApiTags('clearer', 'organization')
  @ApiOperation({ summary: 'Update organization' })
  @ApiOkResponse({
    description: 'Successfully updated organization id',
    type: CreateOrganizationResponseDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid Id',
    type: ExceptionDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid form',
    type: InvalidFormExceptionDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization has not been found',
    type: ExceptionDto,
  })
  async updateOrganization(
    @Param('organizationId', ParseObjectIdPipe) organizationId: string,
    @Body() request: UpdateOrganizationRequestDto,
  ): Promise<UpdateOrganizationResponseDto> {
    const organization = await this.organizationService.getById(organizationId);

    if (!organization) {
      throw new NotFoundException();
    }

    await this.organizationService.update(organization, request);

    return OrganizationMapper.toUpdateDto(organization);
  }

  @Get('organization/:organizationId')
  @Permissions(
    PermissionClearer.organizationRead,
    PermissionOrganization.organizationRead,
  )
  @ApiTags('clearer', 'organization')
  @ApiOperation({ summary: 'Get organization details' })
  @ApiOkResponse({ type: GetOrganizationResponseDto })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid Id',
    type: ExceptionDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization has not been found',
    type: ExceptionDto,
  })
  async getOrganization(
    @Param('organizationId', ParseObjectIdPipe) organizationId: string,
  ): Promise<GetOrganizationResponseDto> {
    const organization = await this.organizationService.getById(organizationId);

    if (!organization) {
      throw new NotFoundException();
    }

    return OrganizationMapper.toGetDto(organization);
  }

  @Get('organization')
  @Permissions(PermissionClearer.organizationRead)
  @ApiTags('clearer')
  @ApiOperation({ summary: 'Get organization list' })
  @ApiPaginationResponse(GetOrganizationResponseDto)
  async getOrganizations(
    @PaginationParams() pagination: PaginationRequest,
  ): Promise<PaginationResponseDto<GetOrganizationResponseDto>> {
    const [
      { paginatedResult, totalResult },
    ] = await this.organizationService.getOrganizationsPaginated(pagination);

    const organizationDtos = paginatedResult.map(
      (organization: OrganizationDocument) =>
        OrganizationMapper.toGetDto(organization),
    );

    return PaginationHelper.of(
      pagination,
      totalResult[0]?.total || 0,
      organizationDtos,
    );
  }
}
