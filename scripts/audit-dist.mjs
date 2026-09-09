import { readdir, readFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'

const distDirectory = resolve('dist')
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.map', '.svg'])
const violations = []
const forbiddenPatterns = [
  ['remote resource attribute', /\b(?:src|href|action)\s*[:=]\s*["'`]https?:\/\//gi],
  ['remote CSS resource', /(?:url\(\s*["']?|@import\s+["'])https?:\/\//gi],
  ['remote Fetch or Beacon call', /\b(?:fetch|sendBeacon)\s*\(\s*["'`]https?:\/\//gi],
  ['remote stream connection', /\b(?:WebSocket|EventSource)\s*\(\s*["'`]https?:\/\//gi],
  ['remote XMLHttpRequest call', /\.open\(\s*["'`](?:GET|POST|PUT|PATCH|DELETE)["'`]\s*,\s*["'`]https?:\/\//gi],
]

async function inspect(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      await inspect(path)
      continue
    }
    if (!textExtensions.has(extname(entry.name))) continue
    const content = await readFile(path, 'utf8')
    for (const [label, pattern] of forbiddenPatterns) {
      pattern.lastIndex = 0
      if (pattern.test(content)) violations.push(`${path} (${label})`)
    }
  }
}

await inspect(distDirectory)

if (violations.length > 0) {
  console.error('Remote URL references found in production output:')
  for (const path of violations) console.error(`- ${path}`)
  process.exitCode = 1
} else {
  console.log('Production output contains no remote resource or network-call references.')
}
