interface ModulePlaceholderProps {
  title: string
}

export function ModulePlaceholder({ title }: ModulePlaceholderProps) {
  return (
    <section className="module-placeholder">
      <p className="module-placeholder__eyebrow">个人工作生活中心</p>
      <h1>{title}</h1>
      <p>该模块将在后续任务中接入专用数据和操作。</p>
    </section>
  )
}
