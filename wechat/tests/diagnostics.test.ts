import { expect, it } from 'vitest'
import { createDiagnostics } from '../core/diagnostics'

it('logs operation and stack frames without exception text or arbitrary properties', () => {
  const logs: unknown[] = []
  const report = createDiagnostics(event => logs.push(event))
  const error = new Error('私人备忘内容')
  error.stack = 'Error: 私人备忘内容\n    at read (runtime.js:12:34)\n    at load (runtime.js:56:7)'
  report(error, 'load')
  report(error, 'save')
  expect(JSON.stringify(logs)).not.toContain('私人备忘内容')
  expect(logs[0]).toMatchObject({ event: 'wechat_memo_failure', operation: 'load', frames: ['at read (runtime.js:12:34)', 'at load (runtime.js:56:7)'] })
  expect(logs[0]).not.toEqual(logs[1])
})
