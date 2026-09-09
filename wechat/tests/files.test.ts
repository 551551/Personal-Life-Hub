import { expect, it } from 'vitest'
import { createFiles, type FilePort } from '../core/files'
function port() {
  const files = new Map<string, string>()
  const wx: FilePort = {
    env: { USER_DATA_PATH: '/test' },
    getFileSystemManager: () => ({ writeFile: o => { files.set(o.filePath, o.data); o.success({}) }, readFile: o => o.success({ data: files.get(o.filePath) || '' }) }),
    chooseMessageFile: o => o.fail({ errMsg: 'chooseMessageFile:fail cancel' }),
    shareFileMessage: o => o.success({}),
  }
  return { wx, files }
}
it('validates file readback before reporting an exported file', async () => {
  const { wx, files } = port()
  expect(await createFiles(wx).export('valid backup')).toContain('已通过微信发送')
  expect([...files.values()]).toEqual(['valid backup'])
})
it('does not report successful sharing on cancellation', async () => {
  const { wx } = port()
  wx.shareFileMessage = o => o.fail({ errMsg: 'shareFileMessage:fail cancel' })
  expect(await createFiles(wx).export('backup')).toContain('已取消')
  expect(await createFiles(wx).choose()).toBeNull()
})
it('rejects oversized files before reading their contents', async () => {
  const { wx } = port()
  wx.chooseMessageFile = o => o.success({ tempFiles: [{ path: '/oversized', size: 11 * 1024 * 1024 }] })
  wx.getFileSystemManager = () => { throw new Error('Must not read oversized file') }
  await expect(createFiles(wx).choose()).rejects.toThrow('10 MB')
})
