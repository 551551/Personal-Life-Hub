// Two phases separated by a full DevTools restart; touches only its own test memo.
const assert = require('node:assert/strict')
const automator = require(process.env.WECHAT_AUTOMATOR_PATH || 'D:/软件/.cache/wechat-automation/node_modules/miniprogram-automator')
const marker = process.argv[3]
assert.ok(['seed', 'verify'].includes(process.argv[2]), 'Phase must be seed or verify')
if (!marker || !marker.startsWith('__wechat_smoke_')) throw new Error('Provide a unique __wechat_smoke_ marker')
const timeout = setTimeout(() => { console.error('Simulator timed out'); process.exit(1) }, 30000)
;(async () => {
  const mini = await automator.connect({ wsEndpoint: process.env.WECHAT_WS || 'ws://127.0.0.1:9430' })
  try {
    const navigation = await mini.evaluate(() => getCurrentPages().slice(-1)[0]?.route === 'pages/memos/index' ? Promise.resolve('') : new Promise(resolve => wx.navigateTo({ url: '/pages/memos/index', success: () => resolve(''), fail: error => resolve(error.errMsg) })))
    assert.equal(navigation, '')
    await new Promise(resolve => setTimeout(resolve, 600))
    const result = await mini.evaluate(async (phase, content) => {
      const page = getCurrentPages().slice(-1)[0]
      if (page.route !== 'pages/memos/index') throw new Error('Memo navigation failed')
      page.onShow()
      if (page.data.error) throw new Error(page.data.error)
      if (phase === 'seed') {
        if (page.data.items.some(item => item.content === content)) throw new Error('Test marker already exists')
        page.onInput({ detail: { value: content } })
        await page.onSave()
        return { error: page.data.error, saved: page.data.items.some(item => item.content === content) }
      }
      const own = page.data.items.find(item => item.content === content)
      if (!own) throw new Error('Test memo did not survive restart')
      page.onEdit({ currentTarget: { dataset: { id: own.id } } })
      page.onInput({ detail: { value: content + '_edited' } })
      await page.onSave()
      const edited = page.data.items.some(item => item.id === own.id && item.content === content + '_edited')
      return { error: page.data.error, survived: true, edited, id: own.id }
    }, process.argv[2], marker)
    assert.equal(result.error, '')
    if (process.argv[2] === 'seed') assert.equal(result.saved, true)
    else {
      assert.equal(result.survived, true)
      assert.equal(result.edited, true)
      await mini.mockWxMethod('showModal', { confirm: true, cancel: false })
      try {
        const removed = await mini.evaluate(async id => {
          const page = getCurrentPages().slice(-1)[0]
          await page.onDelete({ currentTarget: { dataset: { id } } })
          return !page.data.error && !page.data.items.some(item => item.id === id)
        }, result.id)
        assert.equal(removed, true)
      } finally { await mini.restoreWxMethod('showModal') }
    }
    console.log(process.argv[2] === 'seed' ? 'PASS: native initialization and save' : 'PASS: restart persistence, edit and own-test-record cleanup')
  } finally { mini.disconnect(); clearTimeout(timeout) }
})().catch(error => { console.error(error); process.exitCode = 1; clearTimeout(timeout) })
