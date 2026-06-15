import { relations, sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';

export const info = sqliteTable('info', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull()
});

export const conv = sqliteTable('conv', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  private: integer('private', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull()
});

export const join = sqliteTable('join', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: text('type').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  convId: text('conv_id')
    .notNull()
    .references(() => conv.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  infoId: text('info_id').notNull(),
  banned: integer('banned', { mode: 'boolean' }).default(false),
  banReason: text('ban_reason'),
  banExpires: integer('ban_expires', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull()
});

export const infoRelations = relations(info, ({ many }) => ({
  joins: many(join)
}));

export const convRelations = relations(conv, ({ many }) => ({
  joins: many(join)
}));

export const joinRelations = relations(join, ({ one }) => ({
  user: one(user, {
    fields: [join.userId],
    references: [user.id]
  }),
  conv: one(conv, {
    fields: [join.convId],
    references: [conv.id]
  }),
  info: one(info, {
    fields: [join.infoId],
    references: [info.id]
  })
}));

export const message = sqliteTable('message', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  convId: text('conv_id')
    .notNull()
    .references(() => conv.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  meta: text('meta').notNull(),
  data: text('data').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull()
});

export const messageRelations = relations(message, ({ one }) => ({
  user: one(user, {
    fields: [message.userId],
    references: [user.id]
  }),
  conv: one(conv, {
    fields: [message.convId],
    references: [conv.id]
  })
}));

export * from './auth.schema';
