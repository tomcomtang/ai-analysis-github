'use client'

import clsx from 'clsx'

type Stage = 'idle' | 'searching' | 'analyzing' | 'generating' | 'done' | 'error'

type StageBarProps = {
  stage: Stage
}

export default function StageBar({ stage }: StageBarProps) {
  const steps: { key: Stage, label: string }[] = [
    { key: 'searching', label: '开始请求 GitHub' },
    { key: 'analyzing', label: '开始分析项目' },
    { key: 'generating', label: '正在输出项目' },
    { key: 'done', label: '完成' },
  ]
  const activeIndex = Math.max(steps.findIndex(s => s.key === stage), stage === 'error' ? 0 : -1)
  
  return (
    <div className="card p-4">
      <div className="w-full">
        <ol className="grid grid-cols-4 gap-2">
          {steps.map((s, idx) => {
            const active = idx <= activeIndex
            return (
            <li key={s.key} className={clsx('relative flex items-center gap-3 rounded-lg border p-3', active ? 'border-emerald-500 bg-emerald-900/20' : 'border-gray-700 bg-gray-800')}>
              <div className={clsx('h-6 w-6 shrink-0 rounded-full grid place-items-center text-xs font-semibold', active ? 'bg-emerald-600 text-white' : 'bg-gray-600 text-gray-300')}>{idx + 1}</div>
              <span className={clsx('text-sm', active ? 'text-emerald-300' : 'text-gray-400')}>{s.label}</span>
            </li>
            )
          })}
        </ol>
        {stage === 'error' && <div className="mt-2 text-sm text-red-400">发生错误</div>}
      </div>
    </div>
  )
}
