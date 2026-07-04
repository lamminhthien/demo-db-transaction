import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Order } from './order.entity';

@Entity({ tableName: 'order_audits' })
export class OrderAudit {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Order)
  order!: Order;

  @Property({ length: 80 })
  action!: string;

  @Property({ nullable: true, length: 500 })
  note?: string;

  @Property({ onCreate: () => new Date() })
  createdAt?: Date = new Date();
}
