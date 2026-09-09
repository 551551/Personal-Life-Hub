const assert = require('node:assert/strict')
const automator = require(process.env.WECHAT_AUTOMATOR_PATH || 'D:/软件/.cache/wechat-automation/node_modules/miniprogram-automator')
const timer = setTimeout(() => process.exit(1), 20000)
;(async () => {
  const mini = await automator.connect({ wsEndpoint: process.env.WECHAT_WS || 'ws://127.0.0.1:9430' })
  try {
    const result = await mini.evaluate(async name => {
      const fs = wx.getFileSystemManager()
      const filePath = `${wx.env.USER_DATA_PATH}/${name}.json`
      const text = JSON.stringify({ synthetic: true, content: '中文备份文件读写验证' })
      const call = (method, options) => new Promise((resolve, reject) => fs[method]({ ...options, success: resolve, fail: reject }))
      await call('writeFile', { filePath, data: text, encoding: 'utf8' })
      try {
        const result = await call('readFile', { filePath, encoding: 'utf8' })
        return result.data === text
      } finally { await call('unlink', { filePath }) }
    }, `__file_smoke_${Date.now()}`)
    assert.equal(result, true)
    console.log('PASS: native UTF-8 file write/read; only its synthetic file removed; no file shared')
  } finally { mini.disconnect(); clearTimeout(timer) }
})().catch(error => { console.error(error); clearTimeout(timer); process.exitCode = 1 })
