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

  private mapOrder(order: Order) {
    return {
      id: order.id,
      customerName: order.customerName,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      coupon: order.coupon
        ? {
            id: order.coupon.id,
            code: order.coupon.code,
            discountPercent: order.coupon.discountPercent,
            used: order.coupon.used,
          }
        : null,
      items: order.items.getItems().map((item) => ({
        id: item.id,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
      })),
      audits: order.audits.getItems().map((audit) => ({
        id: audit.id,
        action: audit.action,
        note: audit.note ?? null,
        createdAt: audit.createdAt ?? null,
      })),
      createdAt: order.createdAt ?? null,
    };
  }

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
      let coupon: Coupon | null = null;

      if (dto.couponCode) {
        coupon = await fork.findOne(
          Coupon,
          { code: dto.couponCode },
          {
            lockMode: LockMode.PESSIMISTIC_WRITE,
          },
        );

        if (!coupon) {
          throw new NotFoundException(
            `Coupon ${dto.couponCode} was not found.`,
          );
        }

        if (coupon.used) {
          throw new BadRequestException('Coupon was already used.');
        }
      }

      const totalAmount = dto.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );

      const order = fork.create(Order, {
        customerName: dto.order.customerName,
        status: 'CREATED',
        totalAmount,
        coupon: coupon ?? undefined,
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

      if (coupon) {
        coupon.used = true;
      }

      fork.persist(
        coupon ? [order, ...items, coupon, audit] : [order, ...items, audit],
      );
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
        couponCode: coupon?.code ?? null,
      };
    } catch (error) {
      await fork.rollback();
      throw error;
    }
  }

  async getDiscountList() {
    const coupons = await this.em.find(
      Coupon,
      {},
      {
        orderBy: { createdAt: 'DESC' },
      },
    );

    return coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      used: coupon.used,
      createdAt: coupon.createdAt ?? null,
    }));
  }

  async getOrders() {
    const orders = await this.em.find(
      Order,
      {},
      {
        populate: ['items', 'coupon', 'audits'],
        orderBy: { createdAt: 'DESC' },
      },
    );

    return orders.map((order) => this.mapOrder(order));
  }

  async getOrderById(id: number) {
    const order = await this.em.findOne(
      Order,
      { id },
      { populate: ['items', 'coupon', 'audits'] },
    );

    if (!order) {
      throw new NotFoundException(`Order ${id} was not found.`);
    }

    return this.mapOrder(order);
  }
}
