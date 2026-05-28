// CMD-W17-L2b · Bidirectional sync · app→Sylvia · LaunchAgent-driven hourly
// LAW #38 HARD GUARD · read-only app reads · write-only Sylvia inserts
// BINDING #6 OP-B Turso pattern (env-file passes TURSO_CONNECTION_URL + TURSO_AUTH_TOKEN)
// BINDING #15 provenance metadata (every Sylvia row tagged with app_table + app_id + run_tag)
// BINDING #38 schema empirical · sylvia_corpus_queue actual columns:
//   id TEXT PK · sessionId TEXT · verticalId TEXT · domain TEXT · payload TEXT (JSON)
//   status TEXT · attemptCount INTEGER · claimedAt/completedAt DATETIME · lastError TEXT
//   createdAt/updatedAt DATETIME · claimedBy TEXT
// Dedup via deterministic id `app-{table}-{rowId}` (PK collision = skip)

import { createClient } from '@libsql/client'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const STATE_DIR = join(homedir(), 'Library', 'Application Support', 'legacyloop')
const STATE_FILE = join(STATE_DIR, 'sylvia-bidir-sync.state.json')

if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true })

function loadState() {
  if (!existsSync(STATE_FILE)) {
    return { last_sync_iso: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), run_count: 0 }
  }
  return JSON.parse(readFileSync(STATE_FILE, 'utf-8'))
}

function saveState(s) {
  writeFileSync(STATE_FILE, JSON.stringify(s, null, 2))
}

const url = process.env.TURSO_CONNECTION_URL || process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN
if (!url || !authToken) {
  console.error('TURSO env missing · cannot proceed')
  process.exit(2)
}

const c = createClient({ url, authToken })

const state = loadState()
const cutoff = state.last_sync_iso
const RUN_TAG = 'W17-L2b-bidir-sync-' + new Date().toISOString().slice(0, 16)

async function existsByPK(pk) {
  const r = await c.execute({
    sql: 'SELECT 1 FROM sylvia_corpus_queue WHERE id = ? LIMIT 1',
    args: [pk],
  })
  return r.rows.length > 0
}

async function insertSylviaRow({ pk, verticalId, domain, payloadObj }) {
  await c.execute({
    sql: `INSERT INTO sylvia_corpus_queue
            (id, sessionId, verticalId, domain, payload, status, attemptCount, createdAt, updatedAt)
          VALUES
            (?, NULL, ?, ?, ?, 'PENDING', 0, datetime('now'), datetime('now'))`,
    args: [pk, verticalId, domain, JSON.stringify(payloadObj)],
  })
}

const counters = { read: 0, inserted: 0, skipped_dedup: 0, errors: 0 }

// === Item table delta (V9 marketplace) ===
try {
  const newItems = (await c.execute({
    sql: 'SELECT id, name, category FROM Item WHERE createdAt > ?',
    args: [cutoff],
  })).rows
  for (const it of newItems) {
    counters.read++
    const pk = `app-Item-${it.id}`
    if (await existsByPK(pk)) { counters.skipped_dedup++; continue }
    try {
      await insertSylviaRow({
        pk,
        verticalId: 'V9',
        domain: 'app-data-item',
        payloadObj: {
          source: 'app-data-bidir-sync',
          corpusId: 'app-data-' + new Date().toISOString().slice(0, 10),
          domain: 'app-data-item',
          entries: [{
            id: pk,
            title: String(it.name || '(item)').slice(0, 200),
            body: { name: it.name, category: it.category },
          }],
          provenance: { app_table: 'Item', app_id: it.id, ingested_via: RUN_TAG },
        },
      })
      counters.inserted++
    } catch (e) { counters.errors++; console.error('Item insert err:', e.message) }
  }
} catch (e) {
  console.error('Item delta query failed:', e.message)
  counters.errors++
}

// === MarketComp table delta (V9 marketplace comps) ===
try {
  const newComps = (await c.execute({
    sql: 'SELECT id, platform, title, price, currency, url FROM MarketComp WHERE createdAt > ?',
    args: [cutoff],
  })).rows
  for (const mc of newComps) {
    counters.read++
    const pk = `app-MarketComp-${mc.id}`
    if (await existsByPK(pk)) { counters.skipped_dedup++; continue }
    try {
      await insertSylviaRow({
        pk,
        verticalId: 'V9',
        domain: 'app-data-marketcomp',
        payloadObj: {
          source: 'app-data-bidir-sync',
          corpusId: 'app-data-' + new Date().toISOString().slice(0, 10),
          domain: 'app-data-marketcomp',
          entries: [{
            id: pk,
            title: String(mc.title || '(comp)').slice(0, 200),
            body: { platform: mc.platform, title: mc.title, price: mc.price, currency: mc.currency, sourceUrl: mc.url },
          }],
          provenance: { app_table: 'MarketComp', app_id: mc.id, ingested_via: RUN_TAG },
        },
      })
      counters.inserted++
    } catch (e) { counters.errors++; console.error('MarketComp insert err:', e.message) }
  }
} catch (e) {
  console.error('MarketComp delta query failed:', e.message)
  counters.errors++
}

// === EventLog table delta (vertical-routed) ===
try {
  const newEvents = (await c.execute({
    sql: 'SELECT id, eventType, payload FROM EventLog WHERE createdAt > ?',
    args: [cutoff],
  })).rows
  for (const ev of newEvents) {
    counters.read++
    const pk = `app-EventLog-${ev.id}`
    if (await existsByPK(pk)) { counters.skipped_dedup++; continue }
    if (!ev.eventType || /^(STATUS_CHANGE|ITEM_UPDATED|BOT_SEQUENCE|LISTBOT_RUN)$/.test(ev.eventType)) continue
    const vid = /^PRICING|^BUYERBOT|^MEGABOT|^DEMAND|GARAGE_SALE|^AGENT_AI|^ANALYZ/.test(ev.eventType)
      ? 'V9'
      : ev.eventType === 'SHIPPING_QUOTED'
        ? 'V8'
        : null
    if (!vid) continue
    try {
      await insertSylviaRow({
        pk,
        verticalId: vid,
        domain: 'app-data-event',
        payloadObj: {
          source: 'app-data-bidir-sync',
          corpusId: 'app-data-' + new Date().toISOString().slice(0, 10),
          domain: 'app-data-event',
          entries: [{
            id: pk,
            title: ev.eventType,
            body: { eventType: ev.eventType, payload: ev.payload },
          }],
          provenance: { app_table: 'EventLog', app_id: ev.id, ingested_via: RUN_TAG },
        },
      })
      counters.inserted++
    } catch (e) { counters.errors++; console.error('EventLog insert err:', e.message) }
  }
} catch (e) {
  console.error('EventLog delta query failed:', e.message)
  counters.errors++
}

// Persist state
state.last_sync_iso = new Date().toISOString()
state.run_count = (state.run_count || 0) + 1
state.last_run_counters = counters
saveState(state)

console.log(JSON.stringify({ run_tag: RUN_TAG, cutoff, counters, state_file: STATE_FILE }, null, 2))
