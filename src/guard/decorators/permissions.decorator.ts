import { SetMetadata } from '@nestjs/common';
import { Permission } from '../constants/permission';

export const Permissions = (...permissions: Permission[]) => SetMetadata('permissions', permissions);
