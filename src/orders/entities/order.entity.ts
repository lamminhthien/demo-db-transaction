import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Coupon } from './coupon.entity';
import { OrderAudit } from './order-audit.entity';
import { OrderItem } from './order-item.entity';

@Entity({ tableName: 'orders' })
export class Order {
  @PrimaryKey()
  id!: number;

  @Property({ length: 255 })
  customerName!: string;

  @Property({ length: 50, default: 'CREATED' })
  status = 'CREATED';

  @Property({ type: 'numeric', precision: 12, scale: 2 })
  totalAmount!: number;

  @ManyToOne(() => Coupon, { nullable: true })
  coupon?: Coupon;

  @OneToMany(() => OrderItem, (item) => item.order)
  items = new Collection<OrderItem>(this);

  @OneToMany(() => OrderAudit, (audit) => audit.order)
  audits = new Collection<OrderAudit>(this);

  @Property({ onCreate: () => new Date() })
  createdAt?: Date = new Date();
}
