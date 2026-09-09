import { MAX_IMPORT_BYTES } from './backup'
interface Failure { errMsg?: string }
interface Callbacks<T> { success(value: T): void; fail(error: Failure): void }
export interface FilePort {
  env: { USER_DATA_PATH: string }
  getFileSystemManager(): {
    readFile(options: { filePath: string; encoding: 'utf8' } & Callbacks<{ data: string | ArrayBuffer }>): void
    writeFile(options: { filePath: string; data: string; encoding: 'utf8' } & Callbacks<unknown>): void
  }
  chooseMessageFile(options: { count: number; type: 'file'; extension: string[] } & Callbacks<{ tempFiles: { path: string; size: number }[] }>): void
  shareFileMessage?(options: { filePath: string; fileName: string } & Callbacks<unknown>): void
}
export function createFiles(wx: FilePort) {
  const read = (path: string) => new Promise<string>((resolve, reject) => wx.getFileSystemManager().readFile({ filePath: path, encoding: 'utf8', success: result => typeof result.data === 'string' ? resolve(result.data) : reject(new Error('备份不是文本文件')), fail: () => reject(new Error('无法读取文件')) }))
  return {
    async choose(): Promise<string | null> {
      const file = await new Promise<{ path: string; size: number } | null>((resolve, reject) => wx.chooseMessageFile({ count: 1, type: 'file', extension: ['json'], success: result => resolve(result.tempFiles[0] || null), fail: error => error.errMsg?.includes('cancel') ? resolve(null) : reject(new Error('无法选择文件，请在手机微信中重试')) }))
      if (!file) return null
      if (!Number.isFinite(file.size) || file.size < 0 || file.size > MAX_IMPORT_BYTES) throw new Error('备份文件不能超过 10 MB')
      return read(file.path)
    },
    async export(text: string): Promise<string> {
      const name = `personal-life-hub-${Date.now()}.json`
      const path = `${wx.env.USER_DATA_PATH}/${name}`
      await new Promise((resolve, reject) => wx.getFileSystemManager().writeFile({ filePath: path, data: text, encoding: 'utf8', success: resolve, fail: () => reject(new Error('无法生成备份文件，请检查文件存储空间')) }))
      if (await read(path) !== text) throw new Error('备份文件校验失败，请重新导出')
      if (typeof wx.shareFileMessage !== 'function') return '已生成本地备份，但此环境不能发送文件，请在手机微信中导出。'
      return new Promise((resolve, reject) => wx.shareFileMessage!({ filePath: path, fileName: name, success: () => resolve('备份已通过微信发送，请妥善保存。'), fail: error => error.errMsg?.includes('cancel') ? resolve('已取消发送；本地文件已生成，但尚未保存到微信会话。') : reject(new Error('备份文件已生成，但发送失败，请重试')) }))
    },
  }
}
