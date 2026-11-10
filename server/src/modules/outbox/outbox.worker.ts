import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from "@nestjs/common";
import { env } from "../../config/env";
import { OutboxService } from "./outbox.service";

/** Drains the transactional outbox on a timer. Disabled in tests via OUTBOX_DISABLED. */
@Injectable()
export class OutboxWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(OutboxWorker.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly outbox: OutboxService) {}

  onApplicationBootstrap() {
    if (env.OUTBOX_DISABLED || env.OUTBOX_INTERVAL_MS === 0) {
      this.logger.log("Outbox worker disabled");
      return;
    }
    this.timer = setInterval(() => void this.tick(), env.OUTBOX_INTERVAL_MS);
    this.timer.unref();
    this.logger.log(`Outbox worker started (every ${env.OUTBOX_INTERVAL_MS} ms)`);
  }

  onApplicationShutdown() {
    if (this.timer) clearInterval(this.timer);
  }

  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const result = await this.outbox.processPending();
      if (result.claimed > 0) {
        this.logger.log(`Outbox batch: ${result.processed} processed, ${result.failed} failed`);
      }
    } catch (error) {
      this.logger.error(`Outbox tick failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.running = false;
    }
  }
}
