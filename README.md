# Demo DB Transaction (NestJS + MikroORM)

This project demonstrates a transaction simulator using a forked MikroORM `EntityManager`.
It is designed to help you visualize `BEGIN`, `FLUSH`, `COMMIT`, and `ROLLBACK` behavior in PostgreSQL.

## 1. Scaffold Commands (Tutorial)

These are the Nest CLI commands used to create the feature structure:

```bash
nest g module orders
nest g controller orders
nest g service orders
```

`OrdersModule` registers entities with `MikroOrmModule.forFeature([Order, OrderItem, Coupon, OrderAudit])`.

## 2. Start PostgreSQL with Docker

```bash
cp .env.example .env
docker compose up -d
```

The default DB settings are:

- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `postgres`
- Database: `demo_tx`

## 3. Install and Run

```bash
npm install
npm run migration:up
npm run start:dev
```

## 4. Transaction Simulation Flow

In `OrdersService.createOrderSimulation`:

1. `em.fork()` creates an isolated unit of work.
2. `fork.begin()` explicitly starts a transaction.
3. Business operations create `Order`, `OrderItem`, update `Coupon`, create `OrderAudit`.
4. `fork.flush()` sends SQL to PostgreSQL.
5. Conditional behavior:
   - `simulation.shouldFail = true` throws and triggers rollback.
   - `simulation.noCommit = true` intentionally leaves transaction open.
6. `fork.commit()` finalizes changes.
7. Any error path executes `fork.rollback()`.

## 5. API Endpoints

Create coupon for testing:

```bash
curl -X POST http://localhost:3000/orders/coupons/SUMMER10 \
  -H "Content-Type: application/json" \
  -d '{"discountPercent":10}'
```

Run successful simulation:

```bash
curl -X POST http://localhost:3000/orders/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "order": { "customerName": "Alice" },
    "items": [
      { "sku": "SKU-001", "quantity": 2, "unitPrice": 50 }
    ]
  }'
```

Run simulation with coupon (optional field):

```bash
curl -X POST http://localhost:3000/orders/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "order": { "customerName": "Alice" },
    "items": [
      { "sku": "SKU-001", "quantity": 2, "unitPrice": 50 }
    ],
    "couponCode": "SUMMER10"
  }'
```

Force rollback:

```bash
curl -X POST http://localhost:3000/orders/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "order": { "customerName": "Bob" },
    "items": [
      { "sku": "SKU-002", "quantity": 1, "unitPrice": 70 }
    ],
    "couponCode": "SUMMER10",
    "simulation": { "shouldFail": true }
  }'
```

Leave transaction open (no commit):

```bash
curl -X POST http://localhost:3000/orders/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "order": { "customerName": "Charlie" },
    "items": [
      { "sku": "SKU-003", "quantity": 3, "unitPrice": 40 }
    ],
    "couponCode": "SUMMER10",
    "simulation": { "noCommit": true }
  }'
```

Fetch discount list:

```bash
curl http://localhost:3000/orders/discounts
```

Fetch order list:

```bash
curl http://localhost:3000/orders
```

Fetch one order by id:

```bash
curl http://localhost:3000/orders/101
```

## 6. Verify in PostgreSQL UI

In pgAdmin or TablePlus, run:

```sql
SELECT pid, state, query, xact_start
FROM pg_stat_activity
WHERE state = 'idle in transaction';
```

You should see the session that is holding transaction state and row-level locks.

## 7. Migration Files

Initial migration file:

- `src/migrations/Migration20260704000100.ts`

Useful commands:

```bash
npm run migration:create
npm run migration:up
npm run migration:down
```

## 8. Transaction Method Summary

| Method | Purpose |
| --- | --- |
| `em.fork()` | Creates an isolated EM context for a request/transaction. |
| `fork.begin()` | Starts a PostgreSQL transaction block (`BEGIN`). |
| `fork.flush()` | Computes UoW changes and sends SQL (`INSERT/UPDATE`). |
| `fork.commit()` | Persists changes permanently (`COMMIT`). |
| `fork.rollback()` | Aborts all uncommitted changes (`ROLLBACK`). |
