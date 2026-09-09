const assert = require('node:assert/strict')
const automator = require(process.env.WECHAT_AUTOMATOR_PATH || 'D:/软件/.cache/wechat-automation/node_modules/miniprogram-automator')
const timer = setTimeout(() => process.exit(1), 20000)
;(async () => {
  const mini = await automator.connect({ wsEndpoint: process.env.WECHAT_WS || 'ws://127.0.0.1:9430' })
  try {
    await mini.evaluate(() => { wx.switchTab({ url: '/pages/today/index' }) })
    await new Promise(resolve => setTimeout(resolve, 800))
    const result = await mini.evaluate(async () => {
      const p = getCurrentPages().slice(-1)[0]
      if (p.route !== 'pages/today/index' || typeof p.data.followToday !== 'boolean') throw new Error('Updated today page not loaded')
      const original = { date: p.data.date, followToday: p.data.followToday, limit: p.data.limit }
      const d = new Date()
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      try {
        p.setData({ date: '2000-01-01', followToday: true })
        await p.onShow()
        const refreshed = p.data.date === today && !p.data.error
        await p.onDate({ detail: { value: '2000-01-01' } })
        await p.onShow()
        return { refreshed, preserved: p.data.date === '2000-01-01' && !p.data.error }
      } finally { p.setData(original); await p.onShow() }
    })
    assert.deepEqual(result, { refreshed: true, preserved: true })
    console.log('PASS: native today refresh and deliberate date selection; no records modified')
  } finally { mini.disconnect(); clearTimeout(timer) }
})().catch(error => { console.error(error); clearTimeout(timer); process.exitCode = 1 })
