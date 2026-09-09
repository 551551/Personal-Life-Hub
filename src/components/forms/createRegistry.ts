import { Clapperboard, Dumbbell, FlaskConical, ListTodo, Salad, Sparkles, type LucideIcon } from 'lucide-react'

export type CreateType = 'temporary' | 'research' | 'media' | 'fitness' | 'diet' | 'leisure'
export interface CreateTypeDefinition { key: CreateType; label: string; description: string; icon: LucideIcon }
export const createTypes: CreateTypeDefinition[] = [
  { key: 'temporary', label: '临时事项', description: '加入指定日期的今日计划', icon: ListTodo },
  { key: 'research', label: '科研项目', description: '创建项目与科研工作区', icon: FlaskConical },
  { key: 'media', label: '自媒体内容', description: '从选题开始内容流程', icon: Clapperboard },
  { key: 'fitness', label: '健身计划', description: '安排训练与动作', icon: Dumbbell },
  { key: 'diet', label: '饮食记录', description: '记录餐次和营养', icon: Salad },
  { key: 'leisure', label: '娱乐内容', description: '游戏、视频、电影或自定义', icon: Sparkles },
]
