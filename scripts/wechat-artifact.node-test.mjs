import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import vm from 'node:vm'

const directory = resolve(process.env.WECHAT_ARTIFACT_DIR || 'release/wechat')
const runtime = readFileSync(join(directory, 'runtime.js'), 'utf8')

test('runtime initializes when the platform Function constructor returns a non-callable object', async () => {
  const disk = new Map()
  const exports = {}
  let probes = 0
  const context = vm.createContext({ exports, Function: function () { probes++; return {} }, wx: {
    getStorageSync: key => disk.get(key) ?? '',
    setStorageSync: (key, value) => disk.set(key, value),
    removeStorageSync: key => disk.delete(key),
    getStorageInfoSync: () => ({ keys: [...disk.keys()], currentSize: 0, limitSize: 10240 }),
  } })
  vm.runInContext(runtime, context)
  const page = exports.memoPage()
  page.setData = patch => Object.assign(page.data, patch)
  page.onShow()
  assert.equal(page.data.error, '')
  page.onInput({ detail: { value: '微信动态函数限制回归' } })
  await page.onSave()
  assert.equal(page.data.notice, '已保存到当前设备')
  assert.equal(probes, 0, 'Mini-program must not attempt dynamic compilation, including probes')
})

test('built runtime saves and reloads without browser, Node globals or dynamic code generation', async () => {
  const disk = new Map()
  const launch = () => {
    const exports = {}
    const context = vm.createContext({ exports, wx: {
      getStorageSync: key => disk.get(key) ?? '',
      setStorageSync: (key, value) => disk.set(key, JSON.parse(JSON.stringify(value))),
      removeStorageSync: key => disk.delete(key),
      getStorageInfoSync: () => ({ keys: [...disk.keys()], currentSize: 0, limitSize: 10240 }),
      showModal: options => options.success({ confirm: true }),
    } }, { codeGeneration: { strings: false, wasm: false } })
    vm.runInContext(runtime, context, { timeout: 3000 })
    const page = exports.memoPage()
    page.setData = patch => Object.assign(page.data, patch)
    page.onShow()
    return page
  }
  const page = launch()
  assert.equal(page.data.error, '')
  page.onInput({ detail: { value: '产物环境中的备忘' } })
  await page.onSave()
  assert.equal(page.data.notice, '已保存到当前设备')
  assert.equal(launch().data.items[0].content, '产物环境中的备忘')
})

test('all native page bindings resolve to actual handlers', () => {
  const app = JSON.parse(readFileSync(join(directory, 'app.json'), 'utf8'))
  for (const page of app.pages) {
    let definition
    const exports = {}
    vm.runInNewContext(runtime, { exports })
    vm.runInNewContext(readFileSync(join(directory, `${page}.js`), 'utf8'), {
      require: name => { assert.equal(name, '../../runtime.js'); return exports },
      Page: value => { definition = value },
    })
    const readTemplate = path => {
      let text = readFileSync(path, 'utf8')
      for (const match of text.matchAll(/<include\s+src="([^"]+)"/g)) text += readTemplate(resolve(dirname(path), match[1]))
      return text
    }
    const template = readTemplate(join(directory, `${page}.wxml`))
    for (const match of template.matchAll(/(?:bind|catch)(?::)?\w+="(\w+)"/g)) {
      assert.equal(typeof definition[match[1]], 'function', `Missing handler ${match[1]}`)
    }
  }
})

test('artifact contains no source, backups, dependencies or private project configuration', () => {
  const visit = path => readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? visit(join(path, entry.name)) : [join(path, entry.name)])
  for (const file of visit(directory)) {
    assert.doesNotMatch(file, /(?:node_modules|\.git|backup|\.test\.|\.ts$|\.map$|project\.private)/)
  }
  const config = JSON.parse(readFileSync(join(directory, 'project.config.json'), 'utf8'))
  assert.equal(config.appid, 'wx3e05a9b25530c50a')
  assert.equal(config.setting.urlCheck, true)
})
