import { LockMode } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderSimulationDto } from './dto/create-order-simulation.dto';
import { Coupon, Order, OrderAudit, OrderItem } from './entities';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly em: EntityManager) {}

  async seedCoupon(code: string, discountPercent = 10) {
    const existing = await this.em.findOne(Coupon, { code });
    if (existing) {
      return existing;
    }

    const coupon = this.em.create(Coupon, {
      code,
      discountPercent,
      used: false,
    });
    await this.em.persistAndFlush(coupon);

    return coupon;
  }

  async createOrderSimulation(dto: CreateOrderSimulationDto) {
    const fork = this.em.fork();
    await fork.begin();

    try {
      const coupon = await fork.findOne(
        Coupon,
        { code: dto.couponCode },
        {
          lockMode: LockMode.PESSIMISTIC_WRITE,
        },
      );

      if (!coupon) {
        throw new NotFoundException(`Coupon ${dto.couponCode} was not found.`);
      }

      if (coupon.used) {
        throw new BadRequestException('Coupon was already used.');
      }

      const totalAmount = dto.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );

      const order = fork.create(Order, {
        customerName: dto.order.customerName,
        status: 'CREATED',
        totalAmount,
        coupon,
      });

      const items = dto.items.map((item) =>
        fork.create(OrderItem, {
          order,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.quantity * item.unitPrice,
        }),
      );

      const audit = fork.create(OrderAudit, {
        order,
        action: 'ORDER_CREATED',
        note: 'Order transaction simulation started',
      });

      coupon.used = true;
      fork.persist([order, ...items, coupon, audit]);
      await fork.flush();

      if (dto.simulation?.shouldFail) {
        throw new Error('Triggering forced rollback!');
      }

      if (dto.simulation?.noCommit) {
        this.logger.warn(
          `Transaction left open intentionally for order ${order.id}.`,
        );
        return {
          status: 'Pending - No Commit',
          orderId: order.id,
          message:
            'Transaction has been flushed but intentionally not committed.',
        };
      }

      await fork.commit();

      return {
        status: 'Success',
        orderId: order.id,
      };
    } catch (error) {
      await fork.rollback();
      throw error;
    }
  }
}
