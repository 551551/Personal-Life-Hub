const assert = require('node:assert/strict')
const automator = require(process.env.WECHAT_AUTOMATOR_PATH || 'D:/软件/.cache/wechat-automation/node_modules/miniprogram-automator')
const timer = setTimeout(() => { console.error('Full module validation timed out; inspect generated test records before rerunning'); process.exit(1) }, 180000)
;(async () => {
  const mini = await automator.connect({ wsEndpoint: process.env.WECHAT_WS || 'ws://127.0.0.1:9430' })
  const marker = `__main_modules_${Date.now()}`
  const created = []
  const parents = {}
  let projectId
  async function route(url, tab = false) {
    const result = await mini.evaluate((path, isTab) => new Promise(resolve => {
      const options = { url: path, success: () => resolve(''), fail: error => resolve(error.errMsg) }
      if (isTab) wx.switchTab(options); else wx.redirectTo(options)
    }), url, tab)
    assert.equal(result, '', `navigation ${url}`)
    for (let attempt = 0; attempt < 40; attempt++) {
      const ready = await mini.evaluate(path => {
        const p = getCurrentPages().slice(-1)[0]
        return p && p.route === path.split('?')[0].slice(1) && !p.data.busy
      }, url)
      if (ready) return
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error(`Navigation did not settle: ${url}`)
  }
  try {
    await route('/pages/research/index', true)
    projectId = await mini.evaluate(async title => {
      const p = getCurrentPages().slice(-1)[0]
      if (p.route !== 'pages/research/index') throw new Error('Research navigation failed')
      p.onField({ currentTarget: { dataset: { group: 'project', field: 'name' } }, detail: { value: title } })
      p.onField({ currentTarget: { dataset: { group: 'project', field: 'startDate' } }, detail: { value: '2026-09-07' } })
      await p.onSaveProject()
      if (p.data.error) throw new Error(p.data.error)
      return p.data.projects.find(row => row.name === title)?.id
    }, marker)
    assert.ok(projectId)
    parents.researchProjects = projectId
    for (const type of ['temporaryTasks', 'fitnessPlans', 'fitnessExercises', 'dietEntries', 'guitarTracks', 'guitarPracticePlans', 'leisureItems', 'literatureItems', 'experiments', 'papers', 'paperSections']) {
      await route(`/pages/records/index?type=${type}`)
      const result = await mini.evaluate(async (type, title, parentIds) => {
        const p = getCurrentPages().slice(-1)[0]
        if (p.route !== 'pages/records/index' || p.data.type !== type) throw new Error('Record route mismatch')
        for (const f of [...p.data.fields]) {
          if (f.kind === 'parent') {
            const index = f.values.indexOf(parentIds[f.parent])
            if (index < 1) throw new Error('Missing synthetic parent')
            p.onChoice({ currentTarget: { dataset: { key: f.key } }, detail: { value: String(index) } })
          } else if (['title', 'name', 'foodName'].includes(f.key)) p.onField({ currentTarget: { dataset: { key: f.key } }, detail: { value: title } })
        }
        await p.onSave()
        return { error: p.data.error, id: p.data.items.find(row => row.title === title)?.id }
      }, type, `${marker}_${type}`, parents)
      if (result.id) created.push({ type, id: result.id })
      assert.equal(result.error, '', type)
      assert.ok(result.id, type)
      parents[type] = result.id
      console.log(`PASS: ${type} native form save`)
    }
    await route('/pages/today/index', true)
    const today = await mini.evaluate(async id => {
      const p = getCurrentPages().slice(-1)[0]
      await p.onShow()
      const exists = p.data.plans.some(row => row.sourceType === 'fitness' && row.sourceId === id)
      await p.onToggle({ currentTarget: { dataset: { source: 'fitness', id, status: 'pending' } } })
      return { exists, error: p.data.error, completed: p.data.plans.some(row => row.sourceId === id && row.status === 'completed') }
    }, parents.fitnessPlans)
    assert.equal(today.error, '')
    assert.equal(today.exists, true)
    assert.equal(today.completed, true)
    await route('/pages/home/index', true)
    assert.equal(await mini.evaluate(async () => { const p = getCurrentPages().slice(-1)[0]; await p.onShow(); return p.data.modules.length }), 8)
    await route('/pages/settings/index')
    assert.equal(await mini.evaluate(() => { const p = getCurrentPages().slice(-1)[0]; p.onShow(); return p.data.error }), '')
    console.log('PASS: all eight module entries, today writeback and settings initialization')
  } finally {
    await mini.mockWxMethod('showModal', { confirm: true, cancel: false })
    try {
      for (const record of created.reverse()) {
        await route(`/pages/records/index?type=${record.type}`)
        const error = await mini.evaluate(async id => { const p = getCurrentPages().slice(-1)[0]; await p.onDelete({ currentTarget: { dataset: { id } } }); return p.data.error }, record.id)
        assert.equal(error, '', `cleanup ${record.type}`)
      }
      if (projectId) {
        await route('/pages/research/index', true)
        assert.equal(await mini.evaluate(async id => { const p = getCurrentPages().slice(-1)[0]; await p.onDeleteProject({ currentTarget: { dataset: { id } } }); return p.data.error }, projectId), '')
      }
      console.log('PASS: removed only generated test records')
    } finally { await mini.restoreWxMethod('showModal'); await route('/pages/home/index', true); mini.disconnect(); clearTimeout(timer) }
  }
})().catch(error => { console.error(error); clearTimeout(timer); process.exitCode = 1 })
