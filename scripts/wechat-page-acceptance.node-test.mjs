import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vm from 'node:vm'

// Isolated compiled-page contracts, not simulator/phone UI acceptance.
const root = resolve(process.env.WECHAT_ARTIFACT_DIR || 'release/wechat')
const read = file => readFileSync(resolve(root, file), 'utf8')
const app = JSON.parse(read('app.json'))
const tabs = new Set(app.tabBar.list.map(tab => tab.pagePath))
const types = ['temporaryTasks', 'literatureItems', 'experiments', 'papers', 'paperSections', 'fitnessPlans', 'fitnessExercises', 'dietEntries', 'leisureItems', 'guitarTracks', 'guitarPracticePlans']
async function launch(path, query = {}) {
  const disk = new Map()
  const exports = {}
  const wx = {
    getStorageSync: key => disk.get(key) ?? '',
    setStorageSync: (key, value) => disk.set(key, value),
    removeStorageSync: key => disk.delete(key),
    getStorageInfoSync: () => ({ keys: [...disk.keys()], currentSize: 0, limitSize: 10240 }),
  }
  vm.runInNewContext(read('runtime.js'), { exports, wx }, { timeout: 3000 })
  let page
  vm.runInNewContext(read(`${path}.js`), {
    require: name => { assert.equal(name, '../../runtime.js'); return exports },
    Page: definition => { page = definition },
  })
  page.setData = patch => Object.assign(page.data, patch)
  await page.onLoad?.(query)
  await page.onShow?.()
  return { page, disk }
}
function checkRoute(url, tab = false) {
  const [path, search = ''] = url.replace(/^\//, '').split('?')
  assert.ok(app.pages.includes(path), `unregistered route: ${url}`)
  assert.equal(tabs.has(path), tab, `wrong navigation mode: ${url}`)
  if (path === 'pages/records/index') {
    assert.ok(types.includes(new URLSearchParams(search).get('type')), `missing/unknown form: ${url}`)
  }
}

for (const path of app.pages.filter(path => path !== 'pages/records/index')) {
  test(`compiled page initializes without storage writes: ${path}`, async () => {
    const { page, disk } = await launch(path)
    assert.equal(page.data.error || '', '')
    assert.equal(page.data.busy || false, false)
    assert.equal(disk.size, 0, 'opening a page must not silently overwrite storage')
    assert.ok(read(`${path}.wxml`).length)
    JSON.parse(read(`${path}.json`))
  })
}
for (const type of types) {
  test(`compiled form initializes and exposes fields: ${type}`, async () => {
    const { page, disk } = await launch('pages/records/index', { type })
    assert.equal(page.data.error, '')
    assert.equal(page.data.type, type)
    assert.ok(page.data.title)
    assert.ok(page.data.fields.length > 0)
    assert.equal(new Set(page.data.fields.map(field => field.key)).size, page.data.fields.length)
    for (const field of page.data.fields) {
      assert.ok(field.label)
      if (['choice', 'parent'].includes(field.kind)) {
        assert.equal(field.labels.length, field.values.length)
        assert.ok(field.index >= 0 && field.index < field.labels.length)
      }
    }
    for (const child of page.data.children) checkRoute(`/pages/records/index?type=${child.table}`)
    assert.equal(disk.size, 0)
  })
}
test('all static and module navigation targets use registered pages and correct tab modes', async () => {
  for (const path of app.pages) {
    for (const match of read(`${path}.wxml`).matchAll(/<navigator\b([^>]+)>/g)) {
      const url = match[1].match(/\burl="([^"]+)"/)?.[1]
      if (url && !url.includes('{{')) checkRoute(url, /open-type="switchTab"/.test(match[1]))
    }
  }
  const { page } = await launch('pages/home/index')
  assert.equal(page.data.modules.length, 8)
  for (const entry of page.data.modules) checkRoute(entry.route, entry.tab)
})
test('all eleven form types are reachable through static, module or child entries', async () => {
  const reachable = new Set(['fitnessPlans']) // registered fitness tab defaults to this form
  for (const path of app.pages) {
    for (const match of read(`${path}.wxml`).matchAll(/type=([a-zA-Z]+)/g)) reachable.add(match[1])
  }
  for (const module of (await launch('pages/home/index')).page.data.modules) {
    const type = new URLSearchParams(module.route.split('?')[1]).get('type')
    if (type) reachable.add(type)
  }
  for (const type of reachable) {
    if (!types.includes(type)) continue
    for (const child of (await launch('pages/records/index', { type })).page.data.children) reachable.add(child.table)
  }
  assert.deepEqual([...reachable].sort(), [...types].sort())
  assert.equal((await launch('pages/fitness/index')).page.data.type, 'fitnessPlans')
})
