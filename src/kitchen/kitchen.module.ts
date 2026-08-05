import { Module } from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { KitchenController } from './kitchen.controller';
import { OrdersModule } from '../orders/orders.module';
import { TablesModule } from '../tables/tables.module';

@Module({
  imports: [OrdersModule, TablesModule],
  controllers: [KitchenController],
  providers: [KitchenService],
})
export class KitchenModule {}
