import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, SchemaTypes } from 'mongoose';
import { Organization } from 'src/schema/organization/organization.schema';
import {
  UserPersonal,
  UserPersonalSchema,
} from './embedded/user-personal.embedded';
import {
  UserPublicKey,
  UserPublicKeySchema,
} from './embedded/user-public-key.embedded';
import { UserRole, UserRoleSchema } from './embedded/user-role.embedded';

export type UserDocument = User & Document;

@Schema({ versionKey: false })
export class User {
  @ApiProperty({
    format: 'ObjectId',
  })
  _id?: string;

  /**
   * This field will be set when registering an user, then it will be read only. Nobody will be transfered to another organization
   */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Organization' })
  organization?: Organization;

  @Prop()
  vault_user_id?: string;

  @Prop({ type: UserPersonalSchema })
  personal?: UserPersonal;

  @Prop({ type: [UserPublicKeySchema] })
  publicKeys?: UserPublicKey[];

  @Prop({ type: [UserRoleSchema] })
  roles?: UserRole[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  relationhipManager?: User;

  @Prop()
  commission?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('permissions').get(async function () {
  await this.populate('roles.role').execPopulate();

  return this.roles.reduce((prev, role) => {
    return prev.concat(role.get('permissions'));
  }, []);
});
