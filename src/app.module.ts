import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WaitersModule } from './waiters/waiters.module';
import { TablesModule } from './tables/tables.module';
import { CategoriesModule } from './categories/categories.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { KitchenModule } from './kitchen/kitchen.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    CommonModule,
    WebsocketModule,
    AuthModule,
    UsersModule,
    WaitersModule,
    TablesModule,
    CategoriesModule,
    MenuModule,
    OrdersModule,
    KitchenModule,
    PaymentsModule,
    ReportsModule,
  ],
})
export class AppModule {}
