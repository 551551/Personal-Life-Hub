import { spawn } from 'node:child_process'
import { request } from 'node:http'
import { once } from 'node:events'
import { resolve } from 'node:path'

const host = '127.0.0.1'
const port = 4173
const baseUrl = `http://${host}:${port}`
const playwrightArguments = process.argv.slice(2).filter((argument) => argument !== '--')

const server = spawn(
  process.execPath,
  [
    resolve('node_modules/vite/bin/vite.js'),
    'preview',
    '--host',
    host,
    '--port',
    String(port),
    '--strictPort',
  ],
  { stdio: 'inherit', windowsHide: true },
)

function canReachServer() {
  return new Promise((resolveRequest) => {
    const req = request(baseUrl, { method: 'HEAD' }, (response) => {
      response.resume()
      resolveRequest(response.statusCode === 200)
    })
    req.on('error', () => resolveRequest(false))
    req.end()
  })
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (await canReachServer()) return
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100))
  }
  throw new Error(`Timed out waiting for ${baseUrl}`)
}

async function stopServer() {
  if (server.exitCode !== null) return
  server.kill('SIGTERM')
  const exited = once(server, 'exit')
  const forced = new Promise((resolveDelay) => {
    setTimeout(() => {
      if (server.exitCode === null) server.kill('SIGKILL')
      resolveDelay()
    }, 2_000)
  })
  await Promise.race([exited, forced])
}

let exitCode = 1

try {
  await waitForServer()
  const tests = spawn(
    process.execPath,
    [resolve('node_modules/@playwright/test/cli.js'), 'test', ...playwrightArguments],
    { stdio: 'inherit', windowsHide: true },
  )
  const [code] = await once(tests, 'exit')
  exitCode = code ?? 1
} finally {
  await stopServer()
}

process.exitCode = exitCode
