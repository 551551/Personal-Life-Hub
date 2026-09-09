import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

function run(args, env = process.env) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', env })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
run(['node_modules/vitest/vitest.mjs', 'run', '--config', 'wechat/vitest.config.ts'])
run(['node_modules/typescript/bin/tsc', '-p', 'wechat/tsconfig.json'])
// Verify a fresh deliverable, without deleting the user's DevTools preferences.
const directory = mkdtempSync(join(tmpdir(), 'personal-life-hub-wechat-'))
console.log(`Isolated verification output: ${directory}`)
const env = { ...process.env, WECHAT_ARTIFACT_DIR: directory }
run(['scripts/build-wechat.mjs'], env)
run(['--test', 'scripts/wechat-artifact.node-test.mjs', 'scripts/wechat-wxml.node-test.mjs'], env)
// Only update the IDE project after the clean artifact passes all checks.
run(['scripts/build-wechat.mjs'], { ...process.env, WECHAT_ARTIFACT_DIR: 'release/wechat' })
run(['--test', 'scripts/wechat-wxml.node-test.mjs'], { ...process.env, WECHAT_ARTIFACT_DIR: 'release/wechat' })
