/**
 * db.js — Database abstraction layer
 *
 * Uses MariaDB/MySQL when DATABASE_URL is set (production),
 * falls back to SQLite automatically (dev / no DB configured).
 *
 * All timestamps are stored as Unix milliseconds (bigint) — completely
 * timezone-independent. Use new Date(row.created_at) to display them.
 */

import knex from 'knex'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

function createDb() {
  if (process.env.DATABASE_URL) {
    console.log('[db] Using MariaDB/MySQL:', process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@'))
    return knex({
      client: 'mysql2',
      connection: process.env.DATABASE_URL,
      pool: { min: 2, max: 10 },
    })
  }

  const dataDir = join(__dirname, 'data')
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
  const file = join(dataDir, 'innovadef.db')
  console.log('[db] Using SQLite fallback:', file)
  return knex({
    client: 'better-sqlite3',
    connection: { filename: file },
    useNullAsDefault: true,
  })
}

export const db = createDb()

// ─── Migrations ──────────────────────────────────────────────────────────────
// Run on startup — idempotent (only creates tables if they don't exist).

export async function runMigrations() {
  // sessions — one row per completed module evaluation
  await db.schema.hasTable('sessions').then(async (exists) => {
    if (exists) return
    await db.schema.createTable('sessions', (t) => {
      t.string('id').primary()           // FOCO-xxxxx (from frontend)
      t.string('module_id').notNullable()
      t.string('module_title')
      t.string('email')                  // nullable — filled when user submits email
      t.json('result')                   // full result payload
      t.bigInteger('created_at')         // Unix ms — timezone-independent
    })
    console.log('[db] Created table: sessions')
  })

  // pulse_answers — one row per question per respondent
  await db.schema.hasTable('pulse_answers').then(async (exists) => {
    if (exists) return
    await db.schema.createTable('pulse_answers', (t) => {
      t.increments('id')
      t.string('session_id')             // nullable — anonymous if not linked
      t.string('question_id').notNullable()
      t.integer('answer_index').notNullable()
      t.bigInteger('created_at')         // Unix ms — timezone-independent
    })
    console.log('[db] Created table: pulse_answers')
  })

  // report_tokens — opaque tokens for QR (temporary) and email (permanent)
  await db.schema.hasTable('report_tokens').then(async (exists) => {
    if (exists) return
    await db.schema.createTable('report_tokens', (t) => {
      t.string('token').primary()        // random opaque string
      t.string('session_id').notNullable()
      t.bigInteger('expires_at')         // Unix ms, null = permanent
      t.bigInteger('created_at')         // Unix ms — timezone-independent
    })
    console.log('[db] Created table: report_tokens')
  })

  console.log('[db] Migrations OK')
}