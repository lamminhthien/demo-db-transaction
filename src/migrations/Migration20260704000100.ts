import { Migration } from '@mikro-orm/migrations';

export class Migration20260704000100 extends Migration {
  override up(): void {
    this.addSql(`create table "coupons" (
      "id" serial primary key,
      "code" varchar(80) not null,
      "used" boolean not null default false,
      "discount_percent" int not null default 0,
      "created_at" timestamptz not null
    );`);

    this.addSql(
      'alter table "coupons" add constraint "coupons_code_unique" unique ("code");',
    );

    this.addSql(`create table "orders" (
      "id" serial primary key,
      "customer_name" varchar(255) not null,
      "status" varchar(50) not null default 'CREATED',
      "total_amount" numeric(12,2) not null,
      "coupon_id" int null,
      "created_at" timestamptz not null
    );`);

    this.addSql(
      'alter table "orders" add constraint "orders_coupon_id_foreign" foreign key ("coupon_id") references "coupons" ("id") on update cascade on delete set null;',
    );

    this.addSql(`create table "order_items" (
      "id" serial primary key,
      "order_id" int not null,
      "sku" varchar(120) not null,
      "quantity" int not null,
      "unit_price" numeric(12,2) not null,
      "line_total" numeric(12,2) not null
    );`);

    this.addSql(
      'alter table "order_items" add constraint "order_items_order_id_foreign" foreign key ("order_id") references "orders" ("id") on update cascade;',
    );

    this.addSql(`create table "order_audits" (
      "id" serial primary key,
      "order_id" int not null,
      "action" varchar(80) not null,
      "note" varchar(500) null,
      "created_at" timestamptz not null
    );`);

    this.addSql(
      'alter table "order_audits" add constraint "order_audits_order_id_foreign" foreign key ("order_id") references "orders" ("id") on update cascade;',
    );
  }

  override down(): void {
    this.addSql('drop table if exists "order_audits" cascade;');
    this.addSql('drop table if exists "order_items" cascade;');
    this.addSql('drop table if exists "orders" cascade;');
    this.addSql('drop table if exists "coupons" cascade;');
  }
}
