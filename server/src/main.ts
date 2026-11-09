import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import { env, isProd } from "./config/env";
import { closeDb, initDb } from "./db/client";
import { migrate } from "./db/migrate";
import { ensureBaselinePlans } from "./db/bootstrap";
import { requestIdMiddleware } from "./shared/http";
import { ApiExceptionFilter } from "./shared/exception.filter";

async function bootstrap() {
  await initDb();
  await migrate();
  await ensureBaselinePlans();

  const app = await NestFactory.create(AppModule, {
    logger: isProd ? ["error", "warn", "log"] : ["error", "warn", "log"],
  });

  app.setGlobalPrefix("api");
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.use(requestIdMiddleware);

  app.enableCors({
    origin: true,
    credentials: true,
    exposedHeaders: ["X-Request-Id", "Retry-After"],
  });

  app.enableShutdownHooks();
  app.useGlobalFilters(new ApiExceptionFilter());

  await app.listen(env.PORT, "0.0.0.0");
  Logger.log(`API listening on http://0.0.0.0:${env.PORT}/api (alias /api/v1)`, "Bootstrap");
}

process.on("SIGTERM", async () => {
  await closeDb();
  process.exit(0);
});
process.on("SIGINT", async () => {
  await closeDb();
  process.exit(0);
});

bootstrap().catch((error) => {
  Logger.error(error, undefined, "Bootstrap");
  process.exit(1);
});
