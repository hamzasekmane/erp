import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./shared/security/auth.guard";
import { MailModule } from "./shared/mail/mail.module";
import { VersionAliasMiddleware } from "./shared/version-alias.middleware";
import { AdminModule } from "./modules/admin/admin.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { ClientGroupsModule } from "./modules/client-groups/client-groups.module";
import { ClientNotesModule } from "./modules/client-notes/client-notes.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { DocsModule } from "./modules/docs/docs.module";
import { ApiKeysModule } from "./modules/api-keys/api-keys.module";
import { ArchivesModule } from "./modules/archives/archives.module";
import { HealthModule } from "./modules/health/health.module";
import { MaintenanceModule } from "./modules/maintenance/maintenance.module";
import { OutboxModule } from "./modules/outbox/outbox.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { HrModule } from "./modules/hr/hr.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { SupportModule } from "./modules/support/support.module";
import { TenancyModule } from "./modules/tenancy/tenancy.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [MailModule, AuthModule, AdminModule, TenancyModule, UsersModule, ClientsModule, CatalogModule, InvoicesModule, PaymentsModule, DashboardModule, ReportsModule, ClientGroupsModule, ClientNotesModule, NotificationsModule, HrModule, SupportModule, ArchivesModule, ApiKeysModule, DocsModule, OutboxModule, UploadsModule, MaintenanceModule, HealthModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VersionAliasMiddleware).forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
