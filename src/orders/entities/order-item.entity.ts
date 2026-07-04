import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Order } from './order.entity';

@Entity({ tableName: 'order_items' })
export class OrderItem {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Order)
  order!: Order;

  @Property({ length: 120 })
  sku!: string;

  @Property({ type: 'integer' })
  quantity!: number;

  @Property({ type: 'numeric', precision: 12, scale: 2 })
  unitPrice!: number;

  @Property({ type: 'numeric', precision: 12, scale: 2 })
  lineTotal!: number;
}
