import type { RecordTable } from './records'
export interface Field { key: string; label: string; kind: 'text' | 'note' | 'number' | 'date' | 'choice' | 'parent'; optional?: boolean; values?: string[]; labels?: string[]; parent?: RecordTable; initial?: string }
export interface Form { title: string; description: string; table: RecordTable; fields: Field[]; children?: { title: string; table: string }[] }
const text = (key: string, label: string, optional = false): Field => ({ key, label, kind: 'text', optional })
const note = (key = 'note', label = '记录'): Field => ({ key, label, kind: 'note', optional: true })
const number = (key: string, label: string, initial = '0', optional = false): Field => ({ key, label, kind: 'number', initial, optional })
const date = (key = 'date', label = '日期', optional = false): Field => ({ key, label, kind: 'date', optional })
const choice = (key: string, label: string, values: string[], labels: string[]): Field => ({ key, label, kind: 'choice', values, labels })
const parent = (key: string, label: string, table: RecordTable, optional = false): Field => ({ key, label, kind: 'parent', parent: table, optional })
const priority = choice('priority', '优先级', ['medium', 'high', 'low'], ['中', '高', '低'])
const pending = choice('status', '状态', ['pending', 'completed'], ['待完成', '已完成'])
const progress = number('progress', '进度 %（0～100）')
const project = parent('projectId', '所属科研项目', 'researchProjects')
export const forms: Record<string, Form> = {
  temporaryTasks: { title: '临时任务', description: '安排日期、时间和优先级，自动进入今日计划。', table: 'temporaryTasks', fields: [text('title', '任务标题'), date(), text('time', '时间 HH:mm', true), priority, pending, note()] },
  literatureItems: { title: '文献阅读', description: '记录作者、阅读进度与笔记。', table: 'literatureItems', fields: [project, text('title', '文献标题'), text('authors', '作者', true), number('year', '年份', '', true), choice('status', '阅读状态', ['to-read', 'reading', 'read'], ['待阅读', '阅读中', '已读']), date('plannedDate', '计划阅读日期', true), priority, note('notes', '阅读笔记')] },
  experiments: { title: '实验记录', description: '记录计划、过程、结果和下一步。', table: 'experiments', fields: [project, text('title', '实验名称'), date('plannedDate', '计划日期', true), choice('status', '状态', ['planned', 'running', 'completed'], ['计划中', '进行中', '已完成']), priority, note('plan', '实验计划'), note('process', '实验过程'), note('result', '实验结果'), note('nextSteps', '下一步')] },
  papers: { title: '论文写作', description: '管理论文进度、截止日期和章节修改项。', table: 'papers', fields: [project, text('title', '论文标题'), choice('status', '写作阶段', ['drafting', 'revising', 'completed'], ['起草', '修改', '完成']), date('deadline', '截止日期', true), progress], children: [{ title: '章节与修改项', table: 'paperSections' }] },
  paperSections: { title: '章节与修改项', description: '每一项关联到具体论文。', table: 'paperSections', fields: [parent('paperId', '所属论文', 'papers'), text('title', '标题'), choice('kind', '类型', ['section', 'revision'], ['章节', '修改项']), choice('status', '状态', ['pending', 'writing', 'completed'], ['待处理', '撰写中', '完成']), date('deadline', '截止日期', true), priority, progress, note('notes', '写作笔记')] },
  fitnessPlans: { title: '训练计划', description: '只管理训练安排和动作，不采集体征数据。', table: 'fitnessPlans', fields: [text('title', '训练主题'), date(), text('time', '时间 HH:mm', true), priority, pending], children: [{ title: '训练动作', table: 'fitnessExercises' }] },
  fitnessExercises: { title: '训练动作', description: '设置组数、次数或时长、重量和动作顺序。', table: 'fitnessExercises', fields: [parent('planId', '所属训练计划', 'fitnessPlans'), text('name', '动作名称'), number('sets', '组数', '3'), number('reps', '每组次数', '', true), number('durationMinutes', '时长（分钟）', '', true), number('weightKg', '重量（kg）', '', true), number('order', '排序编号'), note()] },
  dietEntries: { title: '饮食记录', description: '记录每餐食物和营养值；日汇总使用所填数值，不自动估算。', table: 'dietEntries', fields: [date(), choice('mealType', '餐次', ['breakfast', 'lunch', 'dinner', 'snack'], ['早餐', '午餐', '晚餐', '加餐']), text('foodName', '食物'), number('amount', '数量', '1'), { ...text('unit', '单位'), initial: '份' }, number('calories', '热量 kcal'), number('protein', '蛋白质 g'), number('carbs', '碳水 g'), number('fat', '脂肪 g'), note()] },
  leisureItems: { title: '娱乐记录', description: '游戏、视频、电影及其他兴趣活动的计划和进度。', table: 'leisureItems', fields: [text('title', '项目名称'), { ...text('category', '分类'), initial: '电影' }, choice('status', '状态', ['wishlist', 'in-progress', 'completed'], ['想体验', '进行中', '已完成']), date('plannedDate', '计划日期', true), priority, progress, note()], children: [{ title: '吉他曲目', table: 'guitarTracks' }, { title: '吉他练习', table: 'guitarPracticePlans' }] },
  guitarTracks: { title: '吉他曲目', description: '管理想学的曲目与掌握进度。', table: 'guitarTracks', fields: [text('title', '曲名'), choice('status', '状态', ['wishlist', 'learning', 'mastered'], ['想学', '学习中', '已掌握']), progress, note()], children: [{ title: '安排练习', table: 'guitarPracticePlans' }] },
  guitarPracticePlans: { title: '吉他练习', description: '安排练习日期、时长和练习重点。', table: 'guitarPracticePlans', fields: [parent('trackId', '关联曲目', 'guitarTracks', true), text('title', '练习主题'), date(), number('durationMinutes', '时长（分钟）', '30'), text('focus', '练习重点', true), priority, pending] },
}
export function getForm(key: string): Form {
  if (!Object.prototype.hasOwnProperty.call(forms, key)) throw new Error('不支持的业务模块')
  return forms[key]
}
export function localDate() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
