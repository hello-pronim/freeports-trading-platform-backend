import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  NotFoundException,
  Patch,
  Get,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ExceptionDto } from 'src/exeption/dto/exception.dto';
import { InvalidFormExceptionDto } from 'src/exeption/dto/invalid-form-exception.dto';
import { ParseObjectIdPipe } from 'src/pipe/parse-objectid.pipe';
import { Permissions } from '../auth/decorator/permissions.decorator';
import { CreateRoleOrganizationRequestDto } from './dto/create-role-organization-request.dto';
import { CreateRoleResponseDto } from './dto/create-role-response.dto';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { UserDocument } from 'src/schema/user/user.schema';
import {
  PermissionClearer,
  PermissionDesk,
  PermissionOrganization,
} from 'src/schema/role/enum/permission.enum';
import { PermissionsGuard } from '../auth/guard/permissions.guard';
import { RoleService } from './role.service';
import { RoleMapper } from './mapper/role.mapper';
import { OrganizationService } from '../organization/organization.service';
import { CreateRoleDeskRequestDto } from './dto/create-role-desk-request.dto';
import { DeskService } from '../desk/desk.service';
import { CreateRoleDeskMultiRequestDto } from './dto/create-role-desk-multi-request.dto';
import { CreateRoleClearerRequestDto } from './dto/create-role-clearer-request.dto';
import JwtTwoFactorGuard from '../auth/guard/jwt-two-factor.guard';
import { UpdateRoleClearerRequestDto } from './dto/update-role-clearer-request.dto';
import { UpdateRoleResponseDto } from './dto/update-role-response.dto';
import { UpdateRoleOrganizationRequestDto } from './dto/update-role-organization-request.dto';
import { GetRoleClearerResponseDto } from './dto/get-role-clearer-response.dto';
import { GetRoleOrganizationResponseDto } from './dto/get-role-organization-response.dto';
import { UpdateRoleDeskMultiRequestDto } from './dto/update-role-desk-multi.dto';
import { GetRoleDeskMultiResponseDto } from './dto/get-role-desk-multi-response.dto';
import { GetRoleDeskResponseDto } from './dto/get-role-desk-response.dto';
import { UpdateRoleDeskRequestDto } from './dto/update-role-desk.dto';

@UseGuards(JwtTwoFactorGuard, PermissionsGuard)
@Controller('api/v1/organization')
@ApiTags('role')
@ApiBearerAuth()
export class RoleController {
  constructor(
    private readonly deskService: DeskService,
    private readonly organizationService: OrganizationService,
    private readonly roleService: RoleService,
  ) {}

  @Get('clearer/role')
  @Permissions(PermissionClearer.RoleRead)
  @ApiTags('clearer')
  @ApiOperation({ summary: 'Get clearer role list' })
  @ApiOkResponse({ type: [GetRoleClearerResponseDto] })
  @ApiInternalServerErrorResponse({
    description: 'Server error',
    type: ExceptionDto,
  })
  async getRoleClearerList(): Promise<GetRoleClearerResponseDto[]> {
    const roles = await this.roleService.getRoleClearerList();

    return roles.map((role) => {
      return {
        name: role.name,
        permissions: role.permissions,
      };
    });
  }

  @Post('clearer/role')
  @Permissions(PermissionClearer.RoleCreate)
  @ApiTags('clearer')
  @ApiOperation({ summary: 'Create clearer role' })
  @ApiCreatedResponse({
    description: 'Successfully created clearer role id',
    type: CreateRoleResponseDto,
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
  async createRoleClearer(
    @Body() request: CreateRoleClearerRequestDto,
    @CurrentUser() userCurrent: UserDocument,
  ): Promise<CreateRoleResponseDto> {
    const role = await this.roleService.createRoleClearer(request, userCurrent);

    return RoleMapper.toCreateDto(role);
  }

  @Patch('clearer/role/:roleId')
  @Permissions(PermissionClearer.RoleUpdate)
  @ApiTags('clearer')
  @ApiOperation({ summary: 'Update clearer role' })
  @ApiOkResponse({
    description: 'Successfully updated clearer role id',
    type: UpdateRoleResponseDto,
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
    description: 'Clearer role has not been found',
    type: ExceptionDto,
  })
  async updateRoleClearer(
    @Param('roleId', ParseObjectIdPipe) roleId: string,
    @Body() request: UpdateRoleClearerRequestDto,
  ): Promise<UpdateRoleResponseDto> {
    const role = await this.roleService.getRoleClearerById(roleId);

    if (!role) {
      throw new NotFoundException();
    }

    await this.roleService.updateRoleClearer(role, request);

    return RoleMapper.toUpdateDto(role);
  }

  @Get(':organizationId/role')
  @Permissions(PermissionOrganization.RoleRead)
  @ApiTags('organization')
  @ApiOperation({ summary: 'Get organization role list' })
  @ApiOkResponse({ type: [GetRoleOrganizationResponseDto] })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid Id',
    type: ExceptionDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization has not been found',
    type: ExceptionDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Server error',
    type: ExceptionDto,
  })
  async getRoleOrganizationList(
    @Param('organizationId', ParseObjectIdPipe) organizationId: string,
  ): Promise<GetRoleOrganizationResponseDto[]> {
    const organization = await this.organizationService.getById(organizationId);

    if (!organization) {
      throw new NotFoundException();
    }

    const roles = await this.roleService.getRoleOrganizationList(organization);

    return roles.map((role) => {
      return {
        name: role.name,
        permissions: role.permissions,
      };
    });
  }

  @Post(':organizationId/role')
  @Permissions(PermissionOrganization.RoleCreate)
  @ApiTags('organization')
  @ApiOperation({ summary: 'Create organization role' })
  @ApiCreatedResponse({
    description: 'Successfully created organization role id',
    type: CreateRoleResponseDto,
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
  async createRoleOrganization(
    @Param('organizationId', ParseObjectIdPipe) organizationId: string,
    @Body() request: CreateRoleOrganizationRequestDto,
    @CurrentUser() userCurrent: UserDocument,
  ): Promise<CreateRoleResponseDto> {
    const organization = await this.organizationService.getById(organizationId);

    if (!organization) {
      throw new NotFoundException();
    }

    const role = await this.roleService.createRoleOrganization(
      organization,
      request,
      userCurrent,
    );

    return RoleMapper.toCreateDto(role);
  }

  @Patch(':organizationId/role/:roleId')
  @Permissions(PermissionOrganization.RoleUpdate)
  @ApiTags('organization')
  @ApiOperation({ summary: 'Update organization role' })
  @ApiOkResponse({
    description: 'Successfully updated organization role id',
    type: UpdateRoleResponseDto,
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
    description: 'Organization role has not been found',
    type: ExceptionDto,
  })
  async updateRoleOrganization(
    @Param('organizationId', ParseObjectIdPipe) organizationId: string,
    @Param('roleId', ParseObjectIdPipe) roleId: string,
    @Body() request: UpdateRoleOrganizationRequestDto,
  ): Promise<UpdateRoleResponseDto> {
    const organization = await this.organizationService.getById(organizationId);

    if (!organization) {
      throw new NotFoundException();
    }

    const role = await this.roleService.getRoleOrganizationById(
      roleId,
      organization,
    );

    if (!role) {
      throw new NotFoundException();
    }

    await this.roleService.updateRoleOrganization(role, request);

    return RoleMapper.toUpdateDto(role);
  }

  @Get(':organizationId/role-multi')
  @Permissions(PermissionOrganization.RoleRead)
  @ApiTags('organization')
  @ApiOperation({ summary: 'Get multi-desk role list' })
  @ApiOkResponse({ type: [GetRoleDeskMultiResponseDto] })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid Id',
    type: ExceptionDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization has not been found',
    type: ExceptionDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Server error',
    type: ExceptionDto,
  })
  async getRoleDeskMultiList(
    @Param('organizationId', ParseObjectIdPipe) organizationId: string,
  ): Promise<GetRoleDeskMultiResponseDto[]> {
    const organization = await this.organizationService.getById(organizationId);

    if (!organization) {
      throw new NotFoundException();
    }

    const roles = await this.roleService.getRoleDeskMultiList(organization);

    return roles.map((role) => {
      return {
        name: role.name,
        permissions: role.permissions,
      };
    });
  }

  @Post(':organizationId/role-multi')
  @Permissions(PermissionOrganization.RoleCreate)
  @ApiTags('organization')
  @ApiOperation({ summary: 'Create multi-desk role' })
  @ApiCreatedResponse({
    description: 'Successfully created multi-desk role id',
    type: CreateRoleResponseDto,
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
  async createRoleDeskMulti(
    @Param('organizationId', ParseObjectIdPipe) organizationId: string,
    @Body() request: CreateRoleDeskMultiRequestDto,
    @CurrentUser() userCurrent: UserDocument,
  ): Promise<CreateRoleResponseDto> {
    const organization = await this.organizationService.getById(organizationId);

    if (!organization) {
      throw new NotFoundException();
    }

    const role = await this.roleService.createRoleDeskMulti(
      organization,
      request,
      userCurrent,
    );

    return RoleMapper.toCreateDto(role);
  }

  @Patch(':organizationId/role-multi/:roleId')
  @Permissions(PermissionOrganization.RoleUpdate)
  @ApiTags('organization')
  @ApiOperation({ summary: 'Update multi-desk role' })
  @ApiOkResponse({
    description: 'Successfully updated multi-desk role id',
    type: UpdateRoleResponseDto,
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
    description: 'Multi-desk role has not been found',
    type: ExceptionDto,
  })
  async updateRoleDeskMulti(
    @Param('organizationId', ParseObjectIdPipe) organizationId: string,
    @Param('roleId', ParseObjectIdPipe) roleId: string,
    @Body() request: UpdateRoleDeskMultiRequestDto,
  ): Promise<UpdateRoleResponseDto> {
    const organization = await this.organizationService.getById(organizationId);

    if (!organization) {
      throw new NotFoundException();
    }

    const role = await this.roleService.getRoleDeskMultiById(
      roleId,
      organization,
    );

    if (!role) {
      throw new NotFoundException();
    }

    await this.roleService.updateRoleDeskMulti(role, request);

    return RoleMapper.toUpdateDto(role);
  }

  @Get(':organizationId/desk/:deskId/role')
  @Permissions(PermissionOrganization.RoleRead, PermissionDesk.RoleRead)
  @ApiTags('organization', 'desk')
  @ApiOperation({ summary: 'Get desk role list' })
  @ApiOkResponse({ type: [GetRoleDeskResponseDto] })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid Id',
    type: ExceptionDto,
  })
  @ApiNotFoundResponse({
    description: 'Desk has not been found',
    type: ExceptionDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Server error',
    type: ExceptionDto,
  })
  async getRoleDeskList(
    @Param('organizationId', ParseObjectIdPipe) organizationId: string,
    @Param('deskId', ParseObjectIdPipe) deskId: string,
  ): Promise<GetRoleDeskResponseDto[]> {
    const organization = await this.organizationService.getById(organizationId);
    const desk = await this.deskService.getById(deskId);

    if (!organization || !desk || desk.organization !== organization) {
      throw new NotFoundException();
    }

    const roles = await this.roleService.getRoleDeskList(desk);

    return roles.map((role) => {
      return {
        name: role.name,
        permissions: role.permissions,
      };
    });
  }

  @Post(':organizationId/desk/:deskId/role')
  @Permissions(PermissionOrganization.RoleCreate, PermissionDesk.RoleCreate)
  @ApiTags('organization', 'desk')
  @ApiOperation({ summary: 'Create desk role' })
  @ApiCreatedResponse({
    description: 'Successfully created desk role id',
    type: CreateRoleResponseDto,
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
    description: 'Desk has not been found',
    type: ExceptionDto,
  })
  async createRoleDesk(
    @Param('organizationId', ParseObjectIdPipe) organizationId: string,
    @Param('deskId', ParseObjectIdPipe) deskId: string,
    @Body() request: CreateRoleDeskRequestDto,
    @CurrentUser() userCurrent: UserDocument,
  ): Promise<CreateRoleResponseDto> {
    const organization = await this.organizationService.getById(organizationId);
    const desk = await this.deskService.getById(deskId);

    if (!organization || !desk || desk.organization !== organization) {
      throw new NotFoundException();
    }

    const role = await this.roleService.createRoleDesk(
      desk,
      request,
      userCurrent,
    );

    return RoleMapper.toCreateDto(role);
  }

  @Patch(':organizationId/desk/:deskId/role/:roleId')
  @Permissions(PermissionOrganization.RoleUpdate, PermissionDesk.RoleUpdate)
  @ApiTags('organization', 'desk')
  @ApiOperation({ summary: 'Update desk role' })
  @ApiOkResponse({
    description: 'Successfully updated desk role id',
    type: UpdateRoleResponseDto,
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
    description: 'Desk role has not been found',
    type: ExceptionDto,
  })
  async updateRoleDesk(
    @Param('organizationId', ParseObjectIdPipe) organizationId: string,
    @Param('deskId', ParseObjectIdPipe) deskId: string,
    @Param('roleId', ParseObjectIdPipe) roleId: string,
    @Body() request: UpdateRoleDeskRequestDto,
  ): Promise<UpdateRoleResponseDto> {
    const organization = await this.organizationService.getById(organizationId);
    const desk = await this.deskService.getById(deskId);

    if (!organization || !desk || desk.organization !== organization) {
      throw new NotFoundException();
    }

    const role = await this.roleService.getRoleDeskById(roleId, desk);

    if (!role) {
      throw new NotFoundException();
    }

    await this.roleService.updateRoleDesk(role, request);

    return RoleMapper.toUpdateDto(role);
  }
}
