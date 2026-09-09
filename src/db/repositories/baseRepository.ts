import type { Table } from 'dexie'
import type { z } from 'zod'
import { withSaveStatus } from '../../services/saveStatus'

interface StoredRecord {
  id: string
  createdAt: string
  updatedAt: string
}

export class BaseRepository<T extends StoredRecord> {
  private readonly table: Table<T, string>
  private readonly schema: z.ZodType<T>

  constructor(
    table: Table<T, string>,
    schema: z.ZodType<T>,
  ) {
    this.table = table
    this.schema = schema
  }

  async create(input: Omit<T, keyof StoredRecord>) {
    return withSaveStatus(async () => {
      const now = new Date().toISOString()
      const record = this.schema.parse({
        ...input,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      })
      await this.table.add(record)
      return record
    })
  }

  async update(
    id: string,
    changes: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>,
  ) {
    return withSaveStatus(async () => {
      const current = await this.table.get(id)
      if (!current) throw new Error('找不到要更新的记录')
      const record = this.schema.parse({
        ...current,
        ...changes,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      })
      await this.table.put(record)
      return record
    })
  }

  async delete(id: string) {
    return withSaveStatus(() => this.table.delete(id))
  }

  get(id: string) {
    return this.table.get(id)
  }

  list() {
    return this.table.toArray()
  }
}
