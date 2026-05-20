import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { networkInterfaces } from 'os'
import { v4 as uuidv4 } from 'uuid'
import { generateReport } from './pdfGenerator.js'
import { queueEmail, getQueueStatus } from './emailQueue.js'

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
app.use(cors())
app.use(express.json())

// Serve generated PDFs statically
app.use('/reports', express.static(REPORTS_DIR))

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

// ─── Start ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001
createServer(app).listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIp()
  console.log(`\n  ┌──────────────────────────────────────────┐`)
  console.log(`  │  INNOVADEF API SERVER                    │`)
  console.log(`  │  Local:   http://localhost:${PORT}          │`)
  console.log(`  │  Network: http://${ip}:${PORT}     │`)
  console.log(`  └──────────────────────────────────────────┘\n`)
})
