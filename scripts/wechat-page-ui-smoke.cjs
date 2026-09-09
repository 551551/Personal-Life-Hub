const assert = require('node:assert/strict')
const { mkdirSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const automator = require(process.env.WECHAT_AUTOMATOR_PATH || 'D:/软件/.cache/wechat-automation/node_modules/miniprogram-automator')
const directory = resolve('release', 'wechat-page-acceptance')
mkdirSync(directory, { recursive: true })
const timer = setTimeout(() => { console.error('FAIL: native UI sweep timeout'); process.exit(1) }, 180000)
const scenarios = [
  ...['home', 'today', 'research', 'fitness', 'more'].map(name => ({ name, path: `pages/${name}/index`, tab: true })),
  ...['memos', 'media', 'settings'].map(name => ({ name, path: `pages/${name}/index` })),
  ...['temporaryTasks', 'literatureItems', 'experiments', 'papers', 'paperSections', 'fitnessPlans', 'fitnessExercises', 'dietEntries', 'leisureItems', 'guitarTracks', 'guitarPracticePlans']
    .map(name => ({ name, path: 'pages/records/index', query: `?type=${name}` })),
]
;(async () => {
  const mini = await automator.connect({ wsEndpoint: process.env.WECHAT_WS || 'ws://127.0.0.1:9430' })
  // Record only protocol method names, never user data or response payloads.
  const send = mini.connection.send.bind(mini.connection)
  mini.connection.send = async (method, params) => {
    let deadline
    try {
      return await Promise.race([
        send(method, params),
        new Promise((_, reject) => { deadline = setTimeout(() => reject(new Error(`Protocol timeout: ${method}`)), 15000) }),
      ])
    } finally { clearTimeout(deadline) }
  }
  const results = []
  try {
    for (const scene of scenarios) {
      console.log(`CHECK: ${scene.name}`)
      const started = Date.now()
      const navigation = await mini.evaluate((url, tab) => new Promise(resolve => {
        wx[tab ? 'switchTab' : 'navigateTo']({ url, success: () => resolve('success'), fail: error => resolve(error.errMsg) })
      }), `/${scene.path}${scene.query || ''}`, !!scene.tab)
      assert.equal(navigation, 'success', scene.name)
      let ready = false
      for (let attempt = 0; attempt < 50 && !ready; attempt++) {
        ready = await mini.evaluate(path => {
          const page = getCurrentPages().slice(-1)[0]
          return page && page.route === path && !page.data.busy
        }, scene.path)
        if (!ready) await new Promise(resolve => setTimeout(resolve, 100))
      }
      assert.ok(ready, `${scene.name}: lifecycle timeout`)
      const page = await mini.currentPage()
      assert.equal(page.path, scene.path)
      const error = await page.data('error')
      assert.ok(!error, `${scene.name}: unexpected initialization error`)
      const heading = await page.$('.heading')
      assert.ok(heading, `${scene.name}: missing rendered heading`)
      assert.ok((await heading.text()).trim())
      const controls = await page.$$('input, textarea, picker, button, navigator')
      assert.ok(controls.length > 0, `${scene.name}: no rendered controls`)
      await mini.pageScrollTo(0)
      await mini.screenshot({ path: resolve(directory, `${scene.name}-top.png`) })
      await mini.pageScrollTo(100000)
      await mini.screenshot({ path: resolve(directory, `${scene.name}-bottom.png`) })
      results.push({ scene: scene.name, controls: controls.length, elapsedMs: Date.now() - started, result: 'passed' })
      console.log(`PASS: ${scene.name} navigation, rendered controls and top/bottom screenshots`)
      // Keep the stack bounded; a missing return callback remains a test failure.
      if (!scene.tab) {
        const back = await mini.evaluate(() => new Promise(resolve => wx.navigateBack({ success: () => resolve('success'), fail: e => resolve(e.errMsg) })))
        assert.equal(back, 'success', `${scene.name}: back navigation`)
      }
    }
    writeFileSync(resolve(directory, 'result.json'), JSON.stringify({ timestamp: new Date().toISOString(), scope: 'native navigation/rendering; does not assert every control behavior', results }, null, 2))
  } finally { mini.disconnect(); clearTimeout(timer) }
})().catch(error => { console.error(error); clearTimeout(timer); process.exitCode = 1 })
