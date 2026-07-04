import { Body, Controller, Param, Post } from '@nestjs/common';
import { CreateOrderSimulationDto } from './dto/create-order-simulation.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('simulate')
  createOrderSimulation(@Body() dto: CreateOrderSimulationDto) {
    return this.ordersService.createOrderSimulation(dto);
  }

  @Post('coupons/:code')
  seedCoupon(
    @Param('code') code: string,
    @Body('discountPercent') discountPercent?: number,
  ) {
    return this.ordersService.seedCoupon(code, discountPercent);
  }
}
