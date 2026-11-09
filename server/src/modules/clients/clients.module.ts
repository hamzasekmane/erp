import { Module } from "@nestjs/common";
import { ClientsImportController } from "./clients-import.controller";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";

@Module({
  controllers: [ClientsController, ClientsImportController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
