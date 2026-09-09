const assert = require('node:assert/strict')
const automator = require(process.env.WECHAT_AUTOMATOR_PATH || 'D:/软件/.cache/wechat-automation/node_modules/miniprogram-automator')
const timeout = setTimeout(() => { console.error('Research simulation timed out'); process.exit(1) }, 30000)
;(async () => {
  const mini = await automator.connect({ wsEndpoint: process.env.WECHAT_WS || 'ws://127.0.0.1:9430' })
  let projectId
  try {
    const navigation = await mini.evaluate(() => new Promise(resolve => wx.switchTab({
      url: '/pages/research/index', success: () => resolve('success'), fail: error => resolve(error.errMsg),
    })))
    assert.equal(navigation, 'success', 'research tab navigation callback')
    const saved = await mini.evaluate(async name => {
      const p = getCurrentPages().slice(-1)[0]
      if (p.route !== 'pages/research/index') throw new Error('Wrong research route')
      const field = (field, value) => p.onField({ currentTarget: { dataset: { group: 'project', field } }, detail: { value } })
      field('name', name); field('startDate', '2026-09-07')
      await p.onSaveProject()
      return { id: p.data.projects.find(item => item.name === name)?.id, error: p.data.error }
    }, `__research_smoke_${Date.now()}`)
    projectId = saved.id
    assert.equal(saved.error, '')
    assert.ok(projectId)
    const completed = await mini.evaluate(async id => {
      const p = getCurrentPages().slice(-1)[0]
      p.onSelect({ currentTarget: { dataset: { id } } })
      for (const [field, value] of [['title', '测试里程碑'], ['date', '2026-09-08']]) p.onField({ currentTarget: { dataset: { group: 'milestone', field } }, detail: { value } })
      await p.onSaveMilestone()
      const milestone = p.data.milestones[0]
      if (!milestone) return false
      p.onEditMilestone({ currentTarget: { dataset: { id: milestone.id } } })
      p.onCompleted({ detail: { value: true } })
      await p.onSaveMilestone()
      return !p.data.error && p.data.milestones[0].status === 'completed'
    }, projectId)
    assert.equal(completed, true)
    console.log('PASS: research project creation and milestone completion in simulator')
  } finally {
    if (projectId) {
      await mini.mockWxMethod('showModal', { confirm: true, cancel: false })
      try {
        const removed = await mini.evaluate(async id => {
          const p = getCurrentPages().slice(-1)[0]
          await p.onDeleteProject({ currentTarget: { dataset: { id } } })
          return !p.data.error && !p.data.projects.some(item => item.id === id) && !p.data.selectedId && !p.data.milestones.length
        }, projectId)
        assert.equal(removed, true)
        console.log('PASS: removed own project and its test milestone')
      } finally { await mini.restoreWxMethod('showModal') }
    }
    mini.disconnect()
    clearTimeout(timeout)
  }
})().catch(error => { console.error(error); clearTimeout(timeout); process.exitCode = 1 })
