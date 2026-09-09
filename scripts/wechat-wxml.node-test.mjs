import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

// Use the compiler shipped with the official WeChat DevTools, not an HTML parser.
const compiler = process.env.WECHAT_WCC_PATH || 'D:/WechatDevTools/code/package.nw/node_modules/wcc-exec/wcc.exe'
const directory = resolve(process.env.WECHAT_ARTIFACT_DIR || 'wechat')
const templates = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? templates(join(dir, entry.name)) : entry.name.endsWith('.wxml') ? [join(dir, entry.name)] : [])

test('all native templates compile with the official WXML compiler', () => {
  const files = templates(directory)
  assert.ok(files.length > 0, 'No WXML templates found')
  const result = spawnSync(compiler, files, { cwd: directory, encoding: 'utf8', timeout: 30000, maxBuffer: 16 * 1024 * 1024 })
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.ok(result.stdout.length > 0, 'Compiler produced no code')
})
