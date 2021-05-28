import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from 'src/schema/user/user.schema';
import {
  Organization,
  OrganizationDocument,
} from 'src/schema/organization/organization.schema';
import { CreateOrganizationRequestDto } from './dto/create-organization-request.dto';
import { CreateOrganizationResponseDto } from './dto/create-organization-response.dto';
import { UpdateOrganizationRequestDto } from './dto/update-organization-request.dto';
import { OrganizationMapper } from './mapper/organization.mapper';
import { GetOrganizationResponseDto } from './dto/get-organization-response.dto';
import { UpdateOrganizationResponseDto } from './dto/update-organization-response.dto';
import { PaginationRequest } from 'src/pagination/pagination-request.interface';
import { PaginationResponseDto } from 'src/pagination/pagination-response.dto';
import { PaginationHelper } from 'src/pagination/pagination.helper';
import { CreateOrganizationAccountRequestDto } from './dto/create-organization-account-request.dto';
import { CreateOrganizationAccountResponseDto } from './dto/create-organization-account-response.dto';
import { Account, AccountDocument } from 'src/schema/account/account.schema';
import { AccountMapper } from './mapper/account.mapper';
import { DeleteOrganizationAccountResponseDto } from './dto/delete-organization-account-response.dto';
import { UserService } from '../user/user.service';
import { UserMapper } from '../user/mapper/user.mapper';
import { CreateUserRequestDto } from '../user/dto/create-user-request.dto';
import { CreateUserResponseDto } from '../user/dto/create-user-response.dto';
import { UpdateUserRequestDto } from '../user/dto/update-user-request.dto';
import { UpdateUserResponseDto } from '../user/dto/update-user-response.dto';
import { GetUserResponseDto } from '../user/dto/get-user-response.dto';
import { RoleService } from '../role/role.service';

@Injectable()
export class ClearerService {
  constructor(
    @InjectModel(Account.name)
    private accountModel: Model<AccountDocument>,
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    private userService: UserService,
    private roleService: RoleService,
  ) {}

  async createOrganization(
    request: CreateOrganizationRequestDto,
    user: UserDocument,
  ): Promise<CreateOrganizationResponseDto> {
    const organization = new this.organizationModel();

    await OrganizationMapper.toCreateDocument(organization, request).save();
    await this.roleService.createRoleOrganizationDefault(organization, user);

    return OrganizationMapper.toCreateDto(organization);
  }

  async updateOrganization(
    id: string,
    request: UpdateOrganizationRequestDto,
  ): Promise<UpdateOrganizationResponseDto> {
    const organization = await this.organizationModel.findById(id).exec();

    if (!organization) {
      throw new NotFoundException();
    }

    await OrganizationMapper.toUpdateDocument(organization, request).save();

    return OrganizationMapper.toUpdateDto(organization);
  }

  async getOrganizations(
    pagination: PaginationRequest,
  ): Promise<PaginationResponseDto<GetOrganizationResponseDto>> {
    const {
      skip,
      limit,
      order,
      params: { search },
    } = pagination;

    const query: any[] = [];

    if (search) {
      query.push({
        $match: {
          'details.name': { $regex: '.*' + search + '.*', $options: 'i' },
        },
      });
    }
    if (Object.keys(order).length) {
      query.push({ $sort: order });
    }

    const [
      { paginatedResult, totalResult },
    ] = await this.organizationModel.aggregate([
      ...query,
      {
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: limit }],
          totalResult: [{ $count: 'total' }],
        },
      },
    ]);

    const organizationDtos = paginatedResult.map((organization) =>
      OrganizationMapper.toGetDto(organization),
    );

    return PaginationHelper.of(
      pagination,
      totalResult[0]?.total || 0,
      organizationDtos,
    );
  }

  async createOrganizationManager(
    id: string,
    request: CreateUserRequestDto,
    userCurrent: UserDocument,
  ): Promise<CreateUserResponseDto> {
    const organization = await this.organizationModel.findById(id).exec();

    if (!organization) {
      throw new NotFoundException();
    }

    const roleDefault = await this.roleService.getRoleOrganizationDefault(
      organization,
    );
    const user = await this.userService.create(request, false);

    user.organization = organization;
    user.roles.push({
      role: roleDefault,
      assignedAt: new Date(),
      assignedBy: userCurrent,
    });

    await user.save();

    return UserMapper.toCreateDto(user);
  }

  async updateOrganizationManager(
    id: string,
    request: UpdateUserRequestDto,
  ): Promise<UpdateUserResponseDto> {
    const user = await this.userService.findById(id);

    if (!user) {
      throw new NotFoundException();
    }

    await UserMapper.toUpdateDocument(user, request).save();

    return UserMapper.toUpdateDto(user);
  }

  async getOrganizationManagers(
    id: string,
    pagination: PaginationRequest,
  ): Promise<PaginationResponseDto<GetUserResponseDto>> {
    const organization = await this.organizationModel.findById(id).exec();

    if (!organization) {
      throw new NotFoundException();
    }

    return this.userService.getOrganizationManagers(organization, pagination);
  }

  async createAccount(
    id: string,
    request: CreateOrganizationAccountRequestDto,
    user: UserDocument,
  ): Promise<CreateOrganizationAccountResponseDto> {
    let account = new this.accountModel();
    const organization = await this.organizationModel.findById(id).exec();

    if (!organization) {
      throw new NotFoundException();
    }

    account = AccountMapper.toCreateDocument(account, request);
    account.owner = user;
    await account.save();

    organization.clearing.push({
      currency: request.currency,
      account: account,
    });
    await organization.save();

    return AccountMapper.toCreateDto(account);
  }

  async deleteAccount(
    organizationId: string,
    accountId: string,
  ): Promise<DeleteOrganizationAccountResponseDto> {
    const account = await this.accountModel.findById(accountId).exec();
    const organization = await this.organizationModel
      .findById(organizationId)
      .exec();

    if (!account || !organization) {
      throw new NotFoundException();
    }

    await account.remove();
    await this.organizationModel.updateOne(
      { _id: organization._id },
      { $pull: { clearing: { account: account._id } } },
    );

    return AccountMapper.toDeleteDto(account);
  }
}