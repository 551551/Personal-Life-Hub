# GitHub 源码快照说明

这是个人工作生活中心的完整多端源码快照，不是安装包，也不是 Git 历史备份。

## 包含内容

- `src/`：网页与桌面、Android 复用的界面、业务逻辑、本地数据库。
- `desktop/` 和 `electron-builder.yml`：Windows Electron 容器与安装器。
- `android/` 和 `capacitor.config.ts`：Android 原生工程与 Capacitor 配置。
- `wechat/`：微信小程序页面、运行逻辑和测试。
- 构建配置、锁文件、测试、文档和素材。

以 `SOURCE-SNAPSHOT.json` 中的提交为基线，读取打包时工作目录中的实际文件，包含其中列出的未提交修改。不包含 `.git`、安装包、依赖、构建缓存、真实业务数据、环境密钥或本机 Android SDK 路径配置。原仓库未被修改或上传。

## 如何放到 GitHub

解压后，上传 `personal-life-hub` 文件夹内的源文件，而不是仅把 ZIP 当作一个文件上传。此包没有提交历史，导入新仓库将从新历史开始。

若希望保留原来的所有提交和版本标签，应使用原项目的本地 Git 仓库连接 GitHub 后推送，而不是依靠这个 ZIP。正式推送前还需单独审核提交历史是否含敏感信息；本包检查不代表对全部历史的安全审计。

在公开发布前，请检查文档中的本机路径、公开 AppID、应用身份和图片素材是否适合公开；未自动添加开源许可证。私有仓库也可用于备份。

官方说明：https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github

## 本地启动

安装与 `package.json` 匹配的 Node.js/pnpm 环境后，在源码根目录执行：

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd start
```

构建网页：`pnpm.cmd build`。

Windows 打包：`pnpm.cmd desktop:dist`（需要相应构建环境，首次构建可能下载 Electron 组件）。

Android：见 `docs/mobile-app.md`，需配置自己的 Android SDK/JDK；当前工程没有正式发布签名密钥。

微信小程序：`pnpm.cmd verify:wechat`；原生自动化需安装微信开发者工具并设置本机路径，详见相关交付文档。

安装包被有意排除，因此 README 中旧安装包路径不会随本源码包附带。不同端数据仍独立保存在设备上；不要把上传源码当作备份个人业务记录。
