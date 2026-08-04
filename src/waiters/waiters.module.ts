import { Module } from '@nestjs/common';
import { WaitersController } from './waiters.controller';
import { UsersModule } from '../users/users.module';
import { TablesModule } from '../tables/tables.module';

@Module({
  imports: [UsersModule, TablesModule],
  controllers: [WaitersController],
})
export class WaitersModule {}
