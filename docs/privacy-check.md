# 离线与隐私检查

检查日期：2026-09-05。

## 隐私边界

- 所有业务记录仅写入应用内 IndexedDB 数据库 `personal-life-hub`；桌面版数据位于固定的本机用户数据目录。
- Android 版不申请联网权限并关闭系统云备份；手机数据仅位于当前 APP 的本地存储中。
- 应用不包含登录、云同步、分析埋点、广告、业务 API 或遥测代码。
- 字体使用本机系统字体；构建产物不引用 CDN、远程字体、远程图片或远程脚本。
- 备份文件只在用户主动导出时生成，只在用户主动选择文件并确认后导入。
- 桌面页面启用 Chromium 沙箱与上下文隔离，无法访问 Node.js；权限请求、新窗口、外部导航和外网请求均被拒绝。

## 自动检查

- `pnpm audit:dist` 递归扫描 `dist` 中的 HTML、CSS、JavaScript、JSON、source map 与 SVG；发现远程资源属性、CSS URL、Fetch/Beacon、WebSocket/EventSource 或 XMLHttpRequest 调用即失败。库内错误帮助链接、URL 校验常量以及 SVG/XML 标准命名空间不属于网络请求，但仍已人工逐项核查。
- `e2e/network-audit.spec.ts` 监听首页和七个主模块的全部浏览器请求，并在写入业务记录后确认没有非 localhost 请求。
- `e2e/offline.spec.ts` 先加载本地应用资源，再开启 Chromium 离线模式，在完全断网状态完成备忘新增、编辑、跨页查看。
- `scripts/mobile-project.node-test.mjs` 检查 Android 无联网权限、禁止云备份、关闭混合内容与生产 WebView 调试。
- `e2e/mobile.spec.ts` 验证手机导航、全部模块触达、安全区留白、触控尺寸和无页面级横向滚动。
- `desktop/assets.test.cjs` 验证自定义协议只允许读取打包的静态资源，拒绝外部主机、凭据、目录越界和未允许的文件类型。
- `desktop-tests/desktop.spec.ts` 启动打包后的 EXE，验证八模块、沙箱、外网阻断、备份恢复和退出重开后的持久化。

上述检查已纳入 `pnpm verify`，不能通过删除测试或放宽断言绕过。
