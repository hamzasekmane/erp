import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { closeDb, initDb } from "../db/client";
import { migrate } from "../db/migrate";
import { ensureBaselinePlans } from "../db/bootstrap";
import { requestIdMiddleware } from "../shared/http";
import { ApiExceptionFilter } from "../shared/exception.filter";

export async function createTestApp(): Promise<INestApplication> {
  await initDb();
  await migrate();
  await ensureBaselinePlans();

  const app = await NestFactory.create(AppModule, { logger: ["error"] });
  app.setGlobalPrefix("api");
  app.use(requestIdMiddleware);
  app.useGlobalFilters(new ApiExceptionFilter());
  await app.init();
  return app;
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
  await closeDb();
}
