interface Diagnostic {
  event: 'wechat_memo_failure'
  incident: string
  operation: string
  frames: string[]
}

/** Local console only. Never serialize the exception, input, or stored records. */
export function createDiagnostics(write: (event: Diagnostic) => void) {
  let sequence = 0
  return (error: unknown, operation: string) => {
    const stack = error instanceof Error ? error.stack : undefined
    const frames = typeof stack === 'string'
      ? stack.split('\n').filter(line => /^\s+at .+:\d+:\d+\)?$/.test(line)).slice(0, 12).map(line => line.trim())
      : []
    write({ event: 'wechat_memo_failure', incident: `${Date.now()}-${++sequence}`, operation, frames })
  }
}
