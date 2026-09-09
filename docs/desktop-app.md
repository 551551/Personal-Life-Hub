# Windows 桌面版

## 安装与启动

双击 `release/PersonalLifeHub-Setup-1.0.0.exe`，按向导完成安装。
安装器会创建桌面与开始菜单快捷方式“个人工作生活中心”。之后双击快捷方式即可打开独立窗口，不需要浏览器、Node.js、pnpm、终端或本地服务器。

也可以打开 `release/win-unpacked/PersonalLifeHub.exe` 直接使用。此方式必须保留整个 `win-unpacked` 文件夹，不能只复制 EXE。

安装包包含全部运行环境，安装后可断网使用。当前产物为 Windows x64 版本。
这是本机生成的未签名个人应用；Windows 可能显示未知发布者，未配置商业代码签名证书。

## 数据保存与旧版迁移

桌面版使用固定目录 `%APPDATA%\PersonalLifeHub` 保存数据，与程序安装目录分离。
关闭窗口会退出应用；重新打开继续读取原数据。覆盖安装新版或移动免安装文件夹不会改变数据目录。
卸载程序默认保留数据；不要手动删除该目录，除非确定已备份或不再需要记录。

浏览器版的数据不会自动出现在桌面版：

1. 在原浏览器、原地址 `http://127.0.0.1:4173` 打开旧版。
2. 进入“数据与设置”，点击“导出完整备份”。
3. 在桌面版进入“数据与设置”，点击“导入备份”并选择 JSON 文件。
4. 预检通过后确认恢复，再检查各模块内容。恢复会覆盖桌面版当前数据。

## 开发与重新打包

使用 Node.js 22.12 或更高版本及项目固定的 pnpm 版本。PowerShell 中建议调用 `pnpm.cmd`。

```powershell
pnpm.cmd install --frozen-lockfile
node node_modules/electron/install.js
pnpm.cmd desktop:dist
pnpm.cmd test:desktop
```

Electron 的安装脚本仅下载官方运行时并校验校验和。依赖构建脚本仅允许 Electron。
遇到缓存跨磁盘错误时，在当前 PowerShell 设置 `$env:ELECTRON_BUILDER_CACHE` 为项目所在磁盘的缓存目录后重试。

## 实现与安全边界

使用 `lifehub://app` 自定义本地协议加载内置静态资源，不监听网络端口。
桌面窗口启用沙箱、上下文隔离和 Web 安全，关闭 Node.js 页面访问，拒绝外网请求、权限请求和新窗口。
静态资源解析限制在打包的 `dist` 目录。业务表结构及 JSON 备份格式保持不变。

依据：[Electron 安全指南](https://www.electronjs.org/docs/latest/tutorial/security)、[自定义协议 API](https://www.electronjs.org/docs/latest/api/protocol)、[Windows 安装器配置](https://www.electron.build/nsis/)。
