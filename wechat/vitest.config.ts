import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'node', include: ['wechat/tests/**/*.test.ts'] },
})
