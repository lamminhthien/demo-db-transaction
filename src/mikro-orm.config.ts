import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { Coupon, Order, OrderAudit, OrderItem } from './orders/entities';

const mikroOrmConfig = defineConfig({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  dbName: process.env.DB_NAME ?? 'demo_tx',
  entities: [Order, OrderItem, Coupon, OrderAudit],
  debug: process.env.DB_DEBUG === 'true',
  extensions: [Migrator],
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
    tableName: 'mikro_orm_migrations',
  },
  connect: process.env.DB_CONNECT !== 'false',
});

export default mikroOrmConfig;
