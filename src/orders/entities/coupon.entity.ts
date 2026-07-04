import {
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Order } from './order.entity';

@Entity({ tableName: 'coupons' })
export class Coupon {
  @PrimaryKey()
  id!: number;

  @Property({ length: 80, unique: true })
  code!: string;

  @Property({ default: false })
  used = false;

  @Property({ type: 'integer', default: 0 })
  discountPercent = 0;

  @OneToMany(() => Order, (order) => order.coupon)
  orders = new Collection<Order>(this);

  @Property({ onCreate: () => new Date() })
  createdAt?: Date = new Date();
}
