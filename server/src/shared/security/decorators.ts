import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type { Permission } from "./permissions";

export const IS_PUBLIC_KEY = "isPublic";
export const PERMISSIONS_KEY = "permissions";

/** Route does not require authentication. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Route requires all listed permissions. */
export const RequirePermissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);

export type AuthContext = {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
  name: string;
};

export const CurrentAuth = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthContext => {
  const request = ctx.switchToHttp().getRequest();
  return request.auth as AuthContext;
});
