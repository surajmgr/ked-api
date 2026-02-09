import { pgTable, text, boolean, integer, index, uniqueIndex, char, jsonb } from 'drizzle-orm/pg-core';
import { cuid2 } from 'drizzle-cuid2/postgres';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  accessLevelEnum,
  billingIntervalEnum,
  orderStatusEnum,
  paymentProviderEnum,
  paymentStatusEnum,
  productTypeEnum,
  refundStatusEnum,
  resourceTypeEnum,
  subscriptionStatusEnum,
} from './enums';
import { nullableTimestampMs, timestampMs } from './utils';

// ==================== Products ====================
// Canonical sellable items (one-time purchases or subscriptions).
export const products = pgTable(
  'products',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    productType: productTypeEnum('product_type').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdBy: text('created_by').notNull(),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [
    index('idx_products_active').on(table.isActive),
    index('idx_products_type').on(table.productType),
    index('idx_products_created_by').on(table.createdBy),
    index('idx_products_slug').on(table.slug),
  ],
);

export const selectProductSchema = createSelectSchema(products);
export const insertProductSchema = createInsertSchema(products, {
  slug: (s) => s.min(1).max(255),
  name: (s) => s.min(1).max(255),
  description: (s) => s.max(4000).optional(),
  metadata: () => z.record(z.string(), z.unknown()).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateProductSchema = insertProductSchema.partial();

// ==================== Product Prices ====================
// Price points per product. For ONE_TIME products, interval fields are null.
export const productPrices = pgTable(
  'product_prices',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    currency: char('currency', { length: 3 }).notNull().default('USD'),
    unitAmountCents: integer('unit_amount_cents').notNull(),
    billingInterval: billingIntervalEnum('billing_interval'),
    intervalCount: integer('interval_count'),
    isActive: boolean('is_active').notNull().default(true),
    providerPriceId: text('provider_price_id'),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [
    index('idx_product_prices_product').on(table.productId),
    index('idx_product_prices_active').on(table.isActive),
    index('idx_product_prices_currency').on(table.currency),
    index('idx_product_prices_provider').on(table.providerPriceId),
    uniqueIndex('idx_product_prices_unique').on(
      table.productId,
      table.currency,
      table.unitAmountCents,
      table.billingInterval,
      table.intervalCount,
    ),
  ],
);

export const selectProductPriceSchema = createSelectSchema(productPrices);
export const insertProductPriceSchema = createInsertSchema(productPrices, {
  unitAmountCents: (s) => s.int().min(0),
  intervalCount: (s) => s.int().min(1).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateProductPriceSchema = insertProductPriceSchema.partial();

// ==================== Product → Content Grants ====================
// What access a product grants (polymorphic reference via resourceType/resourceId).
export const productContentGrants = pgTable(
  'product_content_grants',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    resourceType: resourceTypeEnum('resource_type').notNull(),
    resourceId: text('resource_id').notNull(),
    accessLevel: accessLevelEnum('access_level').notNull().default('PAID'),
    createdAt: timestampMs('created_at'),
  },
  (table) => [
    uniqueIndex('idx_product_content_grants_unique').on(table.productId, table.resourceType, table.resourceId),
    index('idx_product_content_grants_product').on(table.productId),
    index('idx_product_content_grants_resource').on(table.resourceType, table.resourceId),
  ],
);

export const selectProductContentGrantSchema = createSelectSchema(productContentGrants);
export const insertProductContentGrantSchema = createInsertSchema(productContentGrants).omit({
  id: true,
  createdAt: true,
});

// ==================== Orders ====================
export const orders = pgTable(
  'orders',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    status: orderStatusEnum('status').notNull().default('DRAFT'),
    currency: char('currency', { length: 3 }).notNull().default('USD'),
    subtotalCents: integer('subtotal_cents').notNull().default(0),
    taxCents: integer('tax_cents').notNull().default(0),
    discountCents: integer('discount_cents').notNull().default(0),
    totalCents: integer('total_cents').notNull().default(0),
    providerCheckoutId: text('provider_checkout_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [
    index('idx_orders_user').on(table.userId),
    index('idx_orders_status').on(table.status),
    index('idx_orders_user_status').on(table.userId, table.status),
    index('idx_orders_created').on(table.createdAt),
    index('idx_orders_provider_checkout').on(table.providerCheckoutId),
  ],
);

export const selectOrderSchema = createSelectSchema(orders);
export const insertOrderSchema = createInsertSchema(orders, {
  subtotalCents: (s) => s.int().min(0),
  taxCents: (s) => s.int().min(0),
  discountCents: (s) => s.int().min(0),
  totalCents: (s) => s.int().min(0),
  metadata: () => z.record(z.string(), z.unknown()).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateOrderSchema = insertOrderSchema.partial();

// ==================== Order Items ====================
export const orderItems = pgTable(
  'order_items',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    priceId: text('price_id').references(() => productPrices.id, { onDelete: 'set null' }),
    quantity: integer('quantity').notNull().default(1),
    unitAmountCents: integer('unit_amount_cents').notNull(),
    totalAmountCents: integer('total_amount_cents').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestampMs('created_at'),
  },
  (table) => [
    index('idx_order_items_order').on(table.orderId),
    index('idx_order_items_product').on(table.productId),
    index('idx_order_items_price').on(table.priceId),
    uniqueIndex('idx_order_items_unique').on(table.orderId, table.productId, table.priceId),
  ],
);

export const selectOrderItemSchema = createSelectSchema(orderItems);
export const insertOrderItemSchema = createInsertSchema(orderItems, {
  quantity: (s) => s.int().min(1),
  unitAmountCents: (s) => s.int().min(0),
  totalAmountCents: (s) => s.int().min(0),
  metadata: () => z.record(z.string(), z.unknown()).optional(),
}).omit({ id: true, createdAt: true });

// ==================== Payments ====================
export const payments = pgTable(
  'payments',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    provider: paymentProviderEnum('provider').notNull(),
    providerPaymentId: text('provider_payment_id'),
    status: paymentStatusEnum('status').notNull(),
    amountCents: integer('amount_cents').notNull(),
    currency: char('currency', { length: 3 }).notNull().default('USD'),
    paidAt: nullableTimestampMs('paid_at'),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [
    index('idx_payments_order').on(table.orderId),
    index('idx_payments_status').on(table.status),
    index('idx_payments_provider').on(table.provider),
    index('idx_payments_provider_id').on(table.providerPaymentId),
    index('idx_payments_created').on(table.createdAt),
  ],
);

export const selectPaymentSchema = createSelectSchema(payments);
export const insertPaymentSchema = createInsertSchema(payments, {
  amountCents: (s) => s.int().min(0),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updatePaymentSchema = insertPaymentSchema.partial();

// ==================== Refunds ====================
export const refunds = pgTable(
  'refunds',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    paymentId: text('payment_id')
      .notNull()
      .references(() => payments.id, { onDelete: 'cascade' }),
    providerRefundId: text('provider_refund_id'),
    status: refundStatusEnum('status').notNull().default('PENDING'),
    amountCents: integer('amount_cents').notNull(),
    createdAt: timestampMs('created_at'),
  },
  (table) => [
    index('idx_refunds_payment').on(table.paymentId),
    index('idx_refunds_status').on(table.status),
    index('idx_refunds_provider_id').on(table.providerRefundId),
  ],
);

export const selectRefundSchema = createSelectSchema(refunds);
export const insertRefundSchema = createInsertSchema(refunds, {
  amountCents: (s) => s.int().min(0),
}).omit({ id: true, createdAt: true });

// ==================== Subscriptions ====================
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    priceId: text('price_id').references(() => productPrices.id, { onDelete: 'set null' }),
    provider: paymentProviderEnum('provider').notNull(),
    providerCustomerId: text('provider_customer_id'),
    providerSubscriptionId: text('provider_subscription_id'),
    status: subscriptionStatusEnum('status').notNull(),
    currentPeriodStart: nullableTimestampMs('current_period_start'),
    currentPeriodEnd: nullableTimestampMs('current_period_end'),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    canceledAt: nullableTimestampMs('canceled_at'),
    endedAt: nullableTimestampMs('ended_at'),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [
    index('idx_subscriptions_user').on(table.userId),
    index('idx_subscriptions_status').on(table.status),
    index('idx_subscriptions_user_status').on(table.userId, table.status),
    index('idx_subscriptions_provider_sub').on(table.providerSubscriptionId),
  ],
);

export const selectSubscriptionSchema = createSelectSchema(subscriptions);
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateSubscriptionSchema = insertSubscriptionSchema.partial();

// ==================== Entitlements ====================
// Canonical access grants used by the API to authorize viewing/downloading.
export const entitlements = pgTable(
  'entitlements',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    resourceType: resourceTypeEnum('resource_type').notNull(),
    resourceId: text('resource_id').notNull(),
    accessLevel: accessLevelEnum('access_level').notNull(),
    source: text('source').notNull(), // 'ORDER' | 'SUBSCRIPTION' | 'ADMIN_GRANT' | ...
    orderItemId: text('order_item_id').references(() => orderItems.id, { onDelete: 'set null' }),
    subscriptionId: text('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
    startsAt: nullableTimestampMs('starts_at'),
    expiresAt: nullableTimestampMs('expires_at'),
    createdAt: timestampMs('created_at'),
  },
  (table) => [
    uniqueIndex('idx_entitlements_unique').on(table.userId, table.resourceType, table.resourceId, table.accessLevel),
    index('idx_entitlements_user').on(table.userId),
    index('idx_entitlements_resource').on(table.resourceType, table.resourceId),
    index('idx_entitlements_expires').on(table.expiresAt),
    index('idx_entitlements_order_item').on(table.orderItemId),
    index('idx_entitlements_subscription').on(table.subscriptionId),
  ],
);

export const selectEntitlementSchema = createSelectSchema(entitlements);
export const insertEntitlementSchema = createInsertSchema(entitlements, {
  source: (s) => s.min(1).max(50),
}).omit({ id: true, createdAt: true });
