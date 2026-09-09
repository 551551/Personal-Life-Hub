import type { DietEntry } from '../../types/domain'

const mealOptions: Array<{ label: string; value: DietEntry['mealType'] }> = [
  { label: '早餐', value: 'breakfast' },
  { label: '午餐', value: 'lunch' },
  { label: '晚餐', value: 'dinner' },
  { label: '加餐', value: 'snack' },
]

export function DietEntryItem({ entry, onDelete, onUpdate }: { entry: DietEntry; onDelete(): Promise<unknown>; onUpdate(changes: Partial<DietEntry>): Promise<unknown> }) {
  return <li><span><input aria-label={`编辑食物：${entry.foodName}`} defaultValue={entry.foodName} onBlur={(event) => void onUpdate({ foodName: event.target.value })} /><small>{entry.amount}{entry.unit}</small><details className="food-details"><summary>编辑详细营养</summary><div className="record-edit-grid"><select aria-label={`${entry.foodName} 餐次`} onChange={(event) => void onUpdate({ mealType: event.target.value as DietEntry['mealType'] })} value={entry.mealType}>{mealOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><input aria-label={`${entry.foodName} 分量`} defaultValue={entry.amount} min="0.01" onBlur={(event) => void onUpdate({ amount: Number(event.target.value) })} type="number" /><input aria-label={`${entry.foodName} 单位`} defaultValue={entry.unit} onBlur={(event) => void onUpdate({ unit: event.target.value })} /></div><div className="record-edit-grid"><input aria-label={`${entry.foodName} 蛋白质`} defaultValue={entry.protein} min="0" onBlur={(event) => void onUpdate({ protein: Number(event.target.value) })} type="number" /><input aria-label={`${entry.foodName} 碳水`} defaultValue={entry.carbs} min="0" onBlur={(event) => void onUpdate({ carbs: Number(event.target.value) })} type="number" /><input aria-label={`${entry.foodName} 脂肪`} defaultValue={entry.fat} min="0" onBlur={(event) => void onUpdate({ fat: Number(event.target.value) })} type="number" /></div><textarea aria-label={`${entry.foodName} 备注`} defaultValue={entry.note} onBlur={(event) => void onUpdate({ note: event.target.value || undefined })} rows={2} /></details></span><label>kcal<input aria-label={`${entry.foodName} 热量`} defaultValue={entry.calories} min="0" onBlur={(event) => void onUpdate({ calories: Number(event.target.value) })} type="number" /></label><button aria-label={`删除食物：${entry.foodName}`} className="text-danger" onClick={() => void onDelete()} type="button">删除</button></li>
}
