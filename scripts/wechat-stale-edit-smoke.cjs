const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const automator = require(process.env.WECHAT_AUTOMATOR_PATH || 'D:/软件/.cache/wechat-automation/node_modules/miniprogram-automator')
const timer = setTimeout(() => process.exit(1), 60000)
;(async () => {
  const mini = await automator.connect({ wsEndpoint: process.env.WECHAT_WS || 'ws://127.0.0.1:9430' })
  async function navigate(url, method) {
    const outcome = await mini.evaluate((url, method) => new Promise(resolve => {
      wx[method]({ url, success: () => resolve(''), fail: error => resolve(error.errMsg) })
    }), url, method)
    assert.equal(outcome, '', `navigation ${url}`)
  }
  try {
    const id = randomUUID()
    await navigate(`/pages/records/index?type=temporaryTasks&id=${id}`, 'navigateTo')
    let ready = false
    for (let attempt = 0; attempt < 50 && !ready; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100))
      ready = await mini.evaluate(id => {
        const p = getCurrentPages().slice(-1)[0]
        return p && p.route === 'pages/records/index' && p.data.editingId === id
      }, id)
    }
    assert.ok(ready, 'Stale editor page must finish loading before verification')
    const result = await mini.evaluate(async id => {
      const p = getCurrentPages().slice(-1)[0]
      if (p.route !== 'pages/records/index' || p.data.editingId !== id) throw new Error('Stale editor page not loaded')
      const count = p.data.total
      const rejected = p.data.error.includes('不存在') && p.data.fields.length === 0
      if (!rejected) throw new Error('Missing record was not rejected')
      await p.onSave()
      const protectedSave = p.data.total === count && !!p.data.error
      p.onCancel()
      return { rejected, protectedSave, canCreateExplicitly: !p.data.editingId && p.data.fields.length > 0 && !p.data.error }
    }, id)
    assert.deepEqual(result, { rejected: true, protectedSave: true, canCreateExplicitly: true })
    console.log('PASS: native stale editor rejects saving and allows explicit cancellation; no records created')
    for (const scene of [
      { route: 'pages/memos/index', edit: 'onEdit', save: 'onSave', cancel: 'onCancel', key: 'editingId' },
      { route: 'pages/media/index', edit: 'onEdit', save: 'onSave', cancel: 'onCancel', key: 'editingId' },
      { route: 'pages/research/index', edit: 'onEditProject', save: 'onSaveProject', cancel: 'onCancelProject', key: 'projectId' },
      { route: 'pages/research/index', edit: 'onEditMilestone', save: 'onSaveMilestone', cancel: 'onCancelMilestone', key: 'milestoneId' },
    ]) {
      await navigate('/' + scene.route, scene.route === 'pages/research/index' ? 'switchTab' : 'redirectTo')
      let loaded = false
      for (let attempt = 0; attempt < 50 && !loaded; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100))
        loaded = await mini.evaluate(route => { const p = getCurrentPages().slice(-1)[0]; return p && p.route === route && !p.data.busy }, scene.route)
      }
      assert.ok(loaded, scene.route)
      const safe = await mini.evaluate(async (scene, id) => {
        const p = getCurrentPages().slice(-1)[0]
        p[scene.edit]({ currentTarget: { dataset: { id } } })
        if (p.data[scene.key] !== id || !p.data.error.includes('不存在')) throw new Error('Missing target not rejected')
        await p[scene.save]()
        const rejected = !!p.data.error
        p[scene.cancel]()
        return rejected && p.data[scene.key] === '' && !p.data.error
      }, scene, randomUUID())
      assert.equal(safe, true, scene.edit)
      console.log(`PASS: ${scene.route} ${scene.edit} stale-target protection; no records created`)
    }
  } finally { mini.disconnect(); clearTimeout(timer) }
})().catch(error => { console.error(error); clearTimeout(timer); process.exitCode = 1 })
