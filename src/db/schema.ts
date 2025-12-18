import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').notNull(),
  value: text('value'),
}, (t) => ({ pk: primaryKey({ columns: [t.key] }) }));

export const leads = sqliteTable('leads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  externalId: text('external_id'),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  timezone: text('timezone'),
  source: text('source'),
  stage: text('stage').notNull().default('New'),
  waNumber: text('wa_number'),
  calendlyUtm: text('calendly_utm'),
  lastContactMethod: text('last_contact_method'),
  lastContactAt: integer('last_contact_at', { mode: 'timestamp' }),
  nextAction: text('next_action'),
  nextActionAt: integer('next_action_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  leadId: integer('lead_id').notNull().references(() => leads.id),
  type: text('type').notNull(), // call/email/wa/meeting
  notes: text('notes'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

export const followups = sqliteTable('followups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  leadId: integer('lead_id').notNull().references(() => leads.id),
  type: text('type').notNull(), // wa/email/call
  dueAt: integer('due_at', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('pending'), // pending/done
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

export const appointments = sqliteTable('appointments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  leadId: integer('lead_id').references(() => leads.id),
  calendlyId: text('calendly_id'),
  start: integer('start', { mode: 'timestamp' }),
  end: integer('end', { mode: 'timestamp' }),
  status: text('status').default('Scheduled'), // Scheduled, Canceled, No-Show, Completed
  closerName: text('closer_name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

export const messageTemplates = sqliteTable('message_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull(), // e.g., noanswer_day0, noanswer_day2
  title: text('title').notNull(),
  body: text('body').notNull(),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});
