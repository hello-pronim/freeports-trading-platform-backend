import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Organization } from '../organization/organization.schema';
import { PermissionDesk } from './enum/permission.enum';
import { User } from '../user/user.schema';

export type RoleDeskMultiDocument = RoleDeskMulti & Document;

@Schema({ versionKey: false })
export class RoleDeskMulti {
  kind: string;
  name: string;
  owner: User;
  disabled?: boolean;

  @Prop({ type: [String], enum: PermissionDesk })
  permissions?: PermissionDesk[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Organization' })
  organization: Organization;
}

export const RoleDeskMultiSchema = SchemaFactory.createForClass(RoleDeskMulti);

RoleDeskMultiSchema.pre('save', function () {
  console.info('role desk multi presave');
});

RoleDeskMultiSchema.virtual('permissionsParsed').get(function () {
  return this.permissions.map((permission) => {
    return permission.replace('#id#', this.organization);
  });
});
