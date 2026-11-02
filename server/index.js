import fetch from 'node-fetch'
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { networkInterfaces } from 'os'
import { v4 as uuidv4 } from 'uuid'
import { WebSocketServer } from 'ws'
import WebSocket from 'ws'
import { generateReport } from './pdfGenerator.js'
import { queueEmail, getQueueStatus } from './emailQueue.js'
import { db, runMigrations } from './db.js'
import { randomBytes, createHmac, timingSafeEqual } from 'crypto'

function generateToken() {
  return randomBytes(24).toString('base64url')
}

async function createToken(sessionId, expiresInMinutes = null) {
  const token = generateToken()
  const expires_at = expiresInMinutes ? Date.now() + expiresInMinutes * 60 * 1000 : null
  await db('report_tokens').insert({ token, session_id: sessionId, expires_at, created_at: Date.now() })
  return token
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR  = join(__dirname, 'data')
const REPORTS_DIR = join(DATA_DIR, 'reports')

// Ensure data dirs exist
;[DATA_DIR, REPORTS_DIR].forEach(d => { if (!existsSync(d)) mkdirSync(d, { recursive: true }) })

// ─── Helpers ────────────────────────────────────────────────────────────────

function getLocalIp () {
  const ifaces = networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return '127.0.0.1'
}

function loadMeta (id) {
  const path = join(REPORTS_DIR, `${id}.json`)
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8'))
}

function saveMeta (id, meta) {
  writeFileSync(join(REPORTS_DIR, `${id}.json`), JSON.stringify(meta, null, 2))
}

// ─── App ────────────────────────────────────────────────────────────────────

const app = express()

// Apache proxies to us from localhost and appends the real client IP to
// X-Forwarded-For. Trust it only from loopback so req.ip is the visitor's IP
// (otherwise every request would share Apache's 127.0.0.1 rate-limit bucket).
app.set('trust proxy', 'loopback')

// ─── Rate limiting (in-memory, per IP) ──────────────────────────────────────
// No extra dependency — a simple fixed-window counter per key.

const _rl = new Map()

/** Counts one hit for `key`; returns true if it went over `max` in the window. */
function overLimit(key, max, windowMs = 60_000) {
  const now = Date.now()
  const entry = _rl.get(key) || { count: 0, resetAt: now + windowMs }
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs }
  entry.count++
  _rl.set(key, entry)
  return entry.count > max
}

function rateLimit(maxPerMinute) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path.split('/')[2] || ''}`
    if (overLimit(key, maxPerMinute)) {
      console.warn(`[rate-limit] ${req.ip} exceeded ${maxPerMinute} req/min on ${req.path}`)
      return res.status(429).json({ error: 'Too many requests — please wait a moment.' })
    }
    next()
  }
}
// Clean up stale entries every 5 min
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of _rl) if (now > v.resetAt) _rl.delete(k)
}, 5 * 60_000)

// ─── CORS ────────────────────────────────────────────────────────────────────
// Production: allow same-origin requests (no Origin header) + explicit allowed origins.
// Development: allow any private/local network origin so --host works.
const IS_DEV = process.env.NODE_ENV !== 'production'
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',').map(s => s.trim()).filter(Boolean)

const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/

/** Explicit whitelist from env, plus any localhost/LAN origin in dev. */
function isAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.includes(origin)) return true
  return IS_DEV && LOCAL_ORIGIN_RE.test(origin)
}

app.use(cors({
  origin: (origin, cb) => {
    // No Origin header = same-origin (production kiosk or server-to-server) → allow
    if (!origin) return cb(null, true)
    // Explicit whitelist from env (e.g. ALLOWED_ORIGINS=https://demos.innovadef.es)
    // In dev, allow any localhost or LAN origin (192.168.x, 10.x, 172.16-31.x)
    if (isAllowedOrigin(origin)) return cb(null, true)
    cb(new Error(`CORS: origin '${origin}' not allowed`))
  },
  credentials: true,
}))

app.use(express.json())

// Serve generated PDFs statically
app.use('/reports', express.static(REPORTS_DIR))

// Serve the built frontend in production (dist/)
// Must come AFTER all /api and /report routes so it doesn't shadow them.
const DIST_DIR = join(__dirname, '..', 'dist')
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  // SPA fallback — any unknown route returns index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/report') || req.path.startsWith('/reports')) return next()
    res.sendFile(join(DIST_DIR, 'index.html'))
  })
  console.log('[static] Serving frontend from dist/')
}

/**
 * POST /api/report
 * Body: { moduleId, moduleTitle, result: { score, classification, ... } }
 * Returns: { id, url, qrUrl }
 */
app.post('/api/report', async (req, res) => {
  try {
    const { moduleId, moduleTitle, result } = req.body
    if (!moduleId || !result) return res.status(400).json({ error: 'moduleId and result required' })

    const id   = uuidv4()
    const ip   = getLocalIp()
    const port = process.env.PORT || 3001
    const url  = `http://${ip}:${port}/reports/${id}.pdf`
    const meta = { id, moduleId, moduleTitle, result, createdAt: new Date().toISOString(), url }

    // Generate PDF
    const pdfPath = join(REPORTS_DIR, `${id}.pdf`)
    await generateReport({ id, moduleId, moduleTitle, result, pdfPath })

    saveMeta(id, meta)

    console.log(`[report] created ${id} for module ${moduleId}`)
    res.json({ id, url, qrUrl: url })
  } catch (err) {
    console.error('[report] error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/report/:id
 * Returns metadata for a report
 */
app.get('/api/report/:id', (req, res) => {
  const meta = loadMeta(req.params.id)
  if (!meta) return res.status(404).json({ error: 'Not found' })
  res.json(meta)
})

/**
 * POST /api/report/:id/email
 * Body: { email }
 * Queues an email with the PDF attached. Works offline — queued emails
 * are sent as soon as internet connectivity is restored.
 */
app.post('/api/report/:id/email', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'email required' })

  const meta = loadMeta(req.params.id)
  if (!meta) return res.status(404).json({ error: 'Report not found' })

  const pdfPath = join(REPORTS_DIR, `${req.params.id}.pdf`)
  if (!existsSync(pdfPath)) return res.status(404).json({ error: 'PDF file not found' })

  await queueEmail({
    to: email,
    reportId: req.params.id,
    moduleTitle: meta.moduleTitle || meta.moduleId,
    pdfPath,
  })

  res.json({ queued: true, message: 'El informe se enviará en cuanto haya conexión a Internet.' })
})

/**
 * GET /api/status
 * Returns server health + queue status + local IP
 */
app.get('/api/status', async (req, res) => {
  const queueStatus = await getQueueStatus()
  res.json({
    ok: true,
    ip: getLocalIp(),
    port: process.env.PORT || 3001,
    queue: queueStatus,
    time: new Date().toISOString(),
  })
})

// ─── AI access tokens ───────────────────────────────────────────────────────
// /api/xai and /ws-tts spend our xAI credit, so they require a short-lived
// token issued by /api/ai-token to an allowed Origin. Tokens are HMAC-signed
// (stateless, no DB table) and carry a per-token usage quota. This doesn't
// stop a determined attacker from minting tokens like a browser would, but it
// caps how much each IP/token can spend and rules out raw curl/wscat abuse.

const AI_TOKEN_TTL_MS = 2 * 60 * 60_000
const AI_TOKEN_SECRET = process.env.AI_TOKEN_SECRET || randomBytes(32).toString('hex')
if (!process.env.AI_TOKEN_SECRET) {
  console.warn('[ai-token] AI_TOKEN_SECRET not set — using a random secret (tokens reset on restart)')
}

const AI_LIMITS = {
  tokensPerIpPerHour: 20,
  chatPerToken:       30,
  chatPerIpPerMin:    20,
  ttsPerToken:        200,   // WebSocket sessions
  ttsCharsPerToken:   60_000,
  ttsPerIpPerMin:     40,
  ttsConcurrentPerIp: 6,
  ttsCharsPerSession: 3_000,
  ttsSessionMs:       60_000,
}

// Usage per token, dropped once the token expires
const _aiUsage = new Map()
setInterval(() => {
  const now = Date.now()
  for (const [t, u] of _aiUsage) if (now > u.exp) _aiUsage.delete(t)
}, 5 * 60_000)

function signAiToken(payload) {
  return createHmac('sha256', AI_TOKEN_SECRET).update(payload).digest('base64url')
}

function issueAiToken() {
  const exp = Date.now() + AI_TOKEN_TTL_MS
  const payload = `${exp}.${randomBytes(9).toString('base64url')}`
  return { token: `${payload}.${signAiToken(payload)}`, expiresAt: exp }
}

/** Returns the token's usage record, or null if missing/forged/expired. */
function verifyAiToken(token) {
  if (typeof token !== 'string' || token.length > 200) return null
  const i = token.lastIndexOf('.')
  if (i < 0) return null
  const payload = token.slice(0, i)
  const sig = Buffer.from(token.slice(i + 1))
  const expected = Buffer.from(signAiToken(payload))
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null
  const exp = Number(payload.split('.')[0])
  if (!Number.isFinite(exp) || Date.now() > exp) return null
  let usage = _aiUsage.get(token)
  if (!usage) { usage = { exp, chat: 0, tts: 0, ttsChars: 0 }; _aiUsage.set(token, usage) }
  return usage
}

/**
 * Same-origin requests from the kiosk on the LAN (Origin host == Host) are
 * allowed too. Browsers always send Origin on POST and WebSocket upgrades,
 * so a missing Origin means a non-browser client — only tolerated in dev.
 */
function aiOriginOk(req) {
  const origin = req.headers.origin
  if (!origin) return IS_DEV
  if (isAllowedOrigin(origin)) return true
  try { return new URL(origin).host === req.headers.host } catch { return false }
}

/**
 * POST /api/ai-token
 * Returns: { token, expiresAt } — send it as X-AI-Token (chat) or ?token= (TTS).
 */
app.post('/api/ai-token', (req, res) => {
  if (!aiOriginOk(req)) return res.status(403).json({ error: 'origin not allowed' })
  if (overLimit(`${req.ip}:ai-token`, AI_LIMITS.tokensPerIpPerHour, 60 * 60_000)) {
    console.warn(`[ai-token] ${req.ip} exceeded token issuance limit`)
    return res.status(429).json({ error: 'Too many requests — please wait a moment.' })
  }
  res.json(issueAiToken())
})

// ─── xAI Proxy ──────────────────────────────────────────────────────────────

const XAI_CHAT_MODELS = ['grok-4-fast-non-reasoning']
const XAI_MAX_TOKENS = 2000
const XAI_MAX_PROMPT_CHARS = 30_000

/**
 * Rebuilds a chat request with only the fields our plugins use, so the proxy
 * can't be used for other models, tools, streaming or huge prompts.
 * Returns the sanitized body, or a string describing why it was rejected.
 */
function sanitizeChatBody(body) {
  const { model, messages, max_tokens, temperature } = body ?? {}
  if (!XAI_CHAT_MODELS.includes(model)) return 'model not allowed'
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 10) return 'invalid messages'
  let chars = 0
  for (const m of messages) {
    if (!['system', 'user', 'assistant'].includes(m?.role) || typeof m.content !== 'string') return 'invalid messages'
    chars += m.content.length
  }
  if (chars > XAI_MAX_PROMPT_CHARS) return 'prompt too long'
  const out = { model, messages: messages.map(({ role, content }) => ({ role, content })) }
  out.max_tokens = Math.min(Number.isInteger(max_tokens) && max_tokens > 0 ? max_tokens : XAI_MAX_TOKENS, XAI_MAX_TOKENS)
  if (typeof temperature === 'number' && temperature >= 0 && temperature <= 2) out.temperature = temperature
  return out
}

/**
 * POST /api/xai/v1/chat/completions
 * Proxies chat completions to api.x.ai, injecting the server-side API key.
 * Requires an X-AI-Token header from /api/ai-token — the key never reaches the client.
 */
app.post('/api/xai/v1/chat/completions', async (req, res) => {
  const key = process.env.XAI_API_KEY
  if (!key) {
    console.error('[xai] XAI_API_KEY not set in server/.env')
    return res.status(503).json({ error: 'XAI_API_KEY not configured on server' })
  }

  if (!aiOriginOk(req)) return res.status(403).json({ error: 'origin not allowed' })
  const usage = verifyAiToken(req.get('X-AI-Token'))
  if (!usage) return res.status(401).json({ error: 'missing or invalid AI token' })
  if (overLimit(`${req.ip}:xai-chat`, AI_LIMITS.chatPerIpPerMin) || usage.chat >= AI_LIMITS.chatPerToken) {
    console.warn(`[xai] ${req.ip} exceeded chat limit`)
    return res.status(429).json({ error: 'Too many requests — please wait a moment.' })
  }
  const body = sanitizeChatBody(req.body)
  if (typeof body === 'string') return res.status(400).json({ error: body })
  usage.chat++

  try {
    const upstream = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await upstream.json()
    res.status(upstream.status).json(data)
  } catch (err) {
    console.error('[xai] upstream error:', err.message)
    res.status(502).json({ error: 'xAI upstream error' })
  }
})

// ─── Module answers (intermediate) ───────────────────────────────────────────

/**
 * POST /api/answers
 * Body: { sessionId?, moduleId, steps: [{ stepId, questionId?, answer }] }
 *    OR { sessionId?, moduleId, stepId, questionId?, answer }  ← single step
 *
 * Plugins call this as users progress through questions.
 * sessionId is available from the start via usePluginSDK().
 */
app.post('/api/answers', async (req, res) => {
  const { sessionId, moduleId, steps, stepId, questionId, answer } = req.body
  if (!moduleId) return res.status(400).json({ error: 'moduleId required' })
  try {
    const now = Date.now()
    const rows = Array.isArray(steps)
      ? steps.map(s => ({
          session_id:  sessionId || null,
          module_id:   moduleId,
          step_id:     s.stepId     || null,
          question_id: s.questionId || null,
          answer:      JSON.stringify(s.answer ?? null),
          created_at:  now,
        }))
      : [{
          session_id:  sessionId || null,
          module_id:   moduleId,
          step_id:     stepId     || null,
          question_id: questionId || null,
          answer:      JSON.stringify(answer ?? null),
          created_at:  now,
        }]

    await db('module_answers').insert(rows)
    res.json({ ok: true, saved: rows.length })
  } catch (err) {
    console.error('[answers] error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─── Sessions ────────────────────────────────────────────────────────────────

/**
 * POST /api/session
 * Body: { id, moduleId, moduleTitle, result }
 * Saves a completed module evaluation. Called when user reaches the email screen.
 */
app.post('/api/session', async (req, res) => {
  const { id, moduleId, moduleTitle, result } = req.body
  if (!id || !moduleId) return res.status(400).json({ error: 'id and moduleId required' })
  // id / moduleId are reflected into the report page and used to build the PDF
  // path, so constrain them to a safe charset. moduleTitle is free text but
  // bounded and always HTML-escaped on render (see esc() in the report route).
  const idRe = /^[A-Za-z0-9_-]{1,64}$/
  if (!idRe.test(id) || !idRe.test(moduleId)) {
    return res.status(400).json({ error: 'invalid id or moduleId format' })
  }
  if (moduleTitle != null && (typeof moduleTitle !== 'string' || moduleTitle.length > 200)) {
    return res.status(400).json({ error: 'invalid moduleTitle' })
  }
  try {
    await db('sessions')
      .insert({ id, module_id: moduleId, module_title: moduleTitle, result: JSON.stringify(result), created_at: Date.now() })
      .onConflict('id').ignore()

    // QR token: 30 min — scan it now or lose it
    const qrToken = await createToken(id, 30)
    // Email token: permanent — goes in the email link
    const emailToken = await createToken(id, null)

    res.json({ ok: true, qrToken, emailToken })
  } catch (err) {
    console.error('[session] error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/**
 * PATCH /api/session/:id/email
 * Body: { email, emailToken? }
 * Attaches the email to an existing session and queues the PDF delivery.
 */
app.patch('/api/session/:id/email', async (req, res) => {
  const { email, emailToken } = req.body
  if (!email) return res.status(400).json({ error: 'email required' })
  try {
    const session = await db('sessions').where({ id: req.params.id }).first()
    if (!session) return res.status(404).json({ error: 'Session not found' })

    await db('sessions').where({ id: req.params.id }).update({ email })

    // Resolve the permanent token for the report link
    const token = emailToken || (
      await db('report_tokens')
        .where({ session_id: req.params.id })
        .whereNull('expires_at')
        .orderBy('created_at', 'desc')
        .first()
    )?.token

    // Build the public report URL
    const host      = process.env.PUBLIC_URL || `http://${getLocalIp()}:${process.env.PORT || 3001}`
    const reportUrl = token ? `${host}/report/${token}` : null

    // Ensure PDF exists before queuing
    const pdfPath = await ensurePdf(session).catch(err => {
      console.error('[session/email] PDF generation failed:', err.message)
      return null
    })

    if (pdfPath) {
      await queueEmail({
        to:          email,
        reportId:    req.params.id,
        moduleTitle: session.module_title || session.module_id,
        pdfPath,
        reportUrl,
      })
      console.log(`[session/email] Queued for ${email}, report ${req.params.id}`)
    } else {
      console.warn(`[session/email] PDF missing for ${req.params.id} — email NOT queued`)
    }

    res.json({ ok: true, queued: !!pdfPath })
  } catch (err) {
    console.error('[session/email] error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─── Pulse Survey ─────────────────────────────────────────────────────────────

/**
 * POST /api/pulse
 * Body: { answers: { q1: 2, q2: 0, ... }, sessionId? }
 * Saves anonymous survey responses. sessionId is optional.
 */
app.post('/api/pulse', async (req, res) => {
  const { answers, sessionId } = req.body
  if (!answers || typeof answers !== 'object') return res.status(400).json({ error: 'answers required' })
  try {
    const now = Date.now()
    const rows = Object.entries(answers).map(([question_id, answer_index]) => ({
      session_id: sessionId || null,
      question_id,
      answer_index,
      created_at: now,
    }))
    await db('pulse_answers').insert(rows)
    res.json({ ok: true, saved: rows.length })
  } catch (err) {
    console.error('[pulse] error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/pulse/aggregates
 * Returns answer counts per question — used by PulseSurvey to show real results.
 */
app.get('/api/pulse/aggregates', async (req, res) => {
  try {
    const rows = await db('pulse_answers')
      .select('question_id', 'answer_index')
      .count('* as count')
      .groupBy('question_id', 'answer_index')
    // Shape: { q1: [12, 8, 34, 6], q2: [...], ... }
    const agg = {}
    for (const row of rows) {
      if (!agg[row.question_id]) agg[row.question_id] = []
      agg[row.question_id][row.answer_index] = Number(row.count)
    }
    res.json(agg)
  } catch (err) {
    console.error('[pulse/aggregates] error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─── PDF lazy generation ──────────────────────────────────────────────────────

/**
 * Generates the PDF for a session if it doesn't exist yet.
 * Called on-demand when the report page or PDF endpoint is hit.
 */
async function ensurePdf(session) {
  const pdfPath = join(REPORTS_DIR, `${session.id}.pdf`)
  if (existsSync(pdfPath)) return pdfPath
  const result = typeof session.result === 'string' ? JSON.parse(session.result) : session.result
  const { _moduleId, _moduleTitle, ...cleanResult } = result || {}
  await generateReport({
    id: session.id,
    moduleId: session.module_id,
    moduleTitle: session.module_title,
    result: cleanResult,
    pdfPath,
  })
  return pdfPath
}

// ─── Report PDF download ──────────────────────────────────────────────────────

/**
 * GET /report/:token/pdf
 * Forces PDF download with proper headers — works on mobile Safari/Chrome.
 */
app.get('/report/:token/pdf', async (req, res) => {
  try {
    const tokenRow = await db('report_tokens').where({ token: req.params.token }).first()
    if (!tokenRow) return res.status(404).send('Not found')
    if (tokenRow.expires_at && tokenRow.expires_at < Date.now()) {
      return res.status(410).send('Link expired')
    }
    const session = await db('sessions').where({ id: tokenRow.session_id }).first()
    if (!session) return res.status(404).send('Session not found')

    const pdfPath = await ensurePdf(session).catch(() => null)
    if (!pdfPath) return res.status(404).send('PDF generation failed')

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="informe-innovadef-${session.id}.pdf"`)
    res.sendFile(pdfPath)
  } catch (err) {
    console.error('[report/pdf] error:', err.message)
    res.status(500).send('Error')
  }
})

// ─── Report page (QR target) ──────────────────────────────────────────────────

// HTML-escape untrusted values before interpolating them into a server-rendered
// template string. Session fields (id, module_title, …) come from the public,
// unauthenticated POST /api/session body, so they MUST be escaped here.
const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

function reportErrorPage(msg) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>INNOVADEF FOCO 2026</title>
  <style>body{background:#070707;color:#00FF41;font-family:'Courier New',monospace;padding:2rem;max-width:960px;margin:0 auto;}
  p{color:#4B5563;margin-top:1rem;}footer{margin-top:3rem;color:#1f2937;font-size:.7rem;letter-spacing:2px;}</style></head>
  <body><h2>// INFORME NO DISPONIBLE</h2><p>${msg}</p>
  <footer>Pumpún Dixital S.L. · pumpun.cloud · INNOVADEF FOCO 2026</footer></body></html>`
}

/**
 * GET /report/:id
 * The URL embedded in QR codes. Returns a simple HTML page that shows the
 * session summary and links to the PDF if it was generated server-side.
 */
app.get('/report/:token', async (req, res) => {
  try {
    const tokenRow = await db('report_tokens').where({ token: req.params.token }).first()
    if (!tokenRow) return res.status(404).send(reportErrorPage('Informe no encontrado.'))

    if (tokenRow.expires_at && tokenRow.expires_at < Date.now()) {
      return res.status(410).send(reportErrorPage('Este enlace ha caducado.<br>Si recibiste el informe por email, usa ese enlace.'))
    }

    const session = await db('sessions').where({ id: tokenRow.session_id }).first()
    if (!session) return res.status(404).send(reportErrorPage('Sesión no encontrada.'))

    const pdfPath = await ensurePdf(session).catch(() => null)
    const hasPdf = !!pdfPath

    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>INNOVADEF FOCO 2026 — Informe ${esc(session.id)}</title>
  <style>
    body { background:#070707; color:#00FF41; font-family:'Courier New',monospace; padding:2rem; max-width:960px; margin:0 auto; }
    h1 { font-size:1.1rem; letter-spacing:4px; border-bottom:1px solid #00FF4133; padding-bottom:1rem; }
    .label { color:#4B5563; font-size:.75rem; letter-spacing:2px; margin-top:1.5rem; }
    .value { font-size:1rem; margin-top:.25rem; }
    .btn { display:inline-block; margin-top:2rem; padding:.75rem 1.5rem; border:1px solid #00FF41; color:#00FF41; text-decoration:none; letter-spacing:2px; font-size:.85rem; }
    .btn:hover { background:rgba(0,255,65,.08); }
    footer { margin-top:3rem; color:#1f2937; font-size:.7rem; letter-spacing:2px; }
  </style>
</head>
<body>
  <h1>// INFORME DE EVALUACIÓN — INNOVADEF FOCO 2026</h1>
  <div class="label">SESIÓN</div>
  <div class="value">${esc(session.id)}</div>
  <div class="label">MÓDULO</div>
  <div class="value">${esc(session.module_title || session.module_id)}</div>
  <div class="label">FECHA</div>
  <div class="value">${new Date(Number(session.created_at)).toLocaleString('es-ES', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Madrid' })}</div>
  ${hasPdf ? `
  <a class="btn" href="/report/${req.params.token}/pdf">[ DESCARGAR PDF ]</a>
  <div style="margin-top:1.5rem;">
    <div style="color:#4B5563;font-size:.7rem;letter-spacing:2px;margin-bottom:.5rem;">VISTA PREVIA</div>
    <iframe src="/reports/${encodeURIComponent(session.id)}.pdf" title="Informe PDF"
      style="width:100%;height:80vh;border:1px solid #1f2937;display:block;background:#fff;"></iframe>
  </div>` : '<p style="color:#4B5563;margin-top:2rem;font-size:.85rem;">PDF no disponible para esta sesión.</p>'}
  <footer>Pumpún Dixital S.L. · pumpun.cloud · INNOVADEF FOCO 2026</footer>
</body>
</html>`)
  } catch (err) {
    console.error('[report page] error:', err.message)
    res.status(500).send('<h2>Error interno</h2>')
  }
})

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const ts = new Date().toISOString()
  console.error(`[error] ${ts} ${req.method} ${req.path}`)
  console.error(err.stack || err.message)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

// ─── Start ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001
const httpServer = createServer(app)

// ─── WebSocket TTS Proxy ─────────────────────────────────────────────────────
// Browsers cannot set Authorization on WebSocket upgrades, so the server
// proxies /ws-tts → wss://api.x.ai/v1/tts and injects the key.

const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 })

// Query params forwarded to xAI; anything else (including ?token) is dropped.
const TTS_PARAMS = ['language', 'voice', 'voice_id', 'codec', 'sample_rate', 'bit_rate', 'optimize_streaming_latency']
const TTS_PARAM_VALUE_RE = /^[A-Za-z0-9_-]{1,32}$/

// Open TTS sessions per client IP
const _ttsOpen = new Map()

/** Upgrade requests bypass Express, so resolve the client IP like 'trust proxy' does. */
function upgradeIp(req) {
  const remote = req.socket.remoteAddress || ''
  const fromLoopback = remote === '::1' || /^(::ffff:)?127\./.test(remote)
  const xff = req.headers['x-forwarded-for']
  return fromLoopback && xff ? xff.split(',').pop().trim() : remote
}

function rejectUpgrade(socket, status, reason) {
  socket.write(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`)
  socket.destroy()
}

httpServer.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname !== '/ws-tts') {
    socket.destroy()
    return
  }

  const ip = upgradeIp(req)
  if (!aiOriginOk(req)) return rejectUpgrade(socket, 403, 'Forbidden')
  const usage = verifyAiToken(url.searchParams.get('token'))
  if (!usage) return rejectUpgrade(socket, 401, 'Unauthorized')
  if (overLimit(`${ip}:ws-tts`, AI_LIMITS.ttsPerIpPerMin)
    || (_ttsOpen.get(ip) || 0) >= AI_LIMITS.ttsConcurrentPerIp
    || usage.tts >= AI_LIMITS.ttsPerToken
    || usage.ttsChars >= AI_LIMITS.ttsCharsPerToken) {
    console.warn(`[ws-tts] ${ip} exceeded TTS limit`)
    return rejectUpgrade(socket, 429, 'Too Many Requests')
  }

  const params = new URLSearchParams()
  for (const name of TTS_PARAMS) {
    const value = url.searchParams.get(name)
    if (value == null) continue
    if (!TTS_PARAM_VALUE_RE.test(value)) return rejectUpgrade(socket, 400, 'Bad Request')
    params.set(name, value)
  }

  wss.handleUpgrade(req, socket, head, (client) => {
    const key = process.env.XAI_API_KEY
    if (!key) {
      client.close(1011, 'XAI_API_KEY not configured')
      return
    }

    usage.tts++
    _ttsOpen.set(ip, (_ttsOpen.get(ip) || 0) + 1)
    const sessionTimer = setTimeout(() => client.close(1008, 'session too long'), AI_LIMITS.ttsSessionMs)
    client.on('close', () => {
      clearTimeout(sessionTimer)
      const open = (_ttsOpen.get(ip) || 1) - 1
      if (open > 0) _ttsOpen.set(ip, open)
      else _ttsOpen.delete(ip)
    })

    const upstream = new WebSocket(`wss://api.x.ai/v1/tts?${params}`, {
      headers: { Authorization: `Bearer ${key}` },
    })

    // Only text.delta / text.done JSON messages are forwarded, and the text
    // sent is counted against the per-session and per-token quotas.
    let sessionChars = 0
    const msgBuffer = []
    client.on('message', (data, isBinary) => {
      let msg
      try { msg = isBinary ? null : JSON.parse(data.toString()) } catch { msg = null }
      let out
      if (msg?.type === 'text.delta' && typeof msg.delta === 'string') {
        sessionChars += msg.delta.length
        usage.ttsChars += msg.delta.length
        if (sessionChars > AI_LIMITS.ttsCharsPerSession || usage.ttsChars > AI_LIMITS.ttsCharsPerToken) {
          client.close(1008, 'text quota exceeded')
          return
        }
        out = JSON.stringify({ type: 'text.delta', delta: msg.delta })
      } else if (msg?.type === 'text.done') {
        out = JSON.stringify({ type: 'text.done' })
      } else {
        client.close(1008, 'unsupported message')
        return
      }
      if (upstream.readyState === WebSocket.OPEN) upstream.send(out)
      else msgBuffer.push(out)
    })
    client.on('close', () => upstream.close())

    upstream.on('open', () => {
      msgBuffer.forEach((out) => upstream.send(out))
      msgBuffer.length = 0
    })

    upstream.on('message', (data, isBinary) => {
      if (client.readyState === WebSocket.OPEN) client.send(data, { binary: isBinary })
    })
    upstream.on('close', () => client.close())
    upstream.on('error', (err) => {
      console.error('[ws-tts] upstream error:', err.message)
      client.close(1011, 'upstream error')
    })
  })
})

await runMigrations()

httpServer.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIp()
  console.log(`\n  ┌──────────────────────────────────────────┐`)
  console.log(`  │  INNOVADEF API SERVER                    │`)
  console.log(`  │  Local:   http://localhost:${PORT}          │`)
  console.log(`  │  Network: http://${ip}:${PORT}     │`)
  console.log(`  └──────────────────────────────────────────┘\n`)
})
