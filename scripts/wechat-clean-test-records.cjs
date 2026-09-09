// Explicit recovery for a failed smoke run, never clears storage or arbitrary records.
const assert = require('node:assert/strict')
const automator = require(process.env.WECHAT_AUTOMATOR_PATH || 'D:/软件/.cache/wechat-automation/node_modules/miniprogram-automator')
const marker = process.argv[2]
assert.match(marker || '', /^__main_modules_\d+$/)
const timer = setTimeout(() => process.exit(1), 90000)
;(async () => {
  const mini = await automator.connect({ wsEndpoint: process.env.WECHAT_WS || 'ws://127.0.0.1:9430' })
  try {
    await mini.mockWxMethod('showModal', { confirm: true, cancel: false })
    for (const type of ['paperSections', 'papers', 'experiments', 'literatureItems', 'leisureItems', 'guitarPracticePlans', 'guitarTracks', 'dietEntries', 'fitnessExercises', 'fitnessPlans', 'temporaryTasks', 'researchProjects']) {
      const research = type === 'researchProjects'
      const path = research ? '/pages/research/index' : `/pages/records/index?type=${type}`
      await mini.evaluate((url, tab) => { if (tab) wx.switchTab({ url }); else wx.redirectTo({ url }) }, path, research)
      let ready = false
      for (let n = 0; n < 50 && !ready; n++) {
        await new Promise(resolve => setTimeout(resolve, 100))
        ready = await mini.evaluate((type, tab) => { const p = getCurrentPages().slice(-1)[0]; return p && !p.data.busy && (tab ? p.route === 'pages/research/index' : p.route === 'pages/records/index' && p.data.type === type) }, type, research)
      }
      assert.ok(ready, type)
      const result = await mini.evaluate(async (marker, type, research) => {
        const p = getCurrentPages().slice(-1)[0]
        const matches = (research ? p.data.projects : p.data.items).filter(r => research ? r.name === marker : r.title === `${marker}_${type}`)
        for (const row of matches) {
          const event = { currentTarget: { dataset: { id: row.id } } }
          if (research) await p.onDeleteProject(event); else await p.onDelete(event)
          if (p.data.error) throw new Error(p.data.error)
        }
        return matches.length
      }, marker, type, research)
      console.log(`Removed ${result} exact synthetic ${type} records`)
    }
  } finally { await mini.restoreWxMethod('showModal'); mini.disconnect(); clearTimeout(timer) }
})().catch(error => { console.error(error); clearTimeout(timer); process.exitCode = 1 })
