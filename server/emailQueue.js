/**
 * emailQueue.js
 *
 * Offline-capable email queue backed by the DB (email_queue table).
 * – Emails are inserted into the DB immediately (sent = false).
 * – A background worker checks connectivity every 30 seconds.
 * – When online, it drains pending rows via nodemailer (SMTP from .env).
 * – Failures increment retries; after MAX_RETRIES the row is abandoned.
 */

import nodemailer from 'nodemailer'
import QRCode from 'qrcode'
import { createConnection } from 'net'
import { db } from './db.js'
import 'dotenv/config'

const MAX_RETRIES       = 5
const CHECK_INTERVAL_MS = 30_000

// ─── Connectivity check ───────────────────────────────────────────────────────
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
    console.warn('[email] SMTP not configured — emails queued but not sent until .env is set up.')
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

// ─── Send a single queue row ──────────────────────────────────────────────────
async function sendItem (transport, item) {
  const from    = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@innovadef.es'
  const subject = `Tu informe de INNOVADEF FOCO 2026 — ${item.module_title}`

  const qrBuffer = item.report_url
    ? await QRCode.toBuffer(item.report_url, { width: 200, margin: 2, color: { dark: '#000000', light: '#ffffff' } }).catch(() => null)
    : null

  const reportLinkBlock = item.report_url
    ? `<div style="margin:24px 0;text-align:center;">
        ${qrBuffer ? '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;"><tr><td align="center"><img src="cid:qrcode" width="160" alt="QR informe"></td></tr></table>' : ''}
        <a href="${item.report_url}"
           style="display:inline-block;padding:12px 24px;background:#00FF41;color:#070707;font-weight:bold;font-size:14px;text-decoration:none;border-radius:4px;letter-spacing:1px;">
          VER INFORME ONLINE
        </a>
        <p style="font-size:11px;color:#4B5563;margin-top:8px;">
          Enlace permanente: <a href="${item.report_url}" style="color:#9CA3AF;">${item.report_url}</a>
        </p>
      </div>`
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#070707;color:#fff;font-family:Arial,sans-serif;padding:32px;">
  <div style="max-width:560px;margin:0 auto;">
    <h1 style="color:#00FF41;font-size:22px;margin-bottom:4px;">INNOVADEF FOCO 2026</h1>
    <p style="color:#9CA3AF;font-size:13px;margin-top:0;">Informe de participante — ${item.module_title}</p>
    <hr style="border-color:#1f1f1f;margin:20px 0;">
    <p style="font-size:15px;">Adjunto encontrarás tu informe personalizado de participación en <strong>${item.module_title}</strong>.</p>
    ${reportLinkBlock}
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
    to:      item.to,
    subject,
    html,
    attachments: [
      {
        filename:    `informe-innovadef-${item.report_id}.pdf`,
        path:        item.pdf_path,
        contentType: 'application/pdf',
      },
      ...(qrBuffer ? [{
        filename:    'qr-informe.png',
        content:     qrBuffer,
        contentType: 'image/png',
        cid:         'qrcode',
      }] : []),
    ],
  })
}

// ─── Queue drain worker ───────────────────────────────────────────────────────
async function drainQueue () {
  const pending = await db('email_queue')
    .where({ sent: false })
    .where('retries', '<', MAX_RETRIES)
    .orderBy('created_at', 'asc')

  if (pending.length === 0) return

  const online = await isOnline()
  if (!online) {
    console.log(`[email] Offline — ${pending.length} item(s) pending, retrying in ${CHECK_INTERVAL_MS / 1000}s`)
    return
  }

  const transport = createTransport()
  if (!transport) return

  console.log(`[email] Online — draining ${pending.length} pending email(s)…`)

  for (const item of pending) {
    const now = Date.now()
    try {
      await sendItem(transport, item)
      await db('email_queue').where({ id: item.id }).update({
        sent:         true,
        sent_at:      now,
        last_attempt: now,
        last_error:   null,
      })
      console.log(`[email] ✓ Sent to ${item.to} (report ${item.report_id})`)
    } catch (err) {
      const retries = item.retries + 1
      const abandoned = retries >= MAX_RETRIES
      await db('email_queue').where({ id: item.id }).update({
        retries,
        last_error:   err.message,
        last_attempt: now,
      })
      if (abandoned) {
        console.error(`[email] ✗ Abandoned ${item.to} after ${retries} attempts: ${err.message}`)
      } else {
        console.warn(`[email] ✗ Failed for ${item.to} (attempt ${retries}): ${err.message}`)
      }
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function queueEmail ({ to, reportId, moduleTitle, pdfPath, reportUrl = null }) {
  await db('email_queue').insert({
    to,
    report_id:    reportId,
    module_title: moduleTitle,
    pdf_path:     pdfPath,
    report_url:   reportUrl,
    retries:      0,
    sent:         false,
    created_at:   Date.now(),
  })
  console.log(`[email] Queued email to ${to} (report ${reportId})`)

  // Attempt immediate send — doesn't block the HTTP response
  drainQueue().catch(err => console.error('[email] drain error:', err))
}

export async function getQueueStatus () {
  const [{ total }]   = await db('email_queue').count('* as total')
  const [{ pending }] = await db('email_queue').where({ sent: false }).where('retries', '<', MAX_RETRIES).count('* as pending')
  const [{ sent }]    = await db('email_queue').where({ sent: true }).count('* as sent')
  const [{ failed }]  = await db('email_queue').where('retries', '>=', MAX_RETRIES).where({ sent: false }).count('* as failed')

  return {
    total:         Number(total),
    pending:       Number(pending),
    sent:          Number(sent),
    failed:        Number(failed),
    smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  }
}

// ─── Background worker ────────────────────────────────────────────────────────
setInterval(() => {
  drainQueue().catch(err => console.error('[email] background drain error:', err))
}, CHECK_INTERVAL_MS)

console.log(`[email] Queue worker started (DB-backed) — checking every ${CHECK_INTERVAL_MS / 1000}s`)
