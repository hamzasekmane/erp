import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { ok, okList, parsePagination } from "../../shared/http";
import { CurrentAuth, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { ZodValidationPipe } from "../../shared/validation";
import {
  adminResetPasswordSchema,
  changePasswordSchema,
  createUserSchema,
  updateProfileSchema,
  updateUserSchema,
  type AdminResetPasswordInput,
  type ChangePasswordInput,
  type CreateUserInput,
  type UpdateProfileInput,
  type UpdateUserInput,
} from "./users.dto";
import { UsersService } from "./users.service";

function ctx(auth: AuthContext, req: Request) {
  return { ...auth, ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
}

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.usersRead)
  async list(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query() query: Record<string, unknown>) {
    const result = await this.users.list(ctx(auth, req), {
      ...parsePagination(query),
      search: typeof query.search === "string" ? query.search : undefined,
      role: typeof query.role === "string" ? query.role : undefined,
      status: typeof query.status === "string" ? query.status : undefined,
    });
    return okList(result.items, result.pagination);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.usersWrite)
  async create(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserInput,
  ) {
    return ok(await this.users.create(ctx(auth, req), body), "Utilisateur créé");
  }

  @Get("roles")
  async roles() {
    return ok(this.users.roles());
  }

  @Get("profile/me")
  async profile(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return ok(await this.users.profile(ctx(auth, req)));
  }

  @Put("profile/me")
  async updateProfile(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ) {
    return ok(await this.users.updateProfile(ctx(auth, req), body), "Profil mis à jour");
  }

  @Put("change-password")
  async changePasswordAlias(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordInput,
  ) {
    return ok(await this.users.changeOwnPassword(ctx(auth, req), body));
  }

  @Put("profile/password")
  async changePassword(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordInput,
  ) {
    return ok(await this.users.changeOwnPassword(ctx(auth, req), body));
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.usersRead)
  async get(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.users.get(ctx(auth, req), id));
  }

  @Put(":id")
  @RequirePermissions(PERMISSIONS.usersWrite)
  async update(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) body: UpdateUserInput,
  ) {
    return ok(await this.users.update(ctx(auth, req), id, body), "Utilisateur mis à jour");
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.usersWrite)
  async remove(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.users.remove(ctx(auth, req), id), "Utilisateur supprimé");
  }

  @Post(":id/reset-password")
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.usersWrite)
  async resetPassword(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(adminResetPasswordSchema)) body: AdminResetPasswordInput,
  ) {
    return ok(await this.users.adminResetPassword(ctx(auth, req), id, body));
  }
}
