import { build } from 'vite'
import { cp, mkdir, readdir, readFile } from 'node:fs/promises'
import { resolve, join, extname } from 'node:path'

const source = resolve('wechat')
const output = resolve(process.env.WECHAT_ARTIFACT_DIR || 'release/wechat')
const allowed = new Set(['.js', '.json', '.wxml', '.wxss', '.png'])
await mkdir(output, { recursive: true })
// Existing output is not recursively removed: user files must never be erased.
await build({
  configFile: false,
  publicDir: false,
  build: {
    outDir: output, emptyOutDir: false, target: 'es2017', minify: true,
    lib: { entry: join(source, 'entry.ts'), formats: ['cjs'], fileName: () => 'runtime.js' },
  },
})
async function copyAssets(directory, relative = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'tests' || entry.name === 'core' || entry.name === 'tsconfig.json' || entry.name.startsWith('project.private')) continue
    const rel = join(relative, entry.name)
    if (entry.isDirectory()) await copyAssets(join(directory, entry.name), rel)
    else if (allowed.has(extname(entry.name))) {
      await mkdir(resolve(output, relative), { recursive: true })
      await cp(join(directory, entry.name), join(output, rel))
    }
  }
}
await copyAssets(source)
const config = JSON.parse(await readFile(join(output, 'project.config.json'), 'utf8'))
if (config.appid !== 'wx3e05a9b25530c50a') throw new Error('Unexpected AppID')
const app = JSON.parse(await readFile(join(output, 'app.json'), 'utf8'))
for (const page of app.pages) {
  for (const extension of ['js', 'wxml', 'json']) await readFile(join(output, `${page}.${extension}`))
}
console.log(`小程序工程已生成：${output}`)
