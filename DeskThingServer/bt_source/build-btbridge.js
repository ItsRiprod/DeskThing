/**
 * Builds the Bluetooth bridge helper for the current platform so no binary
 * ever lives in git. Runs as part of the build chain.
 *
 *   mac    compiles bt_source/btbridge.swift with swiftc (required)
 *   linux  nothing to compile — the helper is a Python script shipped as-is
 *   win    compiles bt_source/win/btbridge.c with cl/clang/gcc when one is
 *          available; otherwise skips, and the app falls back to USB-only
 */
import { spawnSync } from 'child_process'
import { chmodSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const bt = path.join(root, 'bt_source')

const run = (cmd, args) => spawnSync(cmd, args, { stdio: 'inherit' })
const has = (cmd) =>
  spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { stdio: 'ignore' })
    .status === 0

if (process.platform === 'darwin') {
  const out = path.join(bt, 'mac', 'btbridge')
  const result = run('swiftc', [
    '-O',
    path.join(bt, 'btbridge.swift'),
    '-o',
    out,
    '-framework',
    'IOBluetooth',
    '-framework',
    'Network'
  ])
  if (result.error || result.status !== 0) {
    console.error('build-btbridge: swiftc failed')
    process.exit(result.status ?? 1)
  }
  console.log(`build-btbridge: built ${out}`)
} else if (process.platform === 'linux') {
  const helper = path.join(bt, 'linux', 'btbridge')
  if (!existsSync(helper)) {
    console.error(`build-btbridge: missing ${helper}`)
    process.exit(1)
  }
  chmodSync(helper, 0o755)
  console.log(`build-btbridge: ${helper} ready (python, no compile step)`)
} else if (process.platform === 'win32') {
  const src = path.join(bt, 'win', 'btbridge.c')
  const out = path.join(bt, 'win', 'btbridge.exe')
  let result
  if (has('cl')) {
    result = run('cl', ['/nologo', '/O2', src, `/Fe:${out}`, '/link', 'ws2_32.lib', 'Bthprops.lib'])
  } else if (has('clang')) {
    result = run('clang', ['-O2', src, '-o', out, '-lws2_32', '-lBthprops'])
  } else if (has('gcc')) {
    result = run('gcc', ['-O2', src, '-o', out, '-lws2_32', '-lbthprops'])
  } else {
    console.warn(
      'build-btbridge: no C compiler found (cl/clang/gcc) — skipping the Bluetooth helper; USB transport still works'
    )
    process.exit(0)
  }
  if (result.error || result.status !== 0) {
    console.error('build-btbridge: compile failed')
    process.exit(result.status ?? 1)
  }
  console.log(`build-btbridge: built ${out}`)
} else {
  console.log(`build-btbridge: no Bluetooth helper for ${process.platform}, skipping`)
}
