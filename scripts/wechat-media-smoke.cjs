const assert = require('node:assert/strict')
const automator = require(process.env.WECHAT_AUTOMATOR_PATH || 'D:/软件/.cache/wechat-automation/node_modules/miniprogram-automator')
const timer = setTimeout(() => { console.error('Media smoke timed out'); process.exit(1) }, 45000)
;(async () => {
  const mini = await automator.connect({ wsEndpoint: process.env.WECHAT_WS || 'ws://127.0.0.1:9430' })
  const marker = `__media_smoke_${Date.now()}`
  let id
  try {
    await mini.evaluate(() => { wx.reLaunch({ url: '/pages/memos/index' }) })
    await new Promise(resolve => setTimeout(resolve, 800))
    console.log('Navigation ready')
    const home = await mini.currentPage()
    const link = await home.$('navigator')
    assert.ok(link)
    await link.tap()
    await new Promise(resolve => setTimeout(resolve, 500))
    const page = await mini.currentPage()
    assert.equal(page.path, 'pages/media/index')
    const title = await page.$('#media-title')
    assert.ok(title)
    await title.input(marker)
    await (await page.$('#media-platforms')).input('视频号，B站')
    await (await page.$('#views')).input('123')
    await (await page.$('button.primary')).tap()
    const saved = await mini.evaluate(content => {
      const p = getCurrentPages().slice(-1)[0]
      const item = p.data.items.find(row => row.title === content)
      return { id: item?.id, error: p.data.error, views: item?.metrics.views, platforms: item?.platforms }
    }, marker)
    id = saved.id
    assert.equal(saved.error, '')
    assert.ok(id)
    assert.equal(saved.views, 123)
    assert.deepEqual(saved.platforms, ['视频号', 'B站'])
    await mini.evaluate(() => { wx.reLaunch({ url: '/pages/media/index' }) })
    await new Promise(resolve => setTimeout(resolve, 800))
    const check = await mini.evaluate(recordId => {
      const p = getCurrentPages().slice(-1)[0]
      const exists = p.data.items.some(item => item.id === recordId)
      p.onEdit({ currentTarget: { dataset: { id: recordId } } })
      p.onStage({ detail: { value: '4' } })
      return { exists, editing: p.data.editingId === recordId }
    }, id)
    assert.deepEqual(check, { exists: true, editing: true })
    await mini.evaluate(async () => { await getCurrentPages().slice(-1)[0].onSave() })
    assert.equal(await mini.evaluate(recordId => getCurrentPages().slice(-1)[0].data.items.find(item => item.id === recordId)?.stage, id), 'published')
    console.log('PASS: native navigation, input, save, page reload and publishing stage update')
  } finally {
    if (id) {
      await mini.mockWxMethod('showModal', { confirm: true, cancel: false })
      try {
        const removed = await mini.evaluate(async recordId => {
          const p = getCurrentPages().slice(-1)[0]
          await p.onDelete({ currentTarget: { dataset: { id: recordId } } })
          return !p.data.error && !p.data.items.some(item => item.id === recordId)
        }, id)
        assert.equal(removed, true)
        console.log('PASS: removed only the generated media test record')
      } finally { await mini.restoreWxMethod('showModal') }
    }
    mini.disconnect()
    clearTimeout(timer)
  }
})().catch(error => { console.error(error); clearTimeout(timer); process.exitCode = 1 })
