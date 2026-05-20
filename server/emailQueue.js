/**
 * emailQueue.js
 *
 * Offline-capable email queue.
 * – Emails are serialised to server/data/queue.json immediately.
 * – A background worker checks internet connectivity every 30 seconds.
 * – When online, it drains the queue via nodemailer (SMTP from .env).
 * – Individual failures are retried on the next cycle (up to MAX_RETRIES).
 */

import nodemailer from 'nodemailer'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createConnection } from 'net'
import 'dotenv/config'

const __dirname  = dirname(fileURLToPath(import.meta.url))
const QUEUE_FILE = join(__dirname, 'data', 'queue.json')
const MAX_RETRIES = 5
const CHECK_INTERVAL_MS = 30_000  // 30 seconds

// ─── Queue persistence ────────────────────────────────────────────────────────

function readQueue () {
  if (!existsSync(QUEUE_FILE)) return []
  try { return JSON.parse(readFileSync(QUEUE_FILE, 'utf8')) } catch { return [] }
}

function writeQueue (queue) {
  writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))
}

// ─── Connectivity check ───────────────────────────────────────────────────────
// Uses a TCP connection to 1.1.1.1:53 — works even without DNS.
function isOnline () {
  return new Promise((resolve) => {
    const socket = createConnection({ host: '1.1.1.1', port: 53 }, () => {
      socket.destroy()
      resolve(true)
    })
    socket.setTimeout(3000)
    socket.on('timeout', () => { socket.destroy(); resolve(false) })
    socket.on('error',   () => { socket.destroy(); resolve(false) })
  })
}

// ─── Nodemailer transport ─────────────────────────────────────────────────────

function createTransport () {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn('[email] SMTP not configured — emails will queue but not send until .env is set up.')
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

// ─── Send a single queued item ────────────────────────────────────────────────

async function sendItem (transport, item) {
  const from    = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@innovadef.es'
  const subject = `Tu informe de INNOVADEF FOCO 2026 — ${item.moduleTitle}`
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#070707;color:#fff;font-family:Arial,sans-serif;padding:32px;">
  <div style="max-width:560px;margin:0 auto;">
    <h1 style="color:#00FF41;font-size:22px;margin-bottom:4px;">INNOVADEF FOCO 2026</h1>
    <p style="color:#9CA3AF;font-size:13px;margin-top:0;">Informe de participante — ${item.moduleTitle}</p>
    <hr style="border-color:#1f1f1f;margin:20px 0;">
    <p style="font-size:15px;">Adjunto encontrarás tu informe personalizado de participación en <strong>${item.moduleTitle}</strong>.</p>
    <p style="font-size:13px;color:#9CA3AF;">Este informe ha sido generado automáticamente por el sistema de evaluación de INNOVADEF.</p>
    <hr style="border-color:#1f1f1f;margin:20px 0;">
    <p style="font-size:12px;color:#4B5563;">
      23 de Junio 2026 · EOI Madrid · Av. de Gregorio del Amo, 6<br>
      <a href="https://innovadef.es" style="color:#00FF41;">innovadef.es</a>
    </p>
    <p style="font-size:10px;color:#374151;">Pumpun Dixital S.L. — Documento confidencial generado automáticamente.</p>
  </div>
</body>
</html>`

  await transport.sendMail({
    from,
    to: item.to,
    subject,
    html,
    attachments: [
      {
        filename: `informe-innovadef-${item.reportId}.pdf`,
        path:     item.pdfPath,
        contentType: 'application/pdf',
      },
    ],
  })
}

// ─── Queue drain worker ───────────────────────────────────────────────────────

async function drainQueue () {
  const queue = readQueue()
  if (queue.length === 0) return

  const online = await isOnline()
  if (!online) {
    console.log(`[email] Offline — ${queue.length} item(s) in queue, will retry in ${CHECK_INTERVAL_MS / 1000}s`)
    return
  }

  const transport = createTransport()
  if (!transport) return  // SMTP not configured

  console.log(`[email] Online — draining ${queue.length} queued email(s)…`)

  const remaining = []

  for (const item of queue) {
    try {
      await sendItem(transport, item)
      console.log(`[email] ✓ Sent to ${item.to} (report ${item.reportId})`)
      // Success — drop from queue
    } catch (err) {
      const retries = (item.retries || 0) + 1
      if (retries >= MAX_RETRIES) {
        console.error(`[email] ✗ Giving up on ${item.to} after ${retries} attempts: ${err.message}`)
      } else {
        console.warn(`[email] ✗ Failed for ${item.to} (attempt ${retries}): ${err.message}`)
        remaining.push({ ...item, retries, lastError: err.message, lastAttempt: new Date().toISOString() })
      }
    }
  }

  writeQueue(remaining)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Add an email to the queue. Immediately tries to send if online,
 * otherwise saves to disk for later delivery.
 */
export async function queueEmail ({ to, reportId, moduleTitle, pdfPath }) {
  const queue = readQueue()
  const item  = { to, reportId, moduleTitle, pdfPath, retries: 0, queuedAt: new Date().toISOString() }
  queue.push(item)
  writeQueue(queue)
  console.log(`[email] Queued email to ${to} (report ${reportId})`)

  // Try an immediate send (async — don't block the HTTP response)
  drainQueue().catch(err => console.error('[email] drain error:', err))
}

/**
 * Returns queue statistics for the /api/status endpoint.
 */
export async function getQueueStatus () {
  const queue = readQueue()
  return {
    pending:  queue.length,
    items:    queue.map(({ to, reportId, retries, queuedAt }) => ({ to, reportId, retries, queuedAt })),
    smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  }
}

// ─── Start background worker ──────────────────────────────────────────────────
// Starts automatically when this module is imported.
setInterval(() => {
  drainQueue().catch(err => console.error('[email] background drain error:', err))
}, CHECK_INTERVAL_MS)

console.log(`[email] Queue worker started — checking every ${CHECK_INTERVAL_MS / 1000}s`)
