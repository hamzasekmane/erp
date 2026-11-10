import { Module } from "@nestjs/common";
import { ClientGroupsAliasController, ClientGroupsController } from "./client-groups.controller";
import { ClientGroupsService } from "./client-groups.service";

@Module({
  controllers: [ClientGroupsController, ClientGroupsAliasController],
  providers: [ClientGroupsService],
})
export class ClientGroupsModule {}
