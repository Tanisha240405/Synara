import { pgTable, text, timestamp, uuid, boolean, integer, decimal, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password'),
  image: text('image'),
  companyName: text('company_name'),
  role: text('role'),
  industrySegment: text('industry_segment'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  channelPreference: text('channel_preference').default('email'),
  tier: text('tier').default('regular'),
  tags: text('tags').array(),
  totalOrders: integer('total_orders').default(0),
  totalSpend: decimal('total_spend', { precision: 10, scale: 2 }).default('0'),
  ltv: decimal('ltv', { precision: 10, scale: 2 }).default('0'),
  lastPurchaseAt: timestamp('last_purchase_at'),
  lastEngagedAt: timestamp('last_engaged_at'),
  churnRisk: decimal('churn_risk', { precision: 5, scale: 2 }).default('0'),
  city: text('city'),
  isMockData: boolean('is_mock_data').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  items: jsonb('items').notNull().default([]),
  status: text('status').default('completed'),
  isMockData: boolean('is_mock_data').default(false),
  orderedAt: timestamp('ordered_at').notNull().defaultNow(),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  industrySegment: text('industry_segment'),
  isMockData: boolean('is_mock_data').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const segments = pgTable('segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  naturalLanguageQuery: text('natural_language_query'),
  filterJson: jsonb('filter_json').notNull().default({}),
  sqlWhere: text('sql_where').default('1=1'),
  customerCount: integer('customer_count').default(0),
  isAiGenerated: boolean('is_ai_generated').default(false),
  aiConfidence: decimal('ai_confidence', { precision: 5, scale: 2 }).default('0'),
  isMockData: boolean('is_mock_data').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  segmentId: uuid('segment_id').references(() => segments.id),
  productId: uuid('product_id').references(() => products.id),
  channel: text('channel').notNull(),
  messageTemplate: text('message_template').notNull(),
  status: text('status').default('draft'),
  scheduledAt: timestamp('scheduled_at'),
  sentAt: timestamp('sent_at'),
  completedAt: timestamp('completed_at'),
  totalRecipients: integer('total_recipients').default(0),
  isMockData: boolean('is_mock_data').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  channel: text('channel').notNull(),
  content: text('content').notNull(),
  status: text('status').default('queued'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  eventType: text('event_type').notNull(),
  channel: text('channel').notNull(),
  metadata: jsonb('metadata').default({}),
  receivedAt: timestamp('received_at').notNull().defaultNow(),
});

export const campaignStats = pgTable('campaign_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }).unique(),
  totalSent: integer('total_sent').default(0),
  totalDelivered: integer('total_delivered').default(0),
  totalFailed: integer('total_failed').default(0),
  totalOpened: integer('total_opened').default(0),
  totalRead: integer('total_read').default(0),
  totalClicked: integer('total_clicked').default(0),
  totalOrderPlaced: integer('total_order_placed').default(0),
  revenueAttributed: decimal('revenue_attributed', { precision: 12, scale: 2 }).default('0'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const aiCallLogs = pgTable('ai_call_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelUsed: text('model_used').notNull(),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  durationMs: integer('duration_ms').notNull(),
  calledAt: timestamp('called_at').notNull().defaultNow(),
});

export const autopilotSuggestions = pgTable('autopilot_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  suggestions: jsonb('suggestions').notNull(),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  triggeredBy: text('triggered_by').default('auto'),
  needsRefresh: boolean('needs_refresh').default(false),
});
