import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrderSimulationDto } from './dto/create-order-simulation.dto';
import { SeedCouponDto } from './dto/seed-coupon.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('simulate')
  @ApiOperation({
    summary: 'Simulate order creation in a transaction',
    description:
      'Creates an order with items, optionally locks/uses a coupon, and supports intentional rollback simulation flags.',
  })
  @ApiOkResponse({
    description: 'Order simulation completed.',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'Success',
        },
        orderId: {
          type: 'number',
          example: 101,
        },
        message: {
          type: 'string',
          example: 'Transaction has been flushed but intentionally not committed.',
          nullable: true,
        },
        couponCode: {
          type: 'string',
          example: 'SUMMER10',
          nullable: true,
        },
      },
      required: ['status', 'orderId'],
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or coupon already used.',
  })
  @ApiNotFoundResponse({
    description: 'Coupon code was not found.',
  })
  createOrderSimulation(@Body() dto: CreateOrderSimulationDto) {
    return this.ordersService.createOrderSimulation(dto);
  }

  @Get('discounts')
  @ApiOperation({
    summary: 'Fetch available discount list',
    description: 'Returns all coupons with discount data and usage status.',
  })
  @ApiOkResponse({
    description: 'Discount list fetched successfully.',
  })
  getDiscountList() {
    return this.ordersService.getDiscountList();
  }

  @Get()
  @ApiOperation({
    summary: 'Fetch order list',
    description: 'Returns all orders with items, coupon info, and audit trail.',
  })
  @ApiOkResponse({
    description: 'Order list fetched successfully.',
  })
  getOrders() {
    return this.ordersService.getOrders();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Fetch order by id',
    description: 'Returns a single order with items, coupon info, and audit trail.',
  })
  @ApiParam({
    name: 'id',
    example: 101,
    description: 'Order id',
  })
  @ApiOkResponse({
    description: 'Order fetched successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Order not found.',
  })
  getOrderById(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOrderById(id);
  }

  @Post('coupons/:code')
  @ApiOperation({
    summary: 'Create or get a coupon by code',
    description: 'Seeds a coupon for simulation. Returns existing coupon when code already exists.',
  })
  @ApiParam({
    name: 'code',
    example: 'SUMMER10',
    description: 'Coupon code identifier',
  })
  @ApiBody({ type: SeedCouponDto })
  @ApiOkResponse({
    description: 'Coupon created or returned if it already exists.',
  })
  seedCoupon(
    @Param('code') code: string,
    @Body() dto: SeedCouponDto,
  ) {
    return this.ordersService.seedCoupon(code, dto.discountPercent);
  }
}
