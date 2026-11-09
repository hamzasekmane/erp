import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { z } from "zod";
import { parsePagination } from "../../shared/http";
import { CurrentAuth, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { ZodValidationPipe } from "../../shared/validation";
import { NotificationsService } from "./notifications.service";

const broadcastSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(["info", "success", "warning", "error"]).default("info"),
});

@Controller("dashboard/notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.notificationsRead)
  async list(@CurrentAuth() auth: AuthContext, @Query() query: Record<string, unknown>) {
    const result = await this.notifications.list(auth, {
      ...parsePagination(query),
      isRead: typeof query.isRead === "string" ? query.isRead : undefined,
      type: typeof query.type === "string" ? query.type : undefined,
    });
    return {
      success: true as const,
      data: { notifications: result.notifications, unreadCount: result.unreadCount },
      pagination: result.pagination,
    };
  }

  @Get("unread/count")
  @RequirePermissions(PERMISSIONS.notificationsRead)
  async unreadCount(@CurrentAuth() auth: AuthContext) {
    return { success: true as const, ...(await this.notifications.unreadCount(auth)) };
  }

  @Put(":id/read")
  @RequirePermissions(PERMISSIONS.notificationsRead)
  async markRead(@CurrentAuth() auth: AuthContext, @Param("id") id: string) {
    return this.notifications.markRead(auth, id);
  }

  @Put("read-all")
  @RequirePermissions(PERMISSIONS.notificationsRead)
  async markAllRead(@CurrentAuth() auth: AuthContext) {
    return this.notifications.markAllRead(auth);
  }

  @Post("system")
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.usersWrite)
  async broadcast(@CurrentAuth() auth: AuthContext, @Body(new ZodValidationPipe(broadcastSchema)) body: z.infer<typeof broadcastSchema>) {
    return this.notifications.broadcast(auth, body);
  }

  @Post("cleanup")
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.usersWrite)
  async cleanup(@CurrentAuth() auth: AuthContext) {
    return this.notifications.cleanup(auth);
  }

  @Delete()
  @RequirePermissions(PERMISSIONS.notificationsWrite)
  async removeAll(@CurrentAuth() auth: AuthContext, @Req() _req: Request) {
    return this.notifications.removeAll(auth);
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.notificationsWrite)
  async remove(@CurrentAuth() auth: AuthContext, @Param("id") id: string) {
    return this.notifications.remove(auth, id);
  }
}
