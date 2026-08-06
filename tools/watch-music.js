#!/usr/bin/env node
/**
 * watch-music — time the server's outbound song updates against reality.
 *
 * "The screen is slow to show the new track" is hard to act on. This turns it
 * into numbers: how often the server actually pushes song data, how much of
 * that is duplicate, and — the one that matters — how late an update arrives
 * relative to when the previous track was due to end.
 *
 * Each payload carries track_progress and track_duration, so a sample at wall
 * time T means the track ends at T + (duration - progress). Compare that
 * against when the next track's update actually shows up and the lateness is
 * exact, with no need to ask Spotify anything or to watch the device.
 *
 * Read-only. It connects as an ordinary extra websocket client and never sends
 * a control request, so it cannot perturb what it is measuring.
 *
 *   node tools/watch-music.js                 # 5 minutes against localhost:8891
 *   node tools/watch-music.js --seconds 900
 *   node tools/watch-music.js --url ws://localhost:8891
 *
 * Run it long enough to span a track boundary — that is the measurement.
 */

const path = require('path')

// ws ships with the server; no separate install.
let WebSocket
try {
  WebSocket = require(path.join(__dirname, '..', 'DeskThingServer', 'node_modules', 'ws'))
} catch {
  try {
    WebSocket = require('ws')
  } catch {
    console.error("Could not load 'ws'. Run `npm install` in DeskThingServer/ first.")
    process.exit(1)
  }
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const URL = arg('url', 'ws://localhost:8891')
const RUN_MS = parseInt(arg('seconds', '300'), 10) * 1000

const t0 = Date.now()
const ts = () => ((Date.now() - t0) / 1000).toFixed(2).padStart(8)
const secs = (ms) => (ms / 1000).toFixed(2)

const pushes = []        // wall time of every song payload
const changes = []       // {name, lateBy}
let duplicates = 0
let lastTrack = null
let lastSeen = null      // {name, progress, duration, at}
let lastPayload = null

const ws = new WebSocket(URL)
ws.on('open', () => console.log(`${ts()}  watching ${URL} for ${RUN_MS / 1000}s`))

ws.on('message', (buf) => {
  let d
  try {
    d = JSON.parse(buf.toString())
  } catch {
    return
  }
  const p = d && d.payload
  if (!p || typeof p !== 'object' || p.track_name === undefined) return

  const now = Date.now()
  const { track_name: name, track_progress: progress, track_duration: duration } = p

  // The server re-sends an identical payload several times per poll. Counting
  // them matters on a Bluetooth link, where every copy is real airtime.
  const fingerprint = `${name}|${progress}|${duration}|${p.is_playing}`
  if (fingerprint === lastPayload) {
    duplicates += 1
    return
  }
  lastPayload = fingerprint
  pushes.push(now)

  if (name !== lastTrack) {
    if (lastSeen) {
      // How late we learned, measured directly: a track starts at progress 0,
      // so whatever progress it has already accumulated when we first see it
      // IS the lag. This holds whether the previous track ended on its own or
      // was skipped, which extrapolating from the previous track's end does
      // not — a skip makes that estimate wildly negative and useless.
      const lateBy = progress
      changes.push({ name, lateBy })

      // Did the previous track finish, or did someone skip it? Only worth
      // reporting to explain the context of the measurement.
      const leftOver =
        lastSeen.duration != null && lastSeen.progress != null
          ? lastSeen.duration - lastSeen.progress - (now - lastSeen.at)
          : null
      const how =
        leftOver == null ? '' : leftOver > 3000 ? `  (previous track skipped with ${secs(leftOver)}s to go)` : '  (previous track played out)'

      console.log(
        `${ts()}  TRACK CHANGE -> ${name}${how}\n` +
          `          first seen ${secs(lateBy)}s into the track — that is how late the update was`
      )
    } else {
      console.log(`${ts()}  first track: ${name}  ${progress}/${duration}ms`)
    }
    lastTrack = name
  } else {
    const gap = pushes.length > 1 ? secs(now - pushes[pushes.length - 2]) : '—'
    const remaining = duration != null && progress != null ? secs(duration - progress) : '?'
    console.log(`${ts()}  poll (+${gap}s)  ${progress}/${duration}ms  ${remaining}s left`)
  }

  lastSeen = { name, progress, duration, at: now }
})

ws.on('error', (e) => console.log(`${ts()}  ERROR ${e.message}`))

function report() {
  const gaps = pushes.slice(1).map((t, i) => t - pushes[i])
  console.log('\n──────── summary ────────')
  if (gaps.length) {
    const sorted = [...gaps].sort((a, b) => a - b)
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length
    console.log(`polls          ${pushes.length}`)
    console.log(`gap min/med/max ${secs(sorted[0])}s / ${secs(sorted[sorted.length >> 1])}s / ${secs(sorted[sorted.length - 1])}s`)
    console.log(`gap mean       ${secs(mean)}s`)
  } else {
    console.log('polls          too few to measure a gap')
  }
  console.log(`duplicate sends ${duplicates}  (identical payloads suppressed from the counts above)`)

  if (changes.length) {
    console.log('\ntrack changes:')
    for (const c of changes) console.log(`  ${secs(c.lateBy).padStart(7)}s late   ${c.name}`)
    const mean = changes.reduce((a, c) => a + c.lateBy, 0) / changes.length
    console.log(`\nmean lateness  ${secs(mean)}s`)
    console.log(
      '\nA poller that ignores track_duration is late by up to one full poll\n' +
        'period on every track change, and by half a period on average. Compare\n' +
        'the lateness above against the gap figures — if they match, the poll\n' +
        'interval is the whole story and shortening it only trades API budget\n' +
        'for latency. Scheduling a refresh at the track boundary fixes it\n' +
        'without spending either.'
    )
  } else {
    console.log('\nno track change observed — run longer to measure the lateness')
  }
}

setTimeout(() => {
  report()
  ws.close()
  process.exit(0)
}, RUN_MS)

process.on('SIGINT', () => {
  report()
  process.exit(0)
})
