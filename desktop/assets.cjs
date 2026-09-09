const path = require('node:path')

const origin = 'lifehub://app'
const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' }

function resolveAsset(rawUrl, root) {
  const url = new URL(rawUrl)
  if (url.protocol !== 'lifehub:' || url.host !== 'app' || url.username || url.password) return null
  const pathname = decodeURIComponent(url.pathname)
  const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
  const relative = path.relative(root, file)
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null
  const mime = mimeTypes[path.extname(file)]
  return mime ? { file, mime } : null
}

module.exports = { origin, resolveAsset }
