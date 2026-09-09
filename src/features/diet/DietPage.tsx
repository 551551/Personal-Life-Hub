import { useLiveQuery } from 'dexie-react-hooks'
import { Flame, Salad, Wheat, Droplets } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import type { DietEntry } from '../../types/domain'
import { DateNavigator } from '../today/DateNavigator'
import { todayBusinessDate } from '../today/date'
import { dietRepository } from './dietRepository'
import { DietEntryItem } from './DietEntryItem'
import { FoodEntryForm } from './FoodEntryForm'
import { summarizeNutrition } from './nutritionSummary'

const mealLabels: Record<DietEntry['mealType'], string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }
export function DietPage() {
  const { date: routeDate } = useParams(); const navigate = useNavigate(); const date = routeDate ?? todayBusinessDate(); const entries = useLiveQuery(() => dietRepository.listByDate(date), [date]) ?? []; const totals = summarizeNutrition(entries)
  const nutrients = [{ key: 'calories', label: '热量', unit: 'kcal', icon: Flame }, { key: 'protein', label: '蛋白质', unit: 'g', icon: Salad }, { key: 'carbs', label: '碳水', unit: 'g', icon: Wheat }, { key: 'fat', label: '脂肪', unit: 'g', icon: Droplets }] as const
  return <section className="page-stack"><div className="page-heading"><div><span className="eyebrow">NUTRITION LOG</span><h1>饮食记录</h1><p>按餐次记录食物，当日营养自动汇总。</p></div><DateNavigator date={date} onChange={(next) => navigate(`/diet/${next}`)} /></div><div className="nutrition-grid">{nutrients.map(({ key, label, unit, icon: Icon }) => <div key={key}><Icon aria-hidden="true" /><span><strong>{Number(totals[key].toFixed(1))}</strong>{label} · {unit}</span></div>)}</div><article className="panel"><div className="panel__heading"><div><span className="eyebrow">ADD FOOD</span><h2>记录食物</h2></div></div><FoodEntryForm date={date} onSubmit={(input) => dietRepository.create(input)} /></article><div className="meal-grid">{(Object.keys(mealLabels) as DietEntry['mealType'][]).map((meal) => <article className="panel" key={meal}><div className="panel__heading"><div><span className="eyebrow">MEAL</span><h2>{mealLabels[meal]}</h2></div><span className="subtle">{entries.filter((item) => item.mealType === meal).length} 项</span></div><ul className="food-list">{entries.filter((item) => item.mealType === meal).map((item) => <DietEntryItem entry={item} key={item.id} onDelete={() => dietRepository.delete(item.id)} onUpdate={(changes) => dietRepository.update(item.id, changes)} />)}</ul>{entries.every((item) => item.mealType !== meal) ? <p className="empty-inline">尚无记录。</p> : null}</article>)}</div></section>
}
