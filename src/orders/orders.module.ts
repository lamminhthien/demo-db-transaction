import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Coupon, Order, OrderAudit, OrderItem } from './entities';

@Module({
  imports: [MikroOrmModule.forFeature([Order, OrderItem, Coupon, OrderAudit])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
