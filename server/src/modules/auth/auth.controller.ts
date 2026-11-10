import { Body, Controller, Get, HttpCode, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { ok } from "../../shared/http";
import { ZodValidationPipe } from "../../shared/validation";
import { CurrentAuth, Public, type AuthContext } from "../../shared/security/decorators";
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  mfaCodeSchema,
  mfaDisableSchema,
  mfaVerifySchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type LogoutInput,
  type MfaCodeInput,
  type MfaDisableInput,
  type MfaVerifyInput,
  type RefreshInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "./auth.dto";
import { AuthService } from "./auth.service";

function meta(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * NOTE: login/register answer with the token at the top level (no `data`
   * envelope) because `app/actions/auth.ts` reads `response.token` directly.
   */
  @Public()
  @Post("login")
  @HttpCode(200)
  async login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput, @Req() req: Request) {
    return { success: true, ...(await this.auth.login(body, meta(req))) };
  }

  @Public()
  @Post("register")
  @HttpCode(201)
  async register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput, @Req() req: Request) {
    return { success: true, ...(await this.auth.register(body, meta(req))) };
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  async refresh(@Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput, @Req() req: Request) {
    return { success: true, ...(await this.auth.refresh(body, meta(req))) };
  }

  @Post("logout")
  @HttpCode(200)
  async logout(
    @Body(new ZodValidationPipe(logoutSchema)) body: LogoutInput,
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
  ) {
    return this.auth.logout(auth, body, meta(req));
  }

  /** Step 2 of the login flow when the account has TOTP enabled. */
  @Public()
  @Post("mfa/verify")
  @HttpCode(200)
  async verifyMfa(@Body(new ZodValidationPipe(mfaVerifySchema)) body: MfaVerifyInput, @Req() req: Request) {
    return { success: true, ...(await this.auth.verifyMfa(body, meta(req))) };
  }

  @Get("mfa")
  async mfaStatus(@CurrentAuth() auth: AuthContext) {
    return ok(await this.auth.mfaStatus(auth));
  }

  @Post("mfa/setup")
  @HttpCode(200)
  async mfaSetup(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return ok(await this.auth.mfaSetup(auth, meta(req)), "Secret TOTP généré");
  }

  @Post("mfa/enable")
  @HttpCode(200)
  async mfaEnable(
    @CurrentAuth() auth: AuthContext,
    @Body(new ZodValidationPipe(mfaCodeSchema)) body: MfaCodeInput,
    @Req() req: Request,
  ) {
    return ok(await this.auth.mfaEnable(auth, body, meta(req)), "Double authentification activée");
  }

  @Post("mfa/disable")
  @HttpCode(200)
  async mfaDisable(
    @CurrentAuth() auth: AuthContext,
    @Body(new ZodValidationPipe(mfaDisableSchema)) body: MfaDisableInput,
    @Req() req: Request,
  ) {
    return ok(await this.auth.mfaDisable(auth, body, meta(req)), "Double authentification désactivée");
  }

  @Get("me")
  async me(@CurrentAuth() auth: AuthContext) {
    return ok(await this.auth.me(auth));
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(200)
  async forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) body: ForgotPasswordInput, @Req() req: Request) {
    return this.auth.forgotPassword(body, meta(req));
  }

  @Public()
  @Post("reset-password")
  @HttpCode(200)
  async resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordInput, @Req() req: Request) {
    return this.auth.resetPassword(body, meta(req));
  }
}
