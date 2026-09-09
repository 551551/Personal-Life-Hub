import { AlertTriangle, Check, CloudOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import {
  getSaveSnapshot,
  subscribeToSaveStatus,
} from '../../services/saveStatus'

const labels = {
  idle: '尚无需要保存的更改',
  saving: '正在保存到本机',
  saved: '已保存到本机',
  error: '保存失败，请重试',
}

export function SaveStatus() {
  const snapshot = useSyncExternalStore(
    subscribeToSaveStatus,
    getSaveSnapshot,
    getSaveSnapshot,
  )
  const Icon = snapshot.state === 'error' ? AlertTriangle : Check

  return (
    <output className="sidebar__storage-status" aria-live="polite">
      {snapshot.state === 'idle' ? (
        <CloudOff aria-hidden="true" size={18} />
      ) : (
        <Icon aria-hidden="true" size={18} />
      )}
      <span>
        <strong>数据仅保存在本机</strong>
        <small title={snapshot.message}>{labels[snapshot.state]}</small>
      </span>
    </output>
  )
}
