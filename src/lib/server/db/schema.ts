import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const paste = sqliteTable(
	'paste',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		title: text('title'),
		content: text('content').notNull(),
		contentIv: text('content_iv'),
		language: text('language').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
		onetime: integer('onetime', { mode: 'boolean' }).notNull().default(false),
		consumedAt: integer('consumed_at', { mode: 'timestamp' }),
		passwordHash: text('password_hash'),
		passwordSalt: text('password_salt')
	},
	(table) => ({
		expiresAtIdx: index('paste_expires_at_idx').on(table.expiresAt)
	})
);
