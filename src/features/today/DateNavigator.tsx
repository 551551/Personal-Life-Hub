import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addBusinessDays, formatBusinessDate, todayBusinessDate } from './date'

interface DateNavigatorProps {
  date: string
  onChange(date: string): void
}

export function DateNavigator({ date, onChange }: DateNavigatorProps) {
  return (
    <div className="date-navigator" aria-label="计划日期">
      <button
        aria-label="前一天"
        className="icon-button"
        onClick={() => onChange(addBusinessDays(date, -1))}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={19} />
      </button>
      <label>
        <span className="sr-only">选择日期</span>
        <input
          aria-label="选择日期"
          onChange={(event) => onChange(event.target.value)}
          type="date"
          value={date}
        />
      </label>
      <strong>{formatBusinessDate(date)}</strong>
      <button
        className="text-button"
        onClick={() => onChange(todayBusinessDate())}
        type="button"
      >
        回到今天
      </button>
      <button
        aria-label="后一天"
        className="icon-button"
        onClick={() => onChange(addBusinessDays(date, 1))}
        type="button"
      >
        <ChevronRight aria-hidden="true" size={19} />
      </button>
    </div>
  )
}
