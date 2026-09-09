import { backupEnvelopeSchema } from './backupSchema'

export const MAX_BACKUP_SIZE = 10 * 1024 * 1024
export function parseBackupText(text: string) {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_SIZE) throw new Error('备份文件不能超过 10 MB')
  let value: unknown
  try { value = JSON.parse(text) } catch { throw new Error('备份文件不是有效的 JSON') }
  const result = backupEnvelopeSchema.safeParse(value)
  if (!result.success) throw new Error('备份文件无效、版本不兼容或数据字段不完整')
  return result.data
}
