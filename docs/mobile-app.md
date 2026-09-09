# Android 手机版

## 当前实现

- Android 应用 ID：`com.personallifehub.app`
- 显示名称：个人中心
- 最低系统：Android 7（API 24）
- 数据存储：APP 内部 WebView 的 IndexedDB，仅保存在当前手机
- 网络权限：不申请 `INTERNET`，全部核心功能离线运行
- 导航：手机底部保留首页、今日、科研、健身和更多五个入口

手机 APP 与 Windows 桌面版的数据不会自动同步。可使用“数据与设置”中的完整 JSON 备份进行迁移。

## 首次准备 Android 构建环境

本项目使用 Android SDK Platform 36 编译，最低运行系统 API 24 不等于编译 SDK 版本。当前电脑已安装：

- Android Studio 2026.1.4.7：`D:\软件\Android Studio\android-studio`，桌面已有快捷方式。
- Microsoft OpenJDK 21：`C:\Users\木更\AppData\Local\Programs\Microsoft\jdk-21.0.12.1+1`。
- Android SDK：`C:\Users\木更\AppData\Local\Android\Sdk`，包含 Platform 36、Build Tools 35.0.0 / 36.0.0、Platform Tools 和命令行工具。
- Gradle 8.14.3：`D:\软件\.cache\gradle-runtime-8.14.3\gradle-8.14.3`。

用户环境变量已设置。新开终端后生效。Android Studio 的 Gradle JDK 请选择上述 JDK 21，不要选择 IDE 自带的 JDK 25。中文项目路径已通过 `android.overridePathCheck=true` 适配并实际完成构建。

安装来源为 [Android 官方](https://developer.android.com/studio) 和 [Microsoft 官方](https://learn.microsoft.com/en-us/java/openjdk/download)，下载文件已核验摘要。Gradle 使用镜像下载并核对 [官方 SHA256](https://gradle.org/release-checksums/)。

安装完成后打开 PowerShell：

```powershell
Set-Location -LiteralPath 'D:\软件\personal-life-hub'
pnpm.cmd mobile:open
```

该命令会构建网页资源、同步 Android 工程并在 Android Studio 中打开 `android` 目录。连接开启 USB 调试的手机或创建模拟器后，点击 Android Studio 的运行按钮即可安装测试。

## 生成测试 APK

```powershell
Set-Location -LiteralPath 'D:\软件\personal-life-hub'
pnpm.cmd mobile:apk
```

成功后文件位于：

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

Debug APK 适合自己测试或小范围分发。正式公开发布需要在 Android Studio 中创建并妥善保管签名密钥，生成签名后的 Release APK 或 AAB。

### 当前电脑已验证的构建方式

当前网络访问官方 Gradle 下载和 Google Maven 存在连接问题，普通 `mobile:apk` 命令可能仍受影响。本机使用已校验的本地 Gradle 和 Maven 镜像配置完成构建：

```powershell
Set-Location -LiteralPath 'D:\软件\personal-life-hub'
$env:JAVA_HOME = 'C:\Users\木更\AppData\Local\Programs\Microsoft\jdk-21.0.12.1+1'
$env:ANDROID_HOME = 'C:\Users\木更\AppData\Local\Android\Sdk'
pnpm.cmd mobile:sync
if ($LASTEXITCODE -ne 0) { throw '资源同步失败' }
& 'D:\软件\.cache\gradle-runtime-8.14.3\gradle-8.14.3\bin\gradle.bat' -p D:\PersonalLifeHub\android -g D:\AndroidGradleCache :app:testDebugUnitTest :app:assembleDebug --no-daemon --console=plain -I 'D:\软件\.cache\android-cn-mirror.init.gradle'
```

镜像配置使用阿里云 Google Maven / Maven Central 镜像；不改变项目内官方仓库配置。请保留以上 Gradle 目录及 init 文件，换电脑时需要重新准备环境。本机已创建两个英文路径目录联接，避免 Gradle 测试进程无法加载中文路径中的类：`D:\PersonalLifeHub` 指向项目，`D:\AndroidGradleCache` 指向用户 `.gradle` 缓存。它们不复制或移动原文件，请勿递归清理这些联接目录。

交付安装包：`release\PersonalLifeHub-Android-1.1.0-debug.apk`。复制到 Android 7 或更高版本的手机后打开，按系统提示允许该来源安装。已执行构建和 APK 签名校验；尚未进行手机或模拟器上的安装运行验证。

本次验证：`:app:testDebugUnitTest` 通过（1 个测试，0 失败、0 跳过），`:app:assembleDebug` 成功，APK v2 签名验证通过。交付 APK 的 SHA256 为 `A1B4647DF469AB342EBB38A61C3CDA53EF02C6B065F1A15DDDA5D8A3F22B1B3F`。

## 每次修改应用后的同步流程

```powershell
pnpm.cmd mobile:sync
```

此命令重新构建 `dist`，再把最新页面资源和 Capacitor 插件配置复制到 Android 工程。

## 数据与卸载

使用相同应用 ID、相同签名且版本符合系统升级要求的新包覆盖安装，通常会保留数据。测试版后续更新需要保留本机 `%USERPROFILE%\.android\debug.keystore`；正式发布应使用妥善备份的专用签名密钥。Android 卸载 APP 会删除其内部数据，因此卸载、换手机或清理 APP 存储前必须先导出备份。重新安装后可在“数据与设置”中导入备份。

## iPhone 说明

当前代码和响应式界面已兼容手机浏览器与安全区，但生成 iPhone 原生安装包必须使用 macOS、Xcode 26 或更高版本以及 Apple 开发者签名环境。Windows 无法本地完成 iOS 构建。
