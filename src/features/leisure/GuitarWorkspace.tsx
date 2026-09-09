import { useState, type FormEvent } from 'react'
import type { GuitarPracticePlan, GuitarTrack } from '../../types/domain'
import { GuitarPracticeForm } from './GuitarPracticeForm'

interface GuitarWorkspaceProps {
  tracks: GuitarTrack[]
  practices: GuitarPracticePlan[]
  onTrackCreate(input: Omit<GuitarTrack, 'id' | 'createdAt' | 'updatedAt'>): Promise<unknown>
  onTrackUpdate(id: string, changes: Partial<GuitarTrack>): Promise<unknown>
  onTrackDelete(id: string): Promise<unknown>
  onPracticeCreate(
    input: Omit<GuitarPracticePlan, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<unknown>
  onPracticeUpdate(id: string, changes: Partial<GuitarPracticePlan>): Promise<unknown>
  onPracticeDelete(id: string): Promise<unknown>
}

export function GuitarWorkspace({
  tracks,
  practices,
  onTrackCreate,
  onTrackUpdate,
  onTrackDelete,
  onPracticeCreate,
  onPracticeUpdate,
  onPracticeDelete,
}: GuitarWorkspaceProps) {
  const [title, setTitle] = useState('')

  async function create(event: FormEvent) {
    event.preventDefault()
    await onTrackCreate({ title, status: 'wishlist', progress: 0 })
    setTitle('')
  }

  return (
    <div className="research-tab-content">
      <article className="panel">
        <div className="panel__heading">
          <div>
            <span className="eyebrow">REPERTOIRE</span>
            <h2>曲目清单</h2>
          </div>
        </div>
        <form className="inline-create" onSubmit={create}>
          <input
            aria-label="吉他曲目名称"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="添加想学的曲目"
            required
            value={title}
          />
          <button className="primary-button" type="submit">
            添加曲目
          </button>
        </form>
        <div className="track-grid">
          {tracks.map((track) => (
            <article key={track.id}>
              <input
                aria-label={`编辑曲目：${track.title}`}
                defaultValue={track.title}
                onBlur={(event) => void onTrackUpdate(track.id, { title: event.target.value })}
              />
              <select
                aria-label={`“${track.title}”学习状态`}
                onChange={(event) =>
                  void onTrackUpdate(track.id, {
                    status: event.target.value as GuitarTrack['status'],
                  })
                }
                value={track.status}
              >
                <option value="wishlist">想学</option>
                <option value="learning">学习中</option>
                <option value="mastered">已掌握</option>
              </select>
              <label>
                掌握度 {track.progress}%
                <input
                  aria-label={`“${track.title}”掌握度`}
                  max="100"
                  min="0"
                  onChange={(event) =>
                    void onTrackUpdate(track.id, { progress: Number(event.target.value) })
                  }
                  type="range"
                  value={track.progress}
                />
              </label>
              <textarea
                aria-label={`编辑曲目备注：${track.title}`}
                defaultValue={track.note}
                onBlur={(event) =>
                  void onTrackUpdate(track.id, { note: event.target.value || undefined })
                }
                placeholder="练习提示、难点或参考版本"
                rows={2}
              />
              <button
                className="text-danger"
                onClick={() => void onTrackDelete(track.id)}
                type="button"
              >
                删除
              </button>
            </article>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel__heading">
          <div>
            <span className="eyebrow">PRACTICE</span>
            <h2>练习计划</h2>
          </div>
        </div>
        <GuitarPracticeForm onSubmit={onPracticeCreate} tracks={tracks} />
        <ul className="record-list">
          {practices.map((practice) => (
            <li key={practice.id}>
              <input
                aria-label={`完成吉他练习：${practice.title}`}
                checked={practice.status === 'completed'}
                onChange={() =>
                  void onPracticeUpdate(practice.id, {
                    status: practice.status === 'completed' ? 'pending' : 'completed',
                  })
                }
                type="checkbox"
              />
              <span>
                <strong>{practice.title}</strong>
                <small>
                  {practice.date} · {practice.durationMinutes} 分钟 · {practice.focus || '自由练习'}
                </small>
                <div className="record-edit-grid">
                  <input
                    aria-label={`编辑吉他练习名称：${practice.title}`}
                    defaultValue={practice.title}
                    onBlur={(event) =>
                      void onPracticeUpdate(practice.id, { title: event.target.value })
                    }
                  />
                  <input
                    aria-label={`编辑吉他练习日期：${practice.title}`}
                    defaultValue={practice.date}
                    onBlur={(event) =>
                      void onPracticeUpdate(practice.id, { date: event.target.value })
                    }
                    type="date"
                  />
                  <input
                    aria-label={`编辑吉他练习时长：${practice.title}`}
                    defaultValue={practice.durationMinutes}
                    min="1"
                    onBlur={(event) =>
                      void onPracticeUpdate(practice.id, {
                        durationMinutes: Number(event.target.value),
                      })
                    }
                    type="number"
                  />
                </div>
                <textarea
                  aria-label={`编辑吉他练习重点：${practice.title}`}
                  defaultValue={practice.focus}
                  onBlur={(event) =>
                    void onPracticeUpdate(practice.id, {
                      focus: event.target.value || undefined,
                    })
                  }
                />
              </span>
              <button
                className="text-danger"
                onClick={() => void onPracticeDelete(practice.id)}
                type="button"
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      </article>
    </div>
  )
}
