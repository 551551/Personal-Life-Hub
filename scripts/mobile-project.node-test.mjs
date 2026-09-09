import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('Capacitor uses the production bundle and a stable application id', async () => {
  const config = await read('capacitor.config.ts')
  assert.match(config, /appId: 'com\.personallifehub\.app'/)
  assert.match(config, /webDir: 'dist'/)
  assert.match(config, /allowMixedContent: false/)
  assert.match(config, /webContentsDebuggingEnabled: false/)
})

test('Android project keeps personal data local and requests no internet permission', async () => {
  const manifest = await read('android/app/src/main/AndroidManifest.xml')
  assert.match(manifest, /android:allowBackup="false"/)
  assert.doesNotMatch(manifest, /android\.permission\.INTERNET/)
})

test('Android compatibility starts at API 24', async () => {
  const variables = await read('android/variables.gradle')
  assert.match(variables, /minSdkVersion = 24/)
})

test('Android native tests use the production application id', async () => {
  const contextTest = await read('android/app/src/androidTest/java/com/personallifehub/app/ApplicationContextTest.java')
  assert.match(contextTest, /com\.personallifehub\.app/)
  assert.doesNotMatch(contextTest, /com\.getcapacitor/)
})
