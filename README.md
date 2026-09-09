# 个人工作生活中心

可在 Windows 桌面和 Android 手机上离线使用的个人工作生活应用，包含首页总览、今日计划、自媒体、科研工作、健身计划、饮食记录、娱乐休闲、数据与设置八个模块。

## Windows 桌面版

双击 `release/PersonalLifeHub-Setup-1.0.0.exe`，按安装向导操作。应用自带运行环境，不需要浏览器、Node.js、pnpm、终端或本地服务器。详细说明见 [Windows 桌面版说明](docs/desktop-app.md)。

## Android 手机版

手机版采用 Capacitor 原生容器，拥有触控底部导航、安全区适配、Android 返回键和独立本地数据。Android Studio 环境配置、调试和 APK 生成步骤见 [Android 手机版说明](docs/mobile-app.md)。

```powershell
pnpm.cmd mobile:open
pnpm.cmd mobile:apk
```

手机、桌面版与浏览器版的数据彼此独立。跨设备迁移时，请在原设备的“数据与设置”中导出 JSON 备份，再在新设备导入。

## 开发与质量检查

```powershell
pnpm.cmd verify
pnpm.cmd verify:desktop
pnpm.cmd verify:mobile
```

浏览器开发服务器的运行方式见 [开发运行说明](docs/local-run.md)。

## 数据安全

业务数据保存在当前设备，不需要账号、云数据库或互联网连接。迁移设备、卸载手机 APP、清理应用数据或重装系统前，务必先导出备份。
