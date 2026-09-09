const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { resolveAsset } = require('./assets.cjs')
const root = path.resolve('dist')

test('serves only packaged app resources', () => {
  assert.equal(resolveAsset('lifehub://app/', root).file, path.join(root, 'index.html'))
  assert.equal(resolveAsset('lifehub://app/assets/main.js', root).mime, 'text/javascript')
})
test('rejects external hosts, credentials, traversal and non-assets', () => {
  for (const url of ['https://app/index.html', 'lifehub://evil/index.html', 'lifehub://user@app/index.html', 'lifehub://app/..%5cpackage.json', 'lifehub://app/%2e%2e%2fsecret.js', 'lifehub://app/package.json']) {
    assert.equal(resolveAsset(url, root), null, url)
  }
})
