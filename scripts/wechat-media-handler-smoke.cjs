const assert = require('node:assert/strict')
const automator = require(process.env.WECHAT_AUTOMATOR_PATH || 'D:/软件/.cache/wechat-automation/node_modules/miniprogram-automator')
const timer = setTimeout(() => { console.error('Handler verification timeout'); process.exit(1) }, 30000)
;(async () => {
  const mini = await automator.connect({ wsEndpoint: process.env.WECHAT_WS || 'ws://127.0.0.1:9430' })
  let id
  try {
    const navigation = await mini.evaluate(() => new Promise(resolve => wx.navigateTo({
      url: '/pages/media/index', success: () => resolve('success'), fail: error => resolve(error.errMsg),
    })))
    assert.equal(navigation, 'success', 'media navigation callback')
    const saved = await mini.evaluate(async title => {
      const page = getCurrentPages().slice(-1)[0]
      if (page.route !== 'pages/media/index') throw new Error('Wrong page')
      page.onField({ currentTarget: { dataset: { field: 'title' } }, detail: { value: title } })
      page.onStage({ detail: { value: '4' } })
      await page.onSave()
      const own = page.data.items.find(item => item.title === title)
      return { error: page.data.error, id: own?.id, stage: own?.stage }
    }, `__media_handler_${Date.now()}`)
    id = saved.id
    assert.equal(saved.error, '')
    assert.ok(id)
    assert.equal(saved.stage, 'published')
    const filtered = await mini.evaluate(() => {
      const page = getCurrentPages().slice(-1)[0]
      page.onFilter({ detail: { value: '1' } })
      return page.data.items.every(item => item.stage === 'idea')
    })
    assert.equal(filtered, true)
    console.log('PASS: native media handler save and stage filtering')
  } finally {
    if (id) {
      await mini.mockWxMethod('showModal', { confirm: true, cancel: false })
      try {
        const removed = await mini.evaluate(async recordId => {
          const page = getCurrentPages().slice(-1)[0]
          await page.onDelete({ currentTarget: { dataset: { id: recordId } } })
          page.onFilter({ detail: { value: '0' } })
          return !page.data.error && !page.data.items.some(item => item.id === recordId)
        }, id)
        assert.equal(removed, true)
        console.log('PASS: own media test record removed')
      } finally { await mini.restoreWxMethod('showModal') }
    }
    mini.disconnect()
    clearTimeout(timer)
  }
})().catch(error => { console.error(error); clearTimeout(timer); process.exitCode = 1 })
