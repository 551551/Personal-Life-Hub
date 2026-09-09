const assert = require('node:assert/strict')
const { mkdirSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const automator = require(process.env.WECHAT_AUTOMATOR_PATH || 'D:/软件/.cache/wechat-automation/node_modules/miniprogram-automator')
const directory = resolve('release/wechat-page-render')
mkdirSync(directory, { recursive: true })
const timer = setTimeout(() => { console.error('FAIL: render sweep timeout'); process.exit(1) }, 180000)
const scenes = [
  ...['home', 'today', 'research', 'fitness', 'more'].map(name => ({ name, path: `pages/${name}/index`, tab: true })),
  ...['memos', 'media', 'settings'].map(name => ({ name, path: `pages/${name}/index` })),
  ...['temporaryTasks', 'literatureItems', 'experiments', 'papers', 'paperSections', 'fitnessPlans', 'fitnessExercises', 'dietEntries', 'leisureItems', 'guitarTracks', 'guitarPracticePlans']
    .map(name => ({ name, path: 'pages/records/index', query: `?type=${name}` })),
]
;(async () => {
  const mini = await automator.connect({ wsEndpoint: process.env.WECHAT_WS || 'ws://127.0.0.1:9430' })
  const results = []
  try {
    for (const scene of scenes) {
      const navigation = await mini.evaluate((url, tab) => new Promise(resolve => wx[tab ? 'switchTab' : 'navigateTo']({
        url, success: () => resolve('success'), fail: e => resolve(e.errMsg),
      })), `/${scene.path}${scene.query || ''}`, !!scene.tab)
      assert.equal(navigation, 'success', scene.name)
      let state
      for (let attempt = 0; attempt < 50; attempt++) {
        state = await mini.evaluate(() => { const p = getCurrentPages().slice(-1)[0]; return { route: p.route, busy: !!p.data.busy, error: p.data.error || '' } })
        if (!state.busy) break
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      assert.deepEqual(state, { route: scene.path, busy: false, error: '' })
      // Real renderer geometry, not a mock DOM or source-code approximation.
      const geometry = await mini.evaluate(() => new Promise(resolve => {
        const query = wx.createSelectorQuery()
        query.select('.heading').boundingClientRect()
        query.selectAll('.panel').boundingClientRect()
        query.selectAll('.error').boundingClientRect()
        query.exec(rows => resolve({ heading: rows[0], panels: rows[1].length, errors: rows[2].length }))
      }))
      assert.ok(geometry.heading && geometry.heading.width > 0 && geometry.heading.height > 0, scene.name)
      assert.ok(geometry.panels > 0, scene.name)
      assert.equal(geometry.errors, 0, scene.name)
      await mini.pageScrollTo(0)
      await mini.screenshot({ path: resolve(directory, `${scene.name}-top.png`) })
      await mini.pageScrollTo(100000)
      await mini.screenshot({ path: resolve(directory, `${scene.name}-bottom.png`) })
      results.push({ scene: scene.name, panels: geometry.panels, result: 'passed' })
      console.log(`PASS: ${scene.name} native route, rendered geometry, scroll and screenshots`)
      if (!scene.tab) {
        const back = await mini.evaluate(() => new Promise(resolve => wx.navigateBack({ success: () => resolve('success'), fail: e => resolve(e.errMsg) })))
        assert.equal(back, 'success', `${scene.name}: return`)
      }
    }
    writeFileSync(resolve(directory, 'result.json'), JSON.stringify({ timestamp: new Date().toISOString(), scope: 'read-only native rendering; not physical control input', results }, null, 2))
  } finally { mini.disconnect(); clearTimeout(timer) }
})().catch(error => { console.error(error); clearTimeout(timer); process.exitCode = 1 })
